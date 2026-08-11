import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePositionLevelDto, UpdatePositionLevelDto } from './dto/position-level.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class PositionLevelService {
  private readonly logger = new Logger(PositionLevelService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    try {
      const data = await this.prisma.position_level.findMany({
        where: { company_id: companyId },
        orderBy: { name: 'asc' },
      });
      return PaginatedResponse.fromArray(data);
    } catch (error) {
      this.logger.error(`Error fetching position levels: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, companyId: string) {
    try {
      const level = await this.prisma.position_level.findUnique({ where: { id } });

      if (!level || level.company_id !== companyId) {
        throw new NotFoundException(`Position level with ID ${id} not found`);
      }

      return level;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error fetching position level ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreatePositionLevelDto, companyId: string) {
    try {
      const level = await this.prisma.position_level.create({
        data: {
          name: data.name,
          company_id: companyId,
        },
      });

      this.logger.log(`Position level created: ${level.id}`);
      return level;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException(`Nível "${data.name}" já existe nesta empresa`);
      }
      this.logger.error(`Error creating position level: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: UpdatePositionLevelDto, companyId: string) {
    try {
      const level = await this.prisma.position_level.findUnique({ where: { id } });

      if (!level || level.company_id !== companyId) {
        throw new NotFoundException(`Position level with ID ${id} not found`);
      }

      const updated = await this.prisma.position_level.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          updated_at: new Date(),
        },
      });

      this.logger.log(`Position level updated: ${id}`);
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error.code === 'P2002') {
        throw new BadRequestException(`Nível "${data.name}" já existe nesta empresa`);
      }
      this.logger.error(`Error updating position level ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      const level = await this.prisma.position_level.findUnique({
        where: { id },
        include: { position: { where: { deleted_at: null }, select: { id: true } } },
      });

      if (!level || level.company_id !== companyId) {
        throw new NotFoundException(`Position level with ID ${id} not found`);
      }

      if (level.position.length > 0) {
        throw new BadRequestException(
          `Não é possível excluir este nível. Existem ${level.position.length} cargo(s) vinculado(s).`,
        );
      }

      await this.prisma.position_level.delete({ where: { id } });

      this.logger.log(`Position level deleted: ${id}`);
      return { message: 'Position level deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Error deleting position level ${id}: ${error.message}`);
      throw error;
    }
  }
}
