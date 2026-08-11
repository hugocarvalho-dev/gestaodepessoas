import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePersonalContactDto } from './dto/personal-contact.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class PersonalContactService {
  private readonly logger = new Logger(PersonalContactService.name);

  constructor(private prisma: PrismaService) {}

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
        this.prisma.personal_contact.findMany({
          where: { person_id: personId },
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.personal_contact.count({ where: { person_id: personId } }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching personal contacts: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreatePersonalContactDto, companyId: string) {
    try {
      const createData = data as any;
      const person = await this.prisma.person.findUnique({
        where: { id: createData.person_id },
        select: { employee: { where: { company_id: companyId } } },
      });

      if (!person || !person.employee || person.employee.length === 0) {
        throw new BadRequestException('Person not found in this company');
      }

      const contact = await (this.prisma.personal_contact.create as any)({
        data: {
          person_id: createData.person_id,
          contact_type: createData.contact_type,
          contact_value: createData.contact_value,
          is_primary: createData.is_primary || false,
          notes: createData.notes,
        },
      });

      this.logger.log(`Personal contact created: ${contact.id}`);
      return contact;
    } catch (error) {
      this.logger.error(`Error creating personal contact: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: any, companyId: string) {
    try {
      const contact = await (this.prisma.personal_contact.findUnique as any)({
        where: { id },
        include: { person: { select: { employee: { where: { company_id: companyId } } } } },
      });

      if (!contact || !contact.person || contact.person.employee.length === 0) {
        throw new NotFoundException('Personal contact not found');
      }

      const updated = await (this.prisma.personal_contact.update as any)({
        where: { id },
        data: {
          ...(data.contact_type && { contact_type: data.contact_type }),
          ...(data.contact_value && { contact_value: data.contact_value }),
          ...(data.is_primary !== undefined && { is_primary: data.is_primary }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      });

      this.logger.log(`Personal contact updated: ${id}`);
      return contact;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Personal contact not found');
      }
      this.logger.error(`Error updating personal contact: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      const contact = await (this.prisma.personal_contact.findUnique as any)({
        where: { id },
        include: { person: { select: { employee: { where: { company_id: companyId } } } } },
      });

      if (!contact || !contact.person || contact.person.employee.length === 0) {
        throw new NotFoundException('Personal contact not found');
      }

      await this.prisma.personal_contact.delete({ where: { id } });
      this.logger.log(`Personal contact deleted: ${id}`);
      return { message: 'Personal contact deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Personal contact not found');
      }
      this.logger.error(`Error deleting personal contact: ${error.message}`);
      throw error;
    }
  }
}
