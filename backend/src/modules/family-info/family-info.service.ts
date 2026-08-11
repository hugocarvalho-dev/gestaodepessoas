import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateFamilyInfoDto } from './dto/family-info.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class FamilyInfoService {
  private readonly logger = new Logger(FamilyInfoService.name);

  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    try {
      const familyInfo = await this.prisma.family_info.findUnique({
        where: { id },
      });

      if (!familyInfo) {
        throw new NotFoundException('Family info not found');
      }

      return familyInfo;
    } catch (error) {
      this.logger.error(`Error fetching family info: ${error.message}`);
      throw error;
    }
  }

  async findByPerson(personId: string, pagination: PaginationDto, companyId: string) {
    try {
      const person = await this.prisma.person.findUnique({
        where: { id: personId },
        select: { employee: { where: { company_id: companyId } } },
      });

      if (!person || !person.employee || person.employee.length === 0) {
        throw new NotFoundException('Person not found in this company');
      }

      const [data, total] = await Promise.all([
        this.prisma.family_info.findMany({
          where: { person_id: personId },
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.family_info.count({ where: { person_id: personId } }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching family info: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateFamilyInfoDto, companyId: string) {
    try {
      const createData = data as any;
      const person = await this.prisma.person.findUnique({
        where: { id: createData.person_id },
        select: { employee: { where: { company_id: companyId } } },
      });

      if (!person || !person.employee || person.employee.length === 0) {
        throw new BadRequestException('Person not found in this company');
      }

      const familyInfo = await this.prisma.family_info.create({
        data: {
          person_id: createData.person_id,
          marital_status: createData.marital_status || null,
          spouse_name: createData.spouse_name || null,
          spouse_birthday: createData.spouse_birthday ? new Date(createData.spouse_birthday) : null,
          number_of_dependents: createData.number_of_dependents != null ? Number(createData.number_of_dependents) : null,
        },
      });

      this.logger.log(`Family info created: ${familyInfo.id}`);
      return familyInfo;
    } catch (error) {
      this.logger.error(`Error creating family info: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: any, companyId: string) {
    try {
      const familyInfo = await this.prisma.family_info.findUnique({
        where: { id },
        include: { person: { select: { employee: { where: { company_id: companyId } } } } },
      });

      if (!familyInfo || !familyInfo.person || familyInfo.person.employee.length === 0) {
        throw new NotFoundException('Family info not found');
      }

      const updated = await this.prisma.family_info.update({
        where: { id },
        data: {
          ...(data.marital_status !== undefined && { marital_status: data.marital_status || null }),
          ...(data.spouse_name !== undefined && { spouse_name: data.spouse_name || null }),
          ...(data.spouse_birthday !== undefined && { spouse_birthday: data.spouse_birthday ? new Date(data.spouse_birthday) : null }),
          ...(data.number_of_dependents !== undefined && { number_of_dependents: data.number_of_dependents != null ? Number(data.number_of_dependents) : null }),
        },
      });

      this.logger.log(`Family info updated: ${id}`);
      return familyInfo;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Family info not found');
      }
      this.logger.error(`Error updating family info: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      const familyInfo = await this.prisma.family_info.findUnique({
        where: { id },
        include: { person: { select: { employee: { where: { company_id: companyId } } } } },
      });

      if (!familyInfo || !familyInfo.person || familyInfo.person.employee.length === 0) {
        throw new NotFoundException('Family info not found');
      }

      await this.prisma.family_info.delete({ where: { id } });
      this.logger.log(`Family info deleted: ${id}`);
      return { message: 'Family info deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Family info not found');
      }
      this.logger.error(`Error deleting family info: ${error.message}`);
      throw error;
    }
  }
}
