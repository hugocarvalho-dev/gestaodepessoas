import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEmployeeSkillDto } from './dto/employee-skill.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class EmployeeSkillService {
  private readonly logger = new Logger(EmployeeSkillService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, companyId: string) {
    try {
      const [data, total] = await Promise.all([
        this.prisma.employee_skill.findMany({
          where: { employee: { company_id: companyId } },
          skip: pagination.skip,
          take: pagination.take,
          include: { skill: true },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.employee_skill.count({ where: { employee: { company_id: companyId } } }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching employee skills: ${error.message}`);
      throw error;
    }
  }

  async findByEmployee(employeeId: string, pagination: PaginationDto) {
    try {
      const [data, total] = await Promise.all([
        this.prisma.employee_skill.findMany({
          where: { employee_id: employeeId },
          skip: pagination.skip,
          take: pagination.take,
          include: { skill: true },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.employee_skill.count({ where: { employee_id: employeeId } }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching employee skills: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateEmployeeSkillDto, companyId: string) {
    try {
      const createData = data as any;
      const employee = await this.prisma.employee.findUnique({
        where: { id: createData.employee_id },
        select: { company_id: true },
      });

      if (!employee || employee.company_id !== companyId) {
        throw new BadRequestException('Employee not found in this company');
      }

      const profLevel = typeof createData.proficiency_level === 'number' ? createData.proficiency_level : 2;
      const employeeSkill = await this.prisma.employee_skill.create({
        data: {
          employee_id: createData.employee_id,
          skill_id: createData.skill_id,
          proficiency_level: profLevel,
        },
        include: { skill: true },
      });

      this.logger.log(`Employee skill created: ${employeeSkill.id}`);
      return employeeSkill;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Employee or Skill not found');
      }
      this.logger.error(`Error creating employee skill: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: any, companyId: string) {
    try {
      const existing = await this.prisma.employee_skill.findUnique({
        where: { id },
        include: { employee: { select: { company_id: true } } },
      });

      if (!existing || existing.employee.company_id !== companyId) {
        throw new NotFoundException('Employee skill not found');
      }

      const employeeSkill = await this.prisma.employee_skill.update({
        where: { id },
        data: {
          ...(data.proficiency_level && { proficiency_level: data.proficiency_level }),
        },
        include: { skill: true },
      });

      this.logger.log(`Employee skill updated: ${id}`);
      return employeeSkill;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Employee skill not found');
      }
      this.logger.error(`Error updating employee skill: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      const existing = await this.prisma.employee_skill.findUnique({
        where: { id },
        include: { employee: { select: { company_id: true } } },
      });

      if (!existing || existing.employee.company_id !== companyId) {
        throw new NotFoundException('Employee skill not found');
      }

      await this.prisma.employee_skill.delete({ where: { id } });
      this.logger.log(`Employee skill deleted: ${id}`);
      return { message: 'Employee skill deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Employee skill not found');
      }
      this.logger.error(`Error deleting employee skill: ${error.message}`);
      throw error;
    }
  }
}
