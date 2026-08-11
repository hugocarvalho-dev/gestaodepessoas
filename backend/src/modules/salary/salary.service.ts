import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSalaryDto, UpdateSalaryDto } from './dto/salary.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class SalaryService {
  private readonly logger = new Logger(SalaryService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, companyId: string) {
    try {
      const [data, total] = await Promise.all([
        this.prisma.salary.findMany({
          where: {
            contract: {
              employee: { company_id: companyId },
            },
          },
          skip: pagination.skip,
          take: pagination.take,
          include: { contract: true },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.salary.count({
          where: {
            contract: {
              employee: { company_id: companyId },
            },
          },
        }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching salaries: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, companyId: string) {
    try {
      const salary = await this.prisma.salary.findUnique({
        where: { id },
        include: { contract: { include: { employee: true } } },
      });

      if (!salary) {
        throw new NotFoundException(`Salary with ID ${id} not found`);
      }

      if (salary.contract.employee.company_id !== companyId) {
        throw new BadRequestException('Salary does not belong to this company');
      }

      return salary;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Error fetching salary ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateSalaryDto, companyId: string) {
    try {
      // Verify contract belongs to company
      const contract = await this.prisma.contract.findUnique({
        where: { id: data.contract_id },
        include: { employee: true },
      });

      if (!contract || contract.employee.company_id !== companyId) {
        throw new BadRequestException('Contract does not belong to this company');
      }

      const salary = await this.prisma.salary.create({
        data: {
          contract_id: data.contract_id,
          amount: data.amount,
          currency: data.currency,
          start_date: new Date(data.start_date),
          end_date: data.end_date ? new Date(data.end_date) : null,
        },
        include: { contract: true },
      });

      this.logger.log(`Salary created: ${salary.id}`);
      return salary;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error creating salary: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: UpdateSalaryDto, companyId: string) {
    try {
      const salary = await this.prisma.salary.findUnique({
        where: { id },
        include: { contract: { include: { employee: true } } },
      });

      if (!salary || salary.contract.employee.company_id !== companyId) {
        throw new BadRequestException('Salary does not belong to this company');
      }

      const updateData = data as any;
      const updated = await this.prisma.salary.update({
        where: { id },
        data: {
          ...(updateData.amount && { amount: updateData.amount }),
          ...(updateData.currency && { currency: updateData.currency }),
          ...(updateData.start_date && { start_date: new Date(updateData.start_date) }),
          ...(updateData.end_date !== undefined && {
            end_date: updateData.end_date ? new Date(updateData.end_date) : null,
          }),
        },
        include: { contract: true },
      });

      this.logger.log(`Salary updated: ${id}`);
      return updated;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error.code === 'P2025') {
        throw new NotFoundException(`Salary with ID ${id} not found`);
      }
      this.logger.error(`Error updating salary ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      const salary = await this.prisma.salary.findUnique({
        where: { id },
        include: { contract: { include: { employee: true } } },
      });

      if (!salary || salary.contract.employee.company_id !== companyId) {
        throw new BadRequestException('Salary does not belong to this company');
      }

      await this.prisma.salary.delete({
        where: { id },
      });

      this.logger.log(`Salary deleted: ${id}`);
      return { message: 'Salary deleted successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error.code === 'P2025') {
        throw new NotFoundException(`Salary with ID ${id} not found`);
      }
      this.logger.error(`Error deleting salary ${id}: ${error.message}`);
      throw error;
    }
  }
}
