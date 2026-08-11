import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateWorkExperienceDto } from './dto/work-experience.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class WorkExperienceService {
  private readonly logger = new Logger(WorkExperienceService.name);

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
        this.prisma.work_experience.findMany({
          where: { employee_id: employeeId },
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { start_date: 'desc' },
        }),
        this.prisma.work_experience.count({ where: { employee_id: employeeId } }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching work experience: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateWorkExperienceDto, companyId: string) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: data.employee_id },
        select: { company_id: true },
      });

      if (!employee || employee.company_id !== companyId) {
        throw new BadRequestException('Employee not found in this company');
      }

      const experience = await this.prisma.work_experience.create({
        data: {
          employee_id: data.employee_id,
          company_name: data.company_name,
          position_name: data.position_name,
          start_date: data.start_date ? new Date(data.start_date) : null,
          end_date: data.end_date ? new Date(data.end_date) : null,
          description: data.description,
          is_current: data.is_current,
        },
      });

      this.logger.log(`Work experience created: ${experience.id}`);
      return experience;
    } catch (error) {
      this.logger.error(`Error creating work experience: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: any, companyId: string) {
    try {
      const experience = await this.prisma.work_experience.findUnique({
        where: { id },
        include: { employee: { select: { company_id: true } } },
      });

      if (!experience || experience.employee.company_id !== companyId) {
        throw new NotFoundException('Work experience not found');
      }

      const updated = await this.prisma.work_experience.update({
        where: { id },
        data: {
          ...(data.company_name && { company_name: data.company_name }),
          ...(data.position_name && { position_name: data.position_name }),
          ...(data.start_date && { start_date: new Date(data.start_date) }),
          ...(data.end_date !== undefined && { end_date: data.end_date ? new Date(data.end_date) : null }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.is_current !== undefined && { is_current: data.is_current }),
        },
      });

      this.logger.log(`Work experience updated: ${id}`);
      return experience;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Work experience not found');
      }
      this.logger.error(`Error updating work experience: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      const experience = await this.prisma.work_experience.findUnique({
        where: { id },
        include: { employee: { select: { company_id: true } } },
      });

      if (!experience || experience.employee.company_id !== companyId) {
        throw new NotFoundException('Work experience not found');
      }

      await this.prisma.work_experience.delete({ where: { id } });
      this.logger.log(`Work experience deleted: ${id}`);
      return { message: 'Work experience deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Work experience not found');
      }
      this.logger.error(`Error deleting work experience: ${error.message}`);
      throw error;
    }
  }
}
