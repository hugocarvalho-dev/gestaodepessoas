import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class SkillService {
  private readonly logger = new Logger(SkillService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, companyId: string) {
    try {
      const [data, total] = await Promise.all([
        this.prisma.skill.findMany({
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.skill.count(),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching skills: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, companyId: string) {
    try {
      const skill = await this.prisma.skill.findUnique({
        where: { id },
        include: {
          employee_skill: {
            include: { employee: { include: { person: true } } },
          },
        },
      });

      if (!skill) {
        throw new NotFoundException(`Skill with ID ${id} not found`);
      }

      return skill;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error fetching skill ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateSkillDto, companyId: string) {
    try {
      const skill = await this.prisma.skill.create({
        data: {
          name: data.name,
          category: data.category,
        },
      });

      this.logger.log(`Skill created: ${skill.id}`);
      return skill;
    } catch (error) {
      this.logger.error(`Error creating skill: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: UpdateSkillDto, companyId: string) {
    try {
      const updateData = data as any;
      const skill = await this.prisma.skill.update({
        where: { id },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.category !== undefined && { category: updateData.category }),
        },
      });

      this.logger.log(`Skill updated: ${id}`);
      return skill;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Skill with ID ${id} not found`);
      }
      this.logger.error(`Error updating skill ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      await this.prisma.skill.delete({
        where: { id },
      });

      this.logger.log(`Skill deleted: ${id}`);
      return { message: 'Skill deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Skill with ID ${id} not found`);
      }
      this.logger.error(`Error deleting skill ${id}: ${error.message}`);
      throw error;
    }
  }
}
