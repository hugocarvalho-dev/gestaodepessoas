import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEmergencyContactDto } from './dto/emergency-contact.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class EmergencyContactService {
  private readonly logger = new Logger(EmergencyContactService.name);

  constructor(private prisma: PrismaService) {}

  async findByEmployee(employeeId: string, pagination: PaginationDto, companyId: string) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        select: { company_id: true, person_id: true },
      });

      if (!employee || employee.company_id !== companyId) {
        throw new NotFoundException('Employee not found in this company');
      }

      const [data, total] = await Promise.all([
        this.prisma.emergency_contact.findMany({
          where: { person_id: employee.person_id },
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.emergency_contact.count({ where: { person_id: employee.person_id } }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching emergency contacts: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateEmergencyContactDto, companyId: string) {
    try {
      const createData = data as any;
      const person = await this.prisma.person.findUnique({
        where: { id: createData.person_id },
        select: { employee: { where: { company_id: companyId } } },
      });

      if (!person || !person.employee || person.employee.length === 0) {
        throw new BadRequestException('Person not found in this company');
      }

      const contact = await (this.prisma.emergency_contact.create as any)({
        data: {
          person_id: createData.person_id,
          name: createData.name,
          relationship: createData.relationship,
          phone: createData.phone,
          phone_secondary: createData.phone_secondary || null,
          email: createData.email,
          is_primary: createData.is_primary ?? false,
        },
      });

      this.logger.log(`Emergency contact created: ${contact.id}`);
      return contact;
    } catch (error) {
      this.logger.error(`Error creating emergency contact: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: any, companyId: string) {
    try {
      const contact = await this.prisma.emergency_contact.findUnique({
        where: { id },
        include: { person: { select: { employee: { where: { company_id: companyId } } } } },
      });

      if (!contact || !contact.person || contact.person.employee.length === 0) {
        throw new NotFoundException('Emergency contact not found');
      }

      const updated = await this.prisma.emergency_contact.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.relationship !== undefined && { relationship: data.relationship || null }),
          ...(data.phone && { phone: data.phone }),
          ...(data.phone_secondary !== undefined && { phone_secondary: data.phone_secondary || null }),
          ...(data.email !== undefined && { email: data.email || null }),
          ...(data.is_primary !== undefined && { is_primary: data.is_primary }),
        },
      });

      this.logger.log(`Emergency contact updated: ${id}`);
      return updated;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Emergency contact not found`);
      }
      this.logger.error(`Error updating emergency contact: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      const contact = await this.prisma.emergency_contact.findUnique({
        where: { id },
        include: { person: { select: { employee: { where: { company_id: companyId } } } } },
      });

      if (!contact || !contact.person || contact.person.employee.length === 0) {
        throw new NotFoundException('Emergency contact not found');
      }

      await this.prisma.emergency_contact.delete({ where: { id } });
      this.logger.log(`Emergency contact deleted: ${id}`);
      return { message: 'Emergency contact deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Emergency contact not found`);
      }
      this.logger.error(`Error deleting emergency contact: ${error.message}`);
      throw error;
    }
  }
}
