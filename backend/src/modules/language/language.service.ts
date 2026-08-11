import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/language.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class LanguageService {
  private readonly logger = new Logger(LanguageService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, companyId: string) {
    try {
      const [data, total] = await Promise.all([
        this.prisma.language.findMany({
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.language.count(),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching languages: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, companyId: string) {
    try {
      const language = await this.prisma.language.findUnique({
        where: { id },
        include: {
          employee_language: {
            include: { employee: { include: { person: true } } },
          },
        },
      });

      if (!language) {
        throw new NotFoundException(`Language with ID ${id} not found`);
      }

      return language;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error fetching language ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateLanguageDto, companyId: string) {
    try {
      const language = await this.prisma.language.create({
        data: {
          name: data.name,
        },
      });

      this.logger.log(`Language created: ${language.id}`);
      return language;
    } catch (error) {
      this.logger.error(`Error creating language: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: UpdateLanguageDto, companyId: string) {
    try {
      const language = await this.prisma.language.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
        },
      });

      this.logger.log(`Language updated: ${id}`);
      return language;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Language with ID ${id} not found`);
      }
      this.logger.error(`Error updating language ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      await this.prisma.language.delete({
        where: { id },
      });

      this.logger.log(`Language deleted: ${id}`);
      return { message: 'Language deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Language with ID ${id} not found`);
      }
      this.logger.error(`Error deleting language ${id}: ${error.message}`);
      throw error;
    }
  }
}
