import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePositionDto, UpdatePositionDto } from './dto/position.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class PositionService {
  private readonly logger = new Logger(PositionService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, companyId: string, search?: string) {
    try {
      const where: any = {
        company_id: companyId,
        deleted_at: null,
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.prisma.position.findMany({
          where,
          skip: pagination.skip,
          take: pagination.take,
          include: {
            company: { select: { name: true } },
            position_level: { select: { id: true, name: true } },
            employee_position: {
              where: { end_date: null },
              select: { id: true },
            },
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.position.count({ where }),
      ]);

      const mappedData = data.map((position) => ({
        ...position,
        employeeCount: position.employee_position.length,
      }));

      return new PaginatedResponse(mappedData, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching positions: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, companyId: string) {
    try {
      const position = await this.prisma.position.findUnique({
        where: { id },
        include: {
          company: true,
          position_level: { select: { id: true, name: true } },
          employee_position: {
            where: { end_date: null },
            include: { employee: { include: { person: true } } },
          },
        },
      });

      if (!position || position.deleted_at) {
        throw new NotFoundException(`Position with ID ${id} not found`);
      }

      if (position.company_id !== companyId) {
        throw new BadRequestException('Position does not belong to this company');
      }

      return {
        ...position,
        employeeCount: position.employee_position.length,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Error fetching position ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreatePositionDto, companyId: string) {
    try {
      if (data.company_id && data.company_id !== companyId) {
        throw new BadRequestException('Company ID mismatch');
      }

      const position = await this.prisma.position.create({
        data: {
          name: data.name,
          company_id: companyId,
          position_level_id: data.position_level_id || null,
          description: data.description,
        },
        include: {
          company: { select: { name: true } },
          position_level: { select: { id: true, name: true } },
        },
      });

      this.logger.log(`Position created: ${position.id}`);
      return position;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error.code === 'P2002') {
        throw new BadRequestException('Já existe um cargo com este nome e nível nesta empresa');
      }
      this.logger.error(`Error creating position: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: UpdatePositionDto, companyId: string) {
    try {
      const position = await this.prisma.position.findUnique({
        where: { id },
      });

      if (!position || position.deleted_at || position.company_id !== companyId) {
        throw new BadRequestException('Position not found or does not belong to this company');
      }

      const updated = await this.prisma.position.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.position_level_id !== undefined && { position_level_id: data.position_level_id || null }),
          ...(data.description !== undefined && { description: data.description }),
          updated_at: new Date(),
        },
        include: {
          company: { select: { name: true } },
          position_level: { select: { id: true, name: true } },
        },
      });

      this.logger.log(`Position updated: ${id}`);
      return updated;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error.code === 'P2002') {
        throw new BadRequestException('Já existe um cargo com este nome e nível nesta empresa');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Position with ID ${id} not found`);
      }
      this.logger.error(`Error updating position ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      const position = await this.prisma.position.findUnique({
        where: { id },
        include: {
          employee_position: {
            where: { end_date: null },
            select: { id: true },
          },
        },
      });

      if (!position || position.deleted_at || position.company_id !== companyId) {
        throw new BadRequestException('Position not found or does not belong to this company');
      }

      if (position.employee_position.length > 0) {
        throw new BadRequestException(
          `Não é possível excluir este cargo. Existem ${position.employee_position.length} funcionário(s) vinculado(s). Desvincule-os antes de excluir.`,
        );
      }

      await this.prisma.position.update({
        where: { id },
        data: { deleted_at: new Date() },
      });

      this.logger.log(`Position soft-deleted: ${id}`);
      return { message: 'Position deleted successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error.code === 'P2025') {
        throw new NotFoundException(`Position with ID ${id} not found`);
      }
      this.logger.error(`Error deleting position ${id}: ${error.message}`);
      throw error;
    }
  }
}
