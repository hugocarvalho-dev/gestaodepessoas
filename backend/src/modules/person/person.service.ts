import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePersonDto, UpdatePersonDto } from './dto/person.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class PersonService {
  private readonly logger = new Logger(PersonService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    try {
      const [data, total] = await Promise.all([
        (this.prisma.person as any).findMany({
          skip: pagination.skip,
          take: pagination.take,
          select: {
            id: true,
            legal_name: true,
            preferred_name: true,
            date_of_birth: true,
            gender: true,
            nationality: true,
            government_id: true,
            passport: true,
            ssn: true,
            photo_url: true,
            personal_contact: {
              where: { is_primary: true },
              take: 1,
              select: {
                email: true,
                personal_email: true,
                phone: true,
                corporate_phone: true,
                address: true,
                address_number: true,
                city: true,
                state: true,
                country: true,
                postal_code: true,
                is_primary: true,
              },
            },
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.person.count(),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching persons: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const person = await (this.prisma.person as any).findUnique({
        where: { id },
        include: {
          personal_contact: true,
          emergency_contact: true,
          family_info: true,
          employee: {
            select: {
              id: true,
              company_id: true,
              employee_number: true,
              status: true,
            },
          },
        },
      });

      if (!person) {
        throw new NotFoundException(`Person with ID ${id} not found`);
      }

      return person;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Error fetching person ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreatePersonDto) {
    try {
      const legalName = `${data.first_name} ${data.last_name}`.trim().toUpperCase();
      const person = await (this.prisma.person as any).create({
        data: {
          legal_name: legalName,
          date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
          gender: data.gender,
          nationality: data.nationality,
          government_id: data.government_id,
          marital_status: data.marital_status,
          passport: data.rg,
          rg_issuer: data.rg_issuer,
          rg_state: data.rg_state,
          rg_issue_date: data.rg_issue_date ? new Date(data.rg_issue_date) : undefined,
          ssn: data.cnh,
          cnh_category: data.cnh_category,
          cnh_issue_date: data.cnh_issue_date ? new Date(data.cnh_issue_date) : undefined,
          cnh_expiry_date: data.cnh_expiry_date ? new Date(data.cnh_expiry_date) : undefined,
          cnh_issuer: data.cnh_issuer,
          cnh_state: data.cnh_state,
          mother_name: data.mother_name,
          ethnicity: data.ethnicity,
          pis: data.pis,
          education_level: data.education_level,
          has_food_intolerance: data.has_food_intolerance ?? false,
          food_intolerance: data.food_intolerance || null,
          has_medication_allergy: data.has_medication_allergy ?? false,
          medication_allergy: data.medication_allergy || null,
          photo_url: data.photo_url,
          personal_contact: data.contact
            ? {
                create: {
                  email: data.contact.email,
                  personal_email: data.contact.personal_email,
                  phone: data.contact.phone,
                  corporate_phone: data.contact.corporate_phone,
                  address: data.contact.address,
                  address_number: data.contact.address_number,
                  address_complement: data.contact.address_complement,
                  neighborhood: data.contact.neighborhood,
                  city: data.contact.city,
                  state: data.contact.state,
                  country: data.contact.country,
                  postal_code: data.contact.postal_code,
                  is_primary: true,
                },
              }
            : undefined,
        },
        select: {
          id: true,
          legal_name: true,
          date_of_birth: true,
          gender: true,
          government_id: true,
          passport: true,
          ssn: true,
          photo_url: true,
          personal_contact: {
            where: { is_primary: true },
            take: 1,
          },
          created_at: true,
        },
      });

      this.logger.log(`Person created: ${person.id}`);
      return person;
    } catch (error) {
      this.logger.error(`Error creating person: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: UpdatePersonDto) {
    try {
      const person = await this.prisma.person.findUnique({
        where: { id },
      });

      if (!person) {
        throw new NotFoundException(`Person with ID ${id} not found`);
      }

      const updateData = data as any;
      const legalName =
        updateData.first_name || updateData.last_name
          ? `${updateData.first_name || person.legal_name.split(' ').slice(0, -1).join(' ')} ${updateData.last_name || person.legal_name.split(' ').slice(-1).join('')}`
              .trim()
              .toUpperCase()
          : undefined;

      const updated = await this.prisma.$transaction(async (tx) => {
        const updatedPerson = await (tx.person as any).update({
          where: { id },
          data: {
            ...(legalName && { legal_name: legalName }),
            ...(updateData.date_of_birth && { date_of_birth: new Date(updateData.date_of_birth) }),
            ...(updateData.gender && { gender: updateData.gender }),
            ...(updateData.nationality && { nationality: updateData.nationality }),
            ...(updateData.government_id !== undefined && {
              government_id: updateData.government_id,
            }),
            ...(updateData.rg !== undefined && { passport: updateData.rg }),
            ...(updateData.rg_issuer !== undefined && { rg_issuer: updateData.rg_issuer }),
            ...(updateData.rg_state !== undefined && { rg_state: updateData.rg_state }),
            ...(updateData.rg_issue_date !== undefined && { rg_issue_date: updateData.rg_issue_date ? new Date(updateData.rg_issue_date) : null }),
            ...(updateData.cnh !== undefined && { ssn: updateData.cnh }),
            ...(updateData.cnh_category !== undefined && { cnh_category: updateData.cnh_category }),
            ...(updateData.cnh_issue_date !== undefined && { cnh_issue_date: updateData.cnh_issue_date ? new Date(updateData.cnh_issue_date) : null }),
            ...(updateData.cnh_expiry_date !== undefined && { cnh_expiry_date: updateData.cnh_expiry_date ? new Date(updateData.cnh_expiry_date) : null }),
            ...(updateData.cnh_issuer !== undefined && { cnh_issuer: updateData.cnh_issuer }),
            ...(updateData.cnh_state !== undefined && { cnh_state: updateData.cnh_state }),
            ...(updateData.marital_status !== undefined && { marital_status: updateData.marital_status }),
            ...(updateData.mother_name !== undefined && { mother_name: updateData.mother_name }),
            ...(updateData.ethnicity !== undefined && { ethnicity: updateData.ethnicity }),
            ...(updateData.pis !== undefined && { pis: updateData.pis }),
            ...(updateData.education_level !== undefined && { education_level: updateData.education_level }),
            ...(updateData.has_food_intolerance !== undefined && { has_food_intolerance: updateData.has_food_intolerance }),
            ...(updateData.food_intolerance !== undefined && { food_intolerance: updateData.food_intolerance }),
            ...(updateData.has_medication_allergy !== undefined && { has_medication_allergy: updateData.has_medication_allergy }),
            ...(updateData.medication_allergy !== undefined && { medication_allergy: updateData.medication_allergy }),
            ...(updateData.photo_url !== undefined && { photo_url: updateData.photo_url }),
          },
          select: {
            id: true,
            legal_name: true,
            date_of_birth: true,
            gender: true,
            nationality: true,
            government_id: true,
            passport: true,
            ssn: true,
            photo_url: true,
            created_at: true,
            updated_at: true,
          },
        });

        if (updateData.contact) {
          const existingPrimaryContact = await tx.personal_contact.findFirst({
            where: {
              person_id: id,
              is_primary: true,
            },
          });

          if (existingPrimaryContact) {
            await tx.personal_contact.update({
              where: { id: existingPrimaryContact.id },
              data: {
                email: updateData.contact.email,
                personal_email: updateData.contact.personal_email,
                phone: updateData.contact.phone,
                corporate_phone: updateData.contact.corporate_phone,
                address: updateData.contact.address,
                address_number: updateData.contact.address_number,
                address_complement: updateData.contact.address_complement,
                neighborhood: updateData.contact.neighborhood,
                city: updateData.contact.city,
                state: updateData.contact.state,
                country: updateData.contact.country,
                postal_code: updateData.contact.postal_code,
              },
            });
          } else {
            await tx.personal_contact.create({
              data: {
                person_id: id,
                email: updateData.contact.email,
                personal_email: updateData.contact.personal_email,
                phone: updateData.contact.phone,
                corporate_phone: updateData.contact.corporate_phone,
                address: updateData.contact.address,
                address_number: updateData.contact.address_number,
                address_complement: updateData.contact.address_complement,
                neighborhood: updateData.contact.neighborhood,
                city: updateData.contact.city,
                state: updateData.contact.state,
                country: updateData.contact.country,
                postal_code: updateData.contact.postal_code,
                is_primary: true,
              },
            });
          }
        }

        return updatedPerson;
      });

      this.logger.log(`Person updated: ${id}`);
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      if (error.code === 'P2025') {
        throw new NotFoundException(`Person with ID ${id} not found`);
      }
      this.logger.error(`Error updating person ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const person = await this.prisma.person.findUnique({
        where: { id },
      });

      if (!person) {
        throw new NotFoundException(`Person with ID ${id} not found`);
      }

      await this.prisma.person.delete({
        where: { id },
      });

      this.logger.log(`Person deleted: ${id}`);
      return { message: 'Person deleted successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error.code === 'P2025') {
        throw new NotFoundException(`Person with ID ${id} not found`);
      }
      this.logger.error(`Error deleting person ${id}: ${error.message}`);
      throw error;
    }
  }
}
