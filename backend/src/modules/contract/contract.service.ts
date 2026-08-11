import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateContractDto, UpdateContractDto } from './dto/contract.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, companyId: string) {
    try {
      const [data, total] = await Promise.all([
        this.prisma.contract.findMany({
          where: {
            employee: { company_id: companyId },
          },
          skip: pagination.skip,
          take: pagination.take,
          include: {
            employee: { include: { person: { select: { legal_name: true, photo_url: true } } } },
            salary: true,
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.contract.count({
          where: { employee: { company_id: companyId } },
        }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching contracts: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, companyId: string) {
    try {
      const contract = await this.prisma.contract.findUnique({
        where: { id },
        include: {
          employee: { include: { person: true } },
          salary: true,
        },
      });

      if (!contract) {
        throw new NotFoundException(`Contract with ID ${id} not found`);
      }

      if (contract.employee.company_id !== companyId) {
        throw new BadRequestException('Contract does not belong to this company');
      }

      return contract;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Error fetching contract ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateContractDto, companyId: string) {
    try {
      // Verify employee belongs to company
      const employee = await this.prisma.employee.findUnique({
        where: { id: data.employee_id },
      });

      if (!employee || employee.company_id !== companyId) {
        throw new BadRequestException('Employee does not belong to this company');
      }

      const contract = await this.prisma.contract.create({
        data: {
          employee_id: data.employee_id,
          contract_type: data.contract_type,
          work_hours: data.work_hours,
          payment_category: data.payment_category,
          start_date: new Date(data.start_date),
          end_date: data.end_date ? new Date(data.end_date) : null,
        },
        include: { employee: true },
      });

      this.logger.log(`Contract created: ${contract.id}`);
      return contract;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error creating contract: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: UpdateContractDto, companyId: string) {
    try {
      const contract = await this.prisma.contract.findUnique({
        where: { id },
        include: { employee: true },
      });

      if (!contract || contract.employee.company_id !== companyId) {
        throw new BadRequestException('Contract does not belong to this company');
      }

      const updated = await this.prisma.contract.update({
        where: { id },
        data: {
          ...(data.contract_type && { contract_type: data.contract_type }),
          ...(data.work_hours && { work_hours: data.work_hours }),
          ...(data.payment_category && { payment_category: data.payment_category }),
          ...(data.start_date && { start_date: new Date(data.start_date) }),
          ...(data.end_date !== undefined && {
            end_date: data.end_date ? new Date(data.end_date) : null,
          }),
        },
        include: { employee: true },
      });

      this.logger.log(`Contract updated: ${id}`);
      return updated;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error.code === 'P2025') {
        throw new NotFoundException(`Contract with ID ${id} not found`);
      }
      this.logger.error(`Error updating contract ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      const contract = await this.prisma.contract.findUnique({
        where: { id },
        include: { employee: true },
      });

      if (!contract || contract.employee.company_id !== companyId) {
        throw new BadRequestException('Contract does not belong to this company');
      }

      await this.prisma.contract.delete({
        where: { id },
      });

      this.logger.log(`Contract deleted: ${id}`);
      return { message: 'Contract deleted successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error.code === 'P2025') {
        throw new NotFoundException(`Contract with ID ${id} not found`);
      }
      this.logger.error(`Error deleting contract ${id}: ${error.message}`);
      throw error;
    }
  }
}
