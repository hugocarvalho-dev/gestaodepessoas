import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class DepartmentService {
  private readonly logger = new Logger(DepartmentService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, companyId?: string) {
    try {
      const where = companyId ? { company_id: companyId } : {};
      const departmentInclude = {
        company: { select: { name: true } },
        employee_department: {
          where: { end_date: null },
          include: { employee: { include: { person: { select: { legal_name: true } } } } },
        },
        employee: { include: { person: { select: { legal_name: true } } } },
        department: { select: { id: true, name: true } },
      };

      const [data, total] = await Promise.all([
        this.prisma.department.findMany({
          where,
          skip: pagination.skip,
          take: pagination.take,
          include: {
            ...departmentInclude,
            other_department: {
              include: {
                ...departmentInclude,
                other_department: {
                  include: departmentInclude,
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.department.count({ where }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching departments: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, companyId: string) {
    try {
      const department = await this.prisma.department.findUnique({
        where: { id },
        include: {
          company: true,
          employee_department: {
            where: { end_date: null },
            include: { employee: { include: { person: true } } },
          },
        },
      });

      if (!department) {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }

      if (department.company_id !== companyId) {
        throw new BadRequestException('Department does not belong to this company');
      }

      return department;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Error fetching department ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateDepartmentDto, companyId: string) {
    try {
      if (data.company_id && data.company_id !== companyId) {
        throw new BadRequestException('Company ID mismatch');
      }

      const department = await this.prisma.department.create({
        data: {
          name: data.name,
          company_id: companyId,
          parent_department_id: data.parent_department_id,
          manager_employee_id: data.manager_employee_id,
        },
        include: { company: { select: { name: true } } },
      });

      this.logger.log(`Department created: ${department.id}`);
      return department;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error creating department: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: UpdateDepartmentDto, companyId: string) {
    try {
      const department = await this.prisma.department.findUnique({
        where: { id },
      });

      if (!department || department.company_id !== companyId) {
        throw new BadRequestException('Department does not belong to this company');
      }

      const updateData = data as any;
      const updated = await this.prisma.department.update({
        where: { id },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.parent_department_id !== undefined && { parent_department_id: updateData.parent_department_id }),
          ...(updateData.manager_employee_id !== undefined && { manager_employee_id: updateData.manager_employee_id }),
        },
        include: { company: { select: { name: true } } },
      });

      this.logger.log(`Department updated: ${id}`);
      return updated;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error.code === 'P2025') {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }
      this.logger.error(`Error updating department ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      const department = await this.prisma.department.findUnique({
        where: { id },
      });

      if (!department || department.company_id !== companyId) {
        throw new BadRequestException('Department does not belong to this company');
      }

      await this.prisma.department.delete({
        where: { id },
      });

      this.logger.log(`Department deleted: ${id}`);
      return { message: 'Department deleted successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error.code === 'P2025') {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }
      this.logger.error(`Error deleting department ${id}: ${error.message}`);
      throw error;
    }
  }

  async getEmployeesByDepartment(departmentId: string, pagination: PaginationDto, companyId: string) {
    try {
      const department = await this.prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department || department.company_id !== companyId) {
        throw new BadRequestException('Department does not belong to this company');
      }

      const [employees, total] = await Promise.all([
        this.prisma.employee_department.findMany({
          where: { department_id: departmentId, end_date: null },
          skip: pagination.skip,
          take: pagination.take,
          include: {
            employee: {
              include: { person: { select: { legal_name: true, preferred_name: true } } },
            },
          },
          orderBy: { start_date: 'desc' },
        }),
        this.prisma.employee_department.count({
          where: { department_id: departmentId, end_date: null },
        }),
      ]);

      const data = employees.map(ed => ed.employee);
      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error fetching department employees: ${error.message}`);
      throw error;
    }
  }
}
