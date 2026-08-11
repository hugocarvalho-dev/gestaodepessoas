import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEducationDto } from './dto/education.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class EducationService {
  private readonly logger = new Logger(EducationService.name);

  constructor(private prisma: PrismaService) {}

  async findByEmployee(employeeId: string, pagination: PaginationDto, companyId: string) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        select: { company_id: true },
      });

      if (!employee || employee.company_id !== companyId) {
        throw new NotFoundException('Employee not found in this company');
      }

      const [data, total] = await Promise.all([
        this.prisma.education.findMany({
          where: { employee_id: employeeId },
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.education.count({ where: { employee_id: employeeId } }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching education records: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateEducationDto, companyId: string) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: data.employee_id },
        select: { company_id: true },
      });

      if (!employee || employee.company_id !== companyId) {
        throw new NotFoundException('Employee not found in this company');
      }

      const education = await this.prisma.education.create({
        data: {
          employee_id: data.employee_id,
          degree_level: data.degree_level,
          field_of_study: data.field_of_study,
          institution: data.institution,
        },
      });

      this.logger.log(`Education record created: ${education.id}`);
      return education;
    } catch (error) {
      this.logger.error(`Error creating education: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: any, companyId: string) {
    try {
      const education = await this.prisma.education.findUnique({ where: { id }, include: { employee: { select: { company_id: true } } } });

      if (!education || education.employee.company_id !== companyId) {
        throw new NotFoundException(`Education record not found`);
      }

      const updated = await this.prisma.education.update({
        where: { id },
        data: {
          ...(data.degree_level && { degree_level: data.degree_level }),
          ...(data.field_of_study && { field_of_study: data.field_of_study }),
          ...(data.institution && { institution: data.institution }),
          ...(data.graduation_date && { graduation_date: new Date(data.graduation_date) }),
        },
      });

      this.logger.log(`Education record updated: ${id}`);
      return education;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Education record not found`);
      }
      this.logger.error(`Error updating education: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      const education = await this.prisma.education.findUnique({ where: { id }, include: { employee: { select: { company_id: true } } } });

      if (!education || education.employee.company_id !== companyId) {
        throw new NotFoundException(`Education record not found`);
      }

      await this.prisma.education.delete({ where: { id } });
      this.logger.log(`Education record deleted: ${id}`);
      return { message: 'Education record deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Education record not found`);
      }
      this.logger.error(`Error deleting education: ${error.message}`);
      throw error;
    }
  }
}
