import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEmployeeLanguageDto, ProficiencyLevel } from './dto/employee-language.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class EmployeeLanguageService {
  private readonly logger = new Logger(EmployeeLanguageService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, companyId: string) {
    try {
      const [data, total] = await Promise.all([
        this.prisma.employee_language.findMany({
          where: { employee: { company_id: companyId } },
          skip: pagination.skip,
          take: pagination.take,
          include: { language: true },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.employee_language.count({ where: { employee: { company_id: companyId } } }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching employee languages: ${error.message}`);
      throw error;
    }
  }

  async findByEmployee(employeeId: string, pagination: PaginationDto) {
    try {
      const [data, total] = await Promise.all([
        this.prisma.employee_language.findMany({
          where: { employee_id: employeeId },
          skip: pagination.skip,
          take: pagination.take,
          include: { language: true },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.employee_language.count({ where: { employee_id: employeeId } }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching employee languages: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateEmployeeLanguageDto, companyId: string) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: data.employee_id },
        select: { company_id: true },
      });

      if (!employee || employee.company_id !== companyId) {
        throw new BadRequestException('Employee not found in this company');
      }

      const employeeLanguage = await this.prisma.employee_language.create({
        data: {
          employee_id: data.employee_id,
          language_id: data.language_id,
          proficiency_level: data.proficiency_level || ProficiencyLevel.INTERMEDIARIO,
        },
        include: { language: true },
      });

      this.logger.log(`Employee language created: ${employeeLanguage.id}`);
      return employeeLanguage;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Employee or Language not found');
      }
      this.logger.error(`Error creating employee language: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: any, companyId: string) {
    try {
      const existing = await this.prisma.employee_language.findUnique({
        where: { id },
        include: { employee: { select: { company_id: true } } },
      });

      if (!existing || existing.employee.company_id !== companyId) {
        throw new NotFoundException('Employee language not found');
      }

      const employeeLanguage = await this.prisma.employee_language.update({
        where: { id },
        data: {
          ...(data.proficiency_level && { proficiency_level: data.proficiency_level }),
        },
        include: { language: true },
      });

      this.logger.log(`Employee language updated: ${id}`);
      return employeeLanguage;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Employee language not found');
      }
      this.logger.error(`Error updating employee language: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      const existing = await this.prisma.employee_language.findUnique({
        where: { id },
        include: { employee: { select: { company_id: true } } },
      });

      if (!existing || existing.employee.company_id !== companyId) {
        throw new NotFoundException('Employee language not found');
      }

      await this.prisma.employee_language.delete({ where: { id } });
      this.logger.log(`Employee language deleted: ${id}`);
      return { message: 'Employee language deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error.code === 'P2025') {
        throw new NotFoundException('Employee language not found');
      }
      this.logger.error(`Error deleting employee language: ${error.message}`);
      throw error;
    }
  }
}
