import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCostCenterDto, UpdateCostCenterDto } from './dto/cost-center.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class CostCenterService {
  private readonly logger = new Logger(CostCenterService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, companyId: string) {
    try {
      const where = { company_id: companyId };

      const [data, total] = await Promise.all([
        this.prisma.cost_center.findMany({
          where,
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { name: 'asc' },
        }),
        this.prisma.cost_center.count({ where }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching cost centers: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, companyId: string) {
    try {
      const costCenter = await this.prisma.cost_center.findUnique({
        where: { id },
        include: {
          employee: {
            include: { person: true },
          },
        },
      });

      if (!costCenter || costCenter.company_id !== companyId) {
        throw new NotFoundException(`Cost Center with ID ${id} not found`);
      }

      return costCenter;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error fetching cost center ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateCostCenterDto, companyId: string) {
    try {
      const costCenter = await this.prisma.cost_center.create({
        data: {
          company_id: companyId,
          name: data.name,
          code: data.code,
          description: data.description,
        },
      });

      this.logger.log(`Cost Center created: ${costCenter.id}`);
      return costCenter;
    } catch (error) {
      this.logger.error(`Error creating cost center: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: UpdateCostCenterDto, companyId: string) {
    try {
      const existing = await this.prisma.cost_center.findUnique({ where: { id } });
      if (!existing || existing.company_id !== companyId) {
        throw new NotFoundException(`Cost Center with ID ${id} not found`);
      }

      const costCenter = await this.prisma.cost_center.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.code !== undefined && { code: data.code }),
          ...(data.description !== undefined && { description: data.description }),
        },
      });

      this.logger.log(`Cost Center updated: ${costCenter.id}`);
      return costCenter;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error updating cost center ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      const existing = await this.prisma.cost_center.findUnique({ where: { id } });
      if (!existing || existing.company_id !== companyId) {
        throw new NotFoundException(`Cost Center with ID ${id} not found`);
      }

      await this.prisma.cost_center.delete({ where: { id } });

      this.logger.log(`Cost Center deleted: ${id}`);
      return { deleted: true };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error deleting cost center ${id}: ${error.message}`);
      throw error;
    }
  }
}
