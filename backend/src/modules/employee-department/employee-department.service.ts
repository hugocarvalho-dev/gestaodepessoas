import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEmployeeDepartmentDto, UpdateEmployeeDepartmentDto } from './dto/employee-department.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class EmployeeDepartmentService {
  private readonly logger = new Logger(EmployeeDepartmentService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, companyId: string) {
    try {
      const [data, total] = await Promise.all([
        this.prisma.employee_department.findMany({
          where: { employee: { company_id: companyId } },
          skip: pagination.skip,
          take: pagination.take,
          include: {
            employee: { include: { person: { select: { legal_name: true } } } },
            department: true,
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.employee_department.count({ where: { employee: { company_id: companyId } } }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching employee departments: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, companyId: string) {
    try {
      const employeeDepartment = await this.prisma.employee_department.findUnique({
        where: { id },
        include: {
          employee: true,
          department: true,
        },
      });

      if (!employeeDepartment || employeeDepartment.employee.company_id !== companyId) {
        throw new NotFoundException(`EmployeeDepartment with ID ${id} not found`);
      }

      return employeeDepartment;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error fetching employee department ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateEmployeeDepartmentDto, companyId: string) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: data.employee_id },
        select: { company_id: true },
      });

      if (!employee || employee.company_id !== companyId) {
        throw new BadRequestException('Employee not found in this company');
      }

      const employeeDepartment = await this.prisma.employee_department.create({
        data: {
          employee_id: data.employee_id,
          department_id: data.department_id,
          start_date: new Date(data.start_date),
          end_date: data.end_date ? new Date(data.end_date) : null,
          is_primary: data.is_primary,
        },
        include: {
          employee: true,
          department: true,
        },
      });

      this.logger.log(`EmployeeDepartment created: ${employeeDepartment.id}`);
      return employeeDepartment;
    } catch (error) {
      this.logger.error(`Error creating employee department: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: UpdateEmployeeDepartmentDto, companyId: string) {
    try {
      const existing = await this.prisma.employee_department.findUnique({
        where: { id },
        include: { employee: { select: { company_id: true } } },
      });

      if (!existing || existing.employee.company_id !== companyId) {
        throw new NotFoundException(`EmployeeDepartment with ID ${id} not found`);
      }

      const employeeDepartment = await this.prisma.employee_department.update({
        where: { id },
        data: {
          ...(data.start_date && { start_date: new Date(data.start_date) }),
          ...(data.end_date !== undefined && {
            end_date: data.end_date ? new Date(data.end_date) : null,
          }),
          ...(data.is_primary !== undefined && { is_primary: data.is_primary }),
        },
        include: {
          employee: true,
          department: true,
        },
      });

      this.logger.log(`EmployeeDepartment updated: ${id}`);
      return employeeDepartment;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`EmployeeDepartment with ID ${id} not found`);
      }
      this.logger.error(`Error updating employee department ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      const existing = await this.prisma.employee_department.findUnique({
        where: { id },
        include: { employee: { select: { company_id: true } } },
      });

      if (!existing || existing.employee.company_id !== companyId) {
        throw new NotFoundException(`EmployeeDepartment with ID ${id} not found`);
      }

      await this.prisma.employee_department.delete({
        where: { id },
      });

      this.logger.log(`EmployeeDepartment deleted: ${id}`);
      return { message: 'EmployeeDepartment deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`EmployeeDepartment with ID ${id} not found`);
      }
      this.logger.error(`Error deleting employee department ${id}: ${error.message}`);
      throw error;
    }
  }
}
