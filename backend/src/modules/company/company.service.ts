import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(private prisma: PrismaService) {}

  private normalizeCnpj(value: string): string {
    return value.replace(/\D/g, '');
  }

  private isValidCnpj(cnpj: string): boolean {
    const clean = this.normalizeCnpj(cnpj);
    if (clean.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(clean)) return false;

    const calcDigit = (base: string, factors: number[]) => {
      const sum = base
        .split('')
        .reduce((acc, digit, index) => acc + Number(digit) * factors[index], 0);
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    const d1 = calcDigit(clean.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const d2 = calcDigit(clean.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return clean.endsWith(`${d1}${d2}`);
  }

  private async ensureCompanyManager(userId: string) {
    const managerRole = await this.prisma.user_role.findFirst({
      where: {
        userId,
        userCompany: {
          isActive: true,
        },
        role: {
          name: {
            in: [
              'SUPER_ADMIN',
              'Super Admin',
              'SUPERADMIN',
              'Admin',
              'ADMIN',
            ],
          },
        },
      },
    });

    if (!managerRole) {
      throw new ForbiddenException('Apenas administradores podem executar esta ação');
    }
  }

  async findAllForAdmin(pagination: PaginationDto, requestingUserId: string) {
    try {
      await this.ensureCompanyManager(requestingUserId);

      const [data, total] = await Promise.all([
        this.prisma.company.findMany({
          where: {
            status: { not: 'DELETED' },
          },
          skip: pagination.skip,
          take: pagination.take,
          select: {
            id: true,
            name: true,
            document: true,
            phone: true,
            address: true,
            address_number: true,
            complement: true,
            neighborhood: true,
            city: true,
            state: true,
            postal_code: true,
            country: true,
            status: true,
            created_at: true,
            updated_at: true,
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.company.count({
          where: {
            status: { not: 'DELETED' },
          },
        }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error fetching all companies: ${error.message}`);
      throw error;
    }
  }

  async findAll(pagination: PaginationDto, companyId: string) {
    try {
      // Only return the current company
      const [data, total] = await Promise.all([
        this.prisma.company.findMany({
          where: { id: companyId, status: { not: 'DELETED' } },
          skip: pagination.skip,
          take: pagination.take,
          select: {
            id: true,
            name: true,
            document: true,
            phone: true,
            address: true,
            address_number: true,
            complement: true,
            neighborhood: true,
            city: true,
            state: true,
            postal_code: true,
            country: true,
            status: true,
            created_at: true,
            updated_at: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        }),
        this.prisma.company.count({ where: { id: companyId, status: { not: 'DELETED' } } }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching companies: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, companyId: string) {
    try {
      if (id !== companyId) {
        throw new BadRequestException('Company does not belong to user');
      }

      const company = await this.prisma.company.findUnique({
        where: { id },
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          position: {
            select: {
              id: true,
              name: true,
              position_level_id: true,
              position_level: { select: { id: true, name: true } },
            },
          },
          employee: {
            select: {
              id: true,
              person_id: true,
              status: true,
            },
          },
        },
      });

      if (!company) {
        throw new NotFoundException(`Company with ID ${id} not found`);
      }

      if (company.status === 'DELETED') {
        throw new NotFoundException(`Company with ID ${id} not found`);
      }

      return company;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error fetching company ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateCompanyDto, requestingUserId: string) {
    try {
      await this.ensureCompanyManager(requestingUserId);
      throw new ForbiddenException('Criação de novas empresas está desabilitada neste plano');
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Error creating company: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: UpdateCompanyDto, requestingUserId: string) {
    try {
      await this.ensureCompanyManager(requestingUserId);

      const company = await this.prisma.company.update({
        where: { id },
        data: {
          phone: data.phone,
          address: data.address,
          address_number: data.address_number,
          complement: data.complement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
          country: data.country,
          updated_at: new Date(),
        },
        select: {
          id: true,
          name: true,
          document: true,
          phone: true,
          address: true,
          address_number: true,
          complement: true,
          neighborhood: true,
          city: true,
          state: true,
          postal_code: true,
          country: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      });

      this.logger.log(`Company updated: ${id}`);
      return company;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Company with ID ${id} not found`);
      }
      this.logger.error(`Error updating company ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, requestingUserId: string) {
    try {
      await this.ensureCompanyManager(requestingUserId);

      await this.prisma.company.update({
        where: { id },
        data: {
          status: 'DELETED',
        },
      });

      this.logger.log(`Company soft deleted (status DELETED): ${id}`);
      return { message: 'Company deleted successfully' };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) throw error;
      if (error.code === 'P2025') {
        throw new NotFoundException(`Company with ID ${id} not found`);
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Cannot delete company with related records',
        );
      }
      this.logger.error(`Error deleting company ${id}: ${error.message}`);
      throw error;
    }
  }

  async getEmployeesByCompany(companyId: string, pagination: PaginationDto, requestCompanyId: string) {
    try {
      if (companyId !== requestCompanyId) {
        throw new BadRequestException('Company does not belong to user');
      }

      const [employees, total] = await Promise.all([
        this.prisma.employee.findMany({
          where: { company_id: companyId },
          skip: pagination.skip,
          take: pagination.take,
          include: {
            person: {
              select: {
                legal_name: true,
                preferred_name: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.employee.count({ where: { company_id: companyId } }),
      ]);

      return new PaginatedResponse(employees, total, pagination.skip, pagination.take);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error fetching company employees: ${error.message}`);
      throw error;
    }
  }

  async getDepartmentsByCompany(companyId: string, pagination: PaginationDto, requestCompanyId: string) {
    try {
      if (companyId !== requestCompanyId) {
        throw new BadRequestException('Company does not belong to user');
      }

      const [departments, total] = await Promise.all([
        this.prisma.department.findMany({
          where: { company_id: companyId },
          skip: pagination.skip,
          take: pagination.take,
          select: {
            id: true,
            name: true,
            parent_department_id: true,
            manager_employee_id: true,
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.department.count({ where: { company_id: companyId } }),
      ]);

      return new PaginatedResponse(departments, total, pagination.skip, pagination.take);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error fetching company departments: ${error.message}`);
      throw error;
    }
  }

  async findUserCompanies(userId: string) {
    try {
      const userCompanies = await this.prisma.user_company.findMany({
        where: {
          userId: userId,
          isActive: true,
          company: {
            status: { not: 'DELETED' },
          },
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              document: true,
              phone: true,
              address: true,
              address_number: true,
              complement: true,
              neighborhood: true,
              city: true,
              state: true,
              postal_code: true,
              country: true,
              status: true,
              created_at: true,
              updated_at: true,
            },
          },
        },
      });

      return userCompanies.map(uc => ({
        id: uc.company.id,
        name: uc.company.name,
        document: uc.company.document,
        phone: uc.company.phone,
        address: uc.company.address,
        address_number: uc.company.address_number,
        complement: uc.company.complement,
        neighborhood: uc.company.neighborhood,
        city: uc.company.city,
        state: uc.company.state,
        postal_code: uc.company.postal_code,
        country: uc.company.country,
        status: uc.company.status,
      }));
    } catch (error) {
      this.logger.error(`Error fetching user companies: ${error.message}`);
      throw error;
    }
  }
}
