import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { CreateFullEmployeeDto } from './dto/create-full-employee.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, companyId: string) {
    try {
      const [data, total] = await Promise.all([
        this.prisma.employee.findMany({
          where: { company_id: companyId },
          skip: pagination.skip,
          take: pagination.take,
          include: {
            person: {
              select: {
                id: true,
                legal_name: true,
                preferred_name: true,
                photo_url: true,
                government_id: true,
                gender: true,
                date_of_birth: true,
                personal_contact: {
                  where: { is_primary: true },
                  take: 1,
                  select: {
                    email: true,
                    phone: true,
                  },
                },
              },
            },
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            employee_department: {
              where: { end_date: null },
              take: 1,
              include: {
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            employee_position: {
              where: { end_date: null },
              take: 1,
              include: {
                position: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            contract: {
              where: { end_date: null },
              take: 1,
              select: {
                id: true,
                contract_type: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.employee.count({ where: { company_id: companyId } }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching employees: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, companyId: string) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id },
        include: {
          person: {
            include: {
              personal_contact: true,
              emergency_contact: true,
              family_info: true,
            },
          },
          company: true,
          employee_department: {
            where: { end_date: null },
            include: {
              department: true,
            },
          },
          employee_position: {
            where: { end_date: null },
            include: {
              position: true,
            },
          },
          contract: {
            include: {
              salary: {
                where: { end_date: null },
              },
            },
          },
          employee_language: {
            include: {
              language: true,
            },
          },
          employee_skill: {
            include: {
              skill: true,
            },
          },
          cost_center: true,
          document: true,
          education: true,
          work_experience: true,
        },
      });

      if (!employee) {
        throw new NotFoundException(`Employee with ID ${id} not found`);
      }

      // Validar que o employee pertence à empresa
      if (employee.company_id !== companyId) {
        throw new BadRequestException('Employee does not belong to this company');
      }

      return employee;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Error fetching employee ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateEmployeeDto, companyId: string) {
    try {
      // Verify person exists
      const person = await this.prisma.person.findUnique({
        where: { id: data.person_id },
      });
      if (!person) {
        throw new BadRequestException(`Person with ID ${data.person_id} not found`);
      }

      // Validate companyId matches
      if (data.company_id && data.company_id !== companyId) {
        throw new BadRequestException('Company ID mismatch');
      }

      const employee = await this.prisma.employee.create({
        data: {
          person_id: data.person_id,
          company_id: companyId,
          employee_number: data.employee_number,
          employee_type: data.employee_type,
          status: data.status,
          manager_id: data.manager_id,
          cost_center_id: data.cost_center_id || null,
          hire_date: new Date(data.hire_date),
          termination_date: data.termination_date ? new Date(data.termination_date) : null,
          termination_reason: data.termination_reason,
          observation: data.observation || null,
        },
        include: {
          person: { select: { legal_name: true } },
          company: { select: { name: true } },
        },
      });

      this.logger.log(`Employee created: ${employee.id}`);
      return employee;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error creating employee: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: UpdateEmployeeDto, companyId: string) {
    try {
      // Verify employee belongs to company
      const employee = await this.prisma.employee.findUnique({
        where: { id },
      });
      if (!employee || employee.company_id !== companyId) {
        throw new BadRequestException('Employee does not belong to this company');
      }

      const updateData = data as any;
      const updatedEmployee = await this.prisma.employee.update({
        where: { id },
        data: {
          ...(updateData.person_id && { person_id: updateData.person_id }),
          ...(updateData.company_id && { company_id: updateData.company_id }),
          ...(updateData.employee_number && { employee_number: updateData.employee_number }),
          ...(updateData.employee_type && { employee_type: updateData.employee_type }),
          ...(updateData.status && { status: updateData.status }),
          ...(updateData.manager_id !== undefined && { manager_id: updateData.manager_id }),
          ...(updateData.cost_center_id !== undefined && { cost_center_id: updateData.cost_center_id || null }),
          ...(updateData.hire_date && { hire_date: new Date(updateData.hire_date) }),
          ...(updateData.termination_date !== undefined && {
            termination_date: updateData.termination_date ? new Date(updateData.termination_date) : null,
          }),
          ...(updateData.termination_reason !== undefined && { termination_reason: updateData.termination_reason }),
          ...(updateData.observation !== undefined && { observation: updateData.observation || null }),
        },
        include: {
          person: { select: { legal_name: true } },
          company: { select: { name: true } },
        },
      });

      this.logger.log(`Employee updated: ${id}`);
      return updatedEmployee;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error.code === 'P2025') {
        throw new NotFoundException(`Employee with ID ${id} not found`);
      }
      this.logger.error(`Error updating employee ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      // Verify employee belongs to company
      const employee = await this.prisma.employee.findUnique({
        where: { id },
      });
      if (!employee || employee.company_id !== companyId) {
        throw new BadRequestException('Employee does not belong to this company');
      }

      await this.prisma.employee.delete({
        where: { id },
      });

      this.logger.log(`Employee deleted: ${id}`);
      return { message: 'Employee deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Employee with ID ${id} not found`);
      }
      this.logger.error(`Error deleting employee ${id}: ${error.message}`);
      throw error;
    }
  }

  async getDepartmentsByEmployee(employeeId: string, pagination: PaginationDto, companyId: string) {
    try {
      // Verify employee belongs to company
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });
      if (!employee || employee.company_id !== companyId) {
        throw new BadRequestException('Employee does not belong to this company');
      }

      const [departments, total] = await Promise.all([
        this.prisma.employee_department.findMany({
          where: { employee_id: employeeId },
          skip: pagination.skip,
          take: pagination.take,
          include: { department: true },
          orderBy: { start_date: 'desc' },
        }),
        this.prisma.employee_department.count({ where: { employee_id: employeeId } }),
      ]);

      const data = departments.map(ed => ed.department);
      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching employee departments: ${error.message}`);
      throw error;
    }
  }

  async getPositionsByEmployee(employeeId: string, pagination: PaginationDto, companyId: string) {
    try {
      // Verify employee belongs to company
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });
      if (!employee || employee.company_id !== companyId) {
        throw new BadRequestException('Employee does not belong to this company');
      }

      const [positions, total] = await Promise.all([
        this.prisma.employee_position.findMany({
          where: { employee_id: employeeId },
          skip: pagination.skip,
          take: pagination.take,
          include: { position: true },
          orderBy: { start_date: 'desc' },
        }),
        this.prisma.employee_position.count({ where: { employee_id: employeeId } }),
      ]);

      const data = positions.map(ep => ep.position);
      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching employee positions: ${error.message}`);
      throw error;
    }
  }

  async getContractsByEmployee(employeeId: string, pagination: PaginationDto, companyId: string) {
    try {
      // Verify employee belongs to company
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });
      if (!employee || employee.company_id !== companyId) {
        throw new BadRequestException('Employee does not belong to this company');
      }

      const [contracts, total] = await Promise.all([
        this.prisma.contract.findMany({
          where: { employee_id: employeeId },
          skip: pagination.skip,
          take: pagination.take,
          include: { salary: true },
          orderBy: { start_date: 'desc' },
        }),
        this.prisma.contract.count({ where: { employee_id: employeeId } }),
      ]);

      return new PaginatedResponse(contracts, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching employee contracts: ${error.message}`);
      throw error;
    }
  }

  async createFull(data: CreateFullEmployeeDto, companyId: string) {
    const employeeId = await this.prisma.$transaction(async (tx) => {
      // 1. Create person
      const nameParts = [data.first_name, data.last_name].filter(Boolean);
      const person = await tx.person.create({
        data: {
          legal_name: nameParts.join(' '),
          preferred_name: data.first_name,
          date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
          gender: data.gender || 'OTHER',
          nationality: data.nationality || 'Brasileira',
          government_id: data.government_id,
          marital_status: data.marital_status,
          mother_name: data.mother_name,
          ethnicity: data.ethnicity,
          pis: data.pis,
          education_level: data.education_level,
          passport: data.rg,
          rg_issuer: data.rg_issuer,
          rg_state: data.rg_state,
          rg_issue_date: data.rg_issue_date ? new Date(data.rg_issue_date) : null,
          ssn: data.cnh,
          cnh_category: data.cnh_category,
          cnh_issue_date: data.cnh_issue_date ? new Date(data.cnh_issue_date) : null,
          cnh_expiry_date: data.cnh_expiry_date ? new Date(data.cnh_expiry_date) : null,
          cnh_issuer: data.cnh_issuer,
          cnh_state: data.cnh_state,
          photo_url: data.photo_url,
          has_food_intolerance: data.has_food_intolerance || false,
          food_intolerance: data.food_intolerance,
          has_medication_allergy: data.has_medication_allergy || false,
          medication_allergy: data.medication_allergy,
        },
      });

      // 2. Create contact
      if (data.contact) {
        await tx.personal_contact.create({
          data: {
            person_id: person.id,
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
            country: data.contact.country || 'Brasil',
            postal_code: data.contact.postal_code,
            is_primary: true,
          },
        });
      }

      // 3. Create emergency contacts
      if (data.emergency_contacts?.length) {
        for (let i = 0; i < data.emergency_contacts.length; i++) {
          const ec = data.emergency_contacts[i];
          await tx.emergency_contact.create({
            data: {
              person_id: person.id,
              name: ec.name,
              phone: ec.phone,
              phone_secondary: ec.phone_secondary,
              relationship: ec.relationship,
              is_primary: i === 0,
            },
          });
        }
      }

      // 4. Create family info
      if (data.family) {
        await tx.family_info.create({
          data: {
            person_id: person.id,
            marital_status: data.family.marital_status,
            spouse_name: data.family.spouse_name,
            spouse_birthday: data.family.spouse_birthday ? new Date(data.family.spouse_birthday) : null,
            number_of_dependents: data.family.number_of_dependents || 0,
          },
        });
      }

      // 5. Create employee
      const employee = await tx.employee.create({
        data: {
          person_id: person.id,
          company_id: companyId,
          employee_number: data.employee_number,
          employee_type: data.employee_type || 'FULL_TIME',
          status: data.status || 'ACTIVE',
          manager_id: data.manager_id,
          cost_center_id: data.cost_center_id || null,
          hire_date: new Date(data.hire_date),
          termination_date: data.termination_date ? new Date(data.termination_date) : null,
          termination_reason: data.termination_reason,
          observation: data.observation,
        },
      });

      // 6. Department assignment
      if (data.department) {
        await tx.employee_department.create({
          data: {
            employee_id: employee.id,
            department_id: data.department.department_id,
            start_date: data.department.start_date ? new Date(data.department.start_date) : new Date(data.hire_date),
            is_primary: data.department.is_primary ?? true,
          },
        });
      }

      // 7. Position assignment
      if (data.position) {
        await tx.employee_position.create({
          data: {
            employee_id: employee.id,
            position_id: data.position.position_id,
            start_date: data.position.start_date ? new Date(data.position.start_date) : new Date(data.hire_date),
          },
        });
      }

      // 8. Contract & salary
      if (data.contract) {
        const contract = await tx.contract.create({
          data: {
            employee_id: employee.id,
            contract_type: data.contract.contract_type,
            work_hours: data.contract.work_hours,
            start_date: data.contract.start_date ? new Date(data.contract.start_date) : new Date(data.hire_date),
            end_date: data.contract.end_date ? new Date(data.contract.end_date) : null,
          },
        });

        if (data.salary) {
          await tx.salary.create({
            data: {
              contract_id: contract.id,
              amount: data.salary.amount,
              currency: data.salary.currency || 'BRL',
              start_date: data.salary.start_date ? new Date(data.salary.start_date) : new Date(data.hire_date),
            },
          });
        }
      }

      // 9. Languages
      if (data.languages?.length) {
        for (const lang of data.languages) {
          await tx.employee_language.create({
            data: {
              employee_id: employee.id,
              language_id: lang.language_id,
              proficiency_level: lang.proficiency_level,
            },
          });
        }
      }

      // 10. Skills
      if (data.skills?.length) {
        for (const skill of data.skills) {
          await tx.employee_skill.create({
            data: {
              employee_id: employee.id,
              skill_id: skill.skill_id,
              proficiency_level: skill.proficiency_level || 3,
            },
          });
        }
      }

      this.logger.log(`Full employee created: ${employee.id} (person: ${person.id})`);
      return employee.id;
    });

    return this.findOne(employeeId, companyId);
  }
}
