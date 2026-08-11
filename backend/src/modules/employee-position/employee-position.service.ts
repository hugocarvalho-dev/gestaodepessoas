import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEmployeePositionDto, UpdateEmployeePositionDto } from './dto/employee-position.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class EmployeePositionService {
  private readonly logger = new Logger(EmployeePositionService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prisma.employee_position.findMany({
        skip: pagination.skip,
        take: pagination.take,
        include: { employee: true, position: true },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.employee_position.count(),
    ]);
    return new PaginatedResponse(data, total, pagination.skip, pagination.take);
  }

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
        this.prisma.employee_position.findMany({
          where: { employee_id: employeeId },
          skip: pagination.skip,
          take: pagination.take,
          include: { employee: true, position: true },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.employee_position.count({ where: { employee_id: employeeId } }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching employee positions: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateEmployeePositionDto, companyId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: data.employee_id },
      select: { company_id: true },
    });

    if (!employee || employee.company_id !== companyId) {
      throw new BadRequestException('Employee not found in this company');
    }

    return this.prisma.employee_position.create({
      data: {
        employee_id: data.employee_id,
        position_id: data.position_id,
        start_date: new Date(data.start_date),
        end_date: data.end_date ? new Date(data.end_date) : null,
      },
      include: { employee: true, position: true },
    });
  }

  async update(id: string, data: UpdateEmployeePositionDto, companyId: string) {
    const existing = await this.prisma.employee_position.findUnique({
      where: { id },
      include: { employee: { select: { company_id: true } } },
    });

    if (!existing || existing.employee.company_id !== companyId) {
      throw new NotFoundException('Record not found');
    }

    return this.prisma.employee_position.update({
      where: { id },
      data: {
        ...(data.start_date && { start_date: new Date(data.start_date) }),
        ...(data.end_date !== undefined && {
          end_date: data.end_date ? new Date(data.end_date) : null,
        }),
      },
    });
  }

  async remove(id: string, companyId: string) {
    const existing = await this.prisma.employee_position.findUnique({
      where: { id },
      include: { employee: { select: { company_id: true } } },
    });

    if (!existing || existing.employee.company_id !== companyId) {
      throw new NotFoundException('Record not found');
    }

    await this.prisma.employee_position.delete({ where: { id } });
    return { message: 'Record deleted' };
  }
}
