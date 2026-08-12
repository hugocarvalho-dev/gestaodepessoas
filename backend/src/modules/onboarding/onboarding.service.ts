import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';
import {
  CreateOnboardingPlanDto,
  CreateOnboardingRequestDto,
  SubmitOnboardingDto,
  UpdateOnboardingPlanDto,
} from './dto/onboarding.dto';
import { createHash, randomBytes } from 'crypto';

const DEFAULT_REQUIRED_FIELDS = [
  'legal_name',
  'government_id',
  'email',
  'hire_date',
  'employee_type',
];

const POSSIBLE_ONBOARDING_FIELDS = [
  { key: 'legal_name', label: 'Nome completo' },
  { key: 'government_id', label: 'CPF' },
  { key: 'email', label: 'E-mail corporativo' },
  { key: 'personal_email', label: 'E-mail pessoal' },
  { key: 'phone', label: 'Telefone' },
  { key: 'date_of_birth', label: 'Data de nascimento' },
  { key: 'gender', label: 'Gênero' },
  { key: 'hire_date', label: 'Data de admissão' },
  { key: 'employee_type', label: 'Tipo de vínculo' },
  { key: 'department', label: 'Departamento' },
  { key: 'position', label: 'Cargo' },
  { key: 'contract_type', label: 'Tipo de contrato' },
  { key: 'work_hours', label: 'Carga horária' },
  { key: 'salary', label: 'Salário' },
  { key: 'cost_center', label: 'Centro de custo' },
  { key: 'address', label: 'Endereço' },
  { key: 'address_number', label: 'Número' },
  { key: 'neighborhood', label: 'Bairro' },
  { key: 'city', label: 'Cidade' },
  { key: 'state', label: 'Estado' },
  { key: 'postal_code', label: 'CEP' },
];

type OnboardingPlanField = {
  key: string;
  label: string;
  enabled: boolean;
  required: boolean;
};

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);
  private schemaInitialized = false;

  constructor(private prisma: PrismaService) {}

  private hashToken(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private get onboardingPlanRepo() {
    const repo = (this.prisma as any).onboarding_plan;
    if (!repo) {
      throw new BadRequestException(
        'Planos de onboarding indisponiveis no momento. Reinicie a API apos rodar prisma generate.',
      );
    }
    return repo;
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) return null;

    const trimmed = String(value).trim();
    if (!trimmed) return null;

    const br = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) {
      const [, dd, mm, yyyy] = br;
      const iso = `${yyyy}-${mm}-${dd}`;
      const dt = new Date(iso);
      if (!isNaN(dt.getTime())) return dt;
      return null;
    }

    const dt = new Date(trimmed);
    if (!isNaN(dt.getTime())) return dt;
    return null;
  }

  private cleanDigits(value?: string | null) {
    return String(value || '').replace(/\D/g, '');
  }

  private async ensureOnboardingPlanSchema() {
    if (this.schemaInitialized) return;

    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "onboarding_plan" (
        "id" UUID NOT NULL DEFAULT uuidv7(),
        "company_id" UUID NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "fields" JSONB NOT NULL,
        "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "onboarding_plan_pkey" PRIMARY KEY ("id")
      );
    `);

    await this.prisma.$executeRawUnsafe(`
      ALTER TABLE "onboarding_request"
      ADD COLUMN IF NOT EXISTS "onboarding_plan_id" UUID;
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_onboarding_plan_company"
      ON "onboarding_plan"("company_id");
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_onboarding_plan_company_active"
      ON "onboarding_plan"("company_id", "is_active");
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_onboarding_request_plan"
      ON "onboarding_request"("onboarding_plan_id");
    `);

    await this.prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'onboarding_plan_company_id_fkey'
        ) THEN
          ALTER TABLE "onboarding_plan"
          ADD CONSTRAINT "onboarding_plan_company_id_fkey"
          FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await this.prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'onboarding_request_onboarding_plan_id_fkey'
        ) THEN
          ALTER TABLE "onboarding_request"
          ADD CONSTRAINT "onboarding_request_onboarding_plan_id_fkey"
          FOREIGN KEY ("onboarding_plan_id") REFERENCES "onboarding_plan"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    this.schemaInitialized = true;
  }

  private normalizePlanFields(fields?: any): OnboardingPlanField[] {
    const input = Array.isArray(fields) ? fields : [];
    const byKey = new Map<string, any>();

    for (const item of input) {
      const key = String(item?.key || '').trim();
      if (!key) continue;
      byKey.set(key, item);
    }

    return POSSIBLE_ONBOARDING_FIELDS.map((base) => {
      const current = byKey.get(base.key);
      const requiredByDefault = DEFAULT_REQUIRED_FIELDS.includes(base.key);
      return {
        key: base.key,
        label: String(current?.label || base.label),
        enabled: current?.enabled ?? requiredByDefault,
        required: current?.required ?? requiredByDefault,
      };
    });
  }

  private extractRequiredFields(fields?: any): string[] {
    const normalized = this.normalizePlanFields(fields);
    const required = normalized
      .filter((f) => f.enabled && f.required)
      .map((f) => f.key);

    if (required.length === 0) {
      return [...DEFAULT_REQUIRED_FIELDS];
    }

    return Array.from(new Set(required));
  }

  private async syncExpiredProcesses(companyId: string) {
    await this.prisma.onboarding_request.updateMany({
      where: {
        company_id: companyId,
        status: 'PENDING',
        token_expires_at: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
        reviewed_at: new Date(),
        review_notes: 'Processo expirado automaticamente pelo sistema.',
      },
    });
  }

  private async ensureProcessUsable(process: any) {
    if (!process) {
      throw new NotFoundException('Processo de onboarding não encontrado');
    }

    const isExpired = new Date(process.token_expires_at).getTime() < Date.now();
    if (isExpired && process.status === 'PENDING') {
      await this.prisma.onboarding_request.update({
        where: { id: process.id },
        data: {
          status: 'EXPIRED',
          reviewed_at: new Date(),
          review_notes: 'Processo expirado automaticamente pelo sistema.',
        },
      });
      throw new BadRequestException('Este processo de onboarding expirou');
    }

    if (process.status === 'EXPIRED') {
      throw new BadRequestException('Este processo de onboarding expirou');
    }

    if (process.status === 'APPROVED') {
      throw new BadRequestException('Este onboarding já foi aprovado');
    }

    if (process.status === 'REJECTED') {
      throw new BadRequestException('Este onboarding foi rejeitado');
    }

    if (process.status === 'CANCELLED') {
      throw new BadRequestException('Este processo foi cancelado pelo RH');
    }
  }

  async findPlans(companyId: string) {
    await this.ensureOnboardingPlanSchema();
    const data = await this.onboardingPlanRepo.findMany({
      where: { company_id: companyId },
      orderBy: [{ is_active: 'desc' }, { created_at: 'desc' }],
    });
    return PaginatedResponse.fromArray(data);
  }

  async createPlan(dto: CreateOnboardingPlanDto, companyId: string) {
    await this.ensureOnboardingPlanSchema();
    return this.onboardingPlanRepo.create({
      data: {
        company_id: companyId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        is_active: dto.is_active ?? true,
        fields: this.normalizePlanFields(dto.fields),
      },
    });
  }

  async updatePlan(id: string, dto: UpdateOnboardingPlanDto, companyId: string) {
    await this.ensureOnboardingPlanSchema();
    const existing = await this.onboardingPlanRepo.findUnique({ where: { id } });
    if (!existing || existing.company_id !== companyId) {
      throw new NotFoundException('Plano de onboarding não encontrado');
    }

    return this.onboardingPlanRepo.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
        ...(dto.fields !== undefined && { fields: this.normalizePlanFields(dto.fields) }),
      },
    });
  }

  async removePlan(id: string, companyId: string) {
    await this.ensureOnboardingPlanSchema();
    const existing = await this.onboardingPlanRepo.findUnique({ where: { id } });
    if (!existing || existing.company_id !== companyId) {
      throw new NotFoundException('Plano de onboarding não encontrado');
    }

    await this.onboardingPlanRepo.delete({ where: { id } });
    return { deleted: true };
  }

  async findAll(pagination: PaginationDto, companyId: string) {
    await this.syncExpiredProcesses(companyId);

    const where = {
      company_id: companyId,
      status: { not: 'CANCELLED' },
    };

    const [data, total] = await Promise.all([
      this.prisma.onboarding_request.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          invite_email: true,
          invite_name: true,
          employee_type_value: true,
          onboarding_plan_id: true,
          public_token: true,
          token_expires_at: true,
          status: true,
          required_fields: true,
          submitted_data: true,
          submitted_at: true,
          reviewed_at: true,
          review_notes: true,
          created_employee_id: true,
          created_at: true,
          updated_at: true,
        },
      }),
      this.prisma.onboarding_request.count({ where }),
    ]);

    return new PaginatedResponse(data, total, pagination.skip, pagination.take);
  }

  async findOne(id: string, companyId: string) {
    const invite = await this.prisma.onboarding_request.findUnique({
      where: { id },
    });

    if (!invite || invite.company_id !== companyId) {
      throw new NotFoundException('Onboarding não encontrado');
    }

    return invite;
  }

  async createInvite(dto: CreateOnboardingRequestDto, companyId: string, inviterUserId?: string) {
    const days = dto.expires_in_days || 7;
    const rawToken = randomBytes(24).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const [department, position, manager, plan] = await Promise.all([
      this.prisma.department.findFirst({
        where: { id: dto.department_id, company_id: companyId },
        select: { id: true, name: true },
      }),
      this.prisma.position.findFirst({
        where: { id: dto.position_id, company_id: companyId },
        select: { id: true, name: true },
      }),
      this.prisma.employee.findFirst({
        where: { id: dto.manager_employee_id, company_id: companyId },
        select: { id: true, person: { select: { legal_name: true } } },
      }),
      this.prisma.onboarding_plan.findFirst({
        where: {
          id: dto.onboarding_plan_id,
          company_id: companyId,
          is_active: true,
        },
        select: {
          id: true,
          fields: true,
        },
      }),
    ]);

    if (!department) {
      throw new BadRequestException('Departamento informado não é válido para esta empresa');
    }

    if (!position) {
      throw new BadRequestException('Cargo informado não é válido para esta empresa');
    }

    if (!manager) {
      throw new BadRequestException('Gestor informado não é válido para esta empresa');
    }

    if (!plan) {
      throw new BadRequestException('Plano de onboarding informado não é válido para esta empresa');
    }

    const requiredFields = dto.required_fields?.length
      ? Array.from(new Set(dto.required_fields.map((f) => String(f).trim()).filter(Boolean)))
      : this.extractRequiredFields(plan.fields);

    // These fields are defined by RH and not editable by the collaborator in the public form.
    const presetData = {
      department_id: department.id,
      department: department.name,
      position_id: position.id,
      position: position.name,
      manager_id: manager.id,
      manager_name: manager.person?.legal_name || null,
      // E-mail corporativo: vem do convite e nao tem campo no formulario
      // publico, por isso precisa estar no preset.
      email: dto.invite_email,
      personal_email: dto.personal_email,
      hire_date: dto.hire_date,
      legal_name: dto.invite_name,
    };

    const invite = await this.prisma.onboarding_request.create({
      data: {
        company_id: companyId,
        inviter_user_id: inviterUserId || null,
        invite_email: dto.invite_email,
        invite_name: dto.invite_name,
        employee_type_value: dto.employee_type_value || null,
        onboarding_plan_id: plan.id,
        token_hash: tokenHash,
        public_token: rawToken,
        token_expires_at: expiresAt,
        status: 'PENDING',
        required_fields: requiredFields,
        submitted_data: presetData,
      },
      select: {
        id: true,
        invite_email: true,
        invite_name: true,
        employee_type_value: true,
        onboarding_plan_id: true,
        token_expires_at: true,
        status: true,
        required_fields: true,
        created_at: true,
      },
    });

    return {
      ...invite,
      token: rawToken,
      invite_path: `/onboarding/${rawToken}`,
    };
  }

  async getInviteLink(id: string, companyId: string) {
    const invite = await this.prisma.onboarding_request.findUnique({
      where: { id },
    });

    if (!invite || invite.company_id !== companyId) {
      throw new NotFoundException('Onboarding não encontrado');
    }

    if (invite.status === 'APPROVED' || invite.status === 'REJECTED' || invite.status === 'CANCELLED') {
      throw new BadRequestException('Processo não está mais ativo');
    }

    const isExpired = new Date(invite.token_expires_at).getTime() < Date.now();
    if (isExpired) {
      if (invite.status === 'PENDING') {
        await this.prisma.onboarding_request.update({
          where: { id: invite.id },
          data: {
            status: 'EXPIRED',
            reviewed_at: new Date(),
            review_notes: 'Processo expirado automaticamente pelo sistema.',
          },
        });
      }
      throw new BadRequestException('Processo expirado');
    }

    if (invite.public_token) {
      return {
        token: invite.public_token,
        invite_path: `/onboarding/${invite.public_token}`,
        token_expires_at: invite.token_expires_at,
      };
    }

    const rawToken = randomBytes(24).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const updated = await this.prisma.onboarding_request.update({
      where: { id: invite.id },
      data: {
        public_token: rawToken,
        token_hash: tokenHash,
      },
      select: {
        public_token: true,
        token_expires_at: true,
      },
    });

    return {
      token: updated.public_token,
      invite_path: `/onboarding/${updated.public_token}`,
      token_expires_at: updated.token_expires_at,
    };
  }

  async getPublicForm(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);

    const invite = await this.prisma.onboarding_request.findUnique({
      where: { token_hash: tokenHash },
      select: {
        id: true,
        invite_name: true,
        invite_email: true,
        employee_type_value: true,
        onboarding_plan_id: true,
        token_expires_at: true,
        status: true,
        required_fields: true,
        submitted_data: true,
      },
    });

    await this.ensureProcessUsable(invite);

    return {
      id: invite.id,
      invite_name: invite.invite_name,
      invite_email: invite.invite_email,
      employee_type_value: invite.employee_type_value,
      onboarding_plan_id: invite.onboarding_plan_id,
      token_expires_at: invite.token_expires_at,
      status: invite.status,
      required_fields: invite.required_fields || DEFAULT_REQUIRED_FIELDS,
      submitted_data: invite.submitted_data || {},
    };
  }

  async getPublicLanguages(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);

    const invite = await this.prisma.onboarding_request.findUnique({
      where: { token_hash: tokenHash },
      select: {
        id: true,
        token_expires_at: true,
        status: true,
      },
    });

    await this.ensureProcessUsable(invite);

    const data = await this.prisma.language.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });
    return PaginatedResponse.fromArray(data);
  }

  async submitByToken(rawToken: string, dto: SubmitOnboardingDto) {
    const tokenHash = this.hashToken(rawToken);

    const invite = await this.prisma.onboarding_request.findUnique({
      where: { token_hash: tokenHash },
    });

    await this.ensureProcessUsable(invite);

    const data = dto?.data || {};
    const currentData = ((invite.submitted_data || {}) as Record<string, any>) || {};
    const mergedData: Record<string, any> = {
      ...currentData,
      ...data,
      department_id: currentData.department_id,
      department: currentData.department,
      position_id: currentData.position_id,
      position: currentData.position,
      manager_id: currentData.manager_id,
      manager_name: currentData.manager_name,
    };

    // O e-mail corporativo nao e editavel no formulario publico: se nao veio
    // no preset (convites criados antes disso) nem no envio, usa o do convite,
    // senao o submit falharia por "campo obrigatorio ausente" sem que o
    // colaborador tenha como preencher.
    if (!String(mergedData.email ?? '').trim()) {
      mergedData.email = invite.invite_email;
    }

    const requiredFields = (invite.required_fields as string[]) || DEFAULT_REQUIRED_FIELDS;
    const missing = requiredFields.filter((field) => {
      const value = mergedData[field];
      return value === undefined || value === null || String(value).trim() === '';
    });

    if (missing.length > 0) {
      throw new BadRequestException(`Campos obrigatórios ausentes: ${missing.join(', ')}`);
    }

    await this.prisma.onboarding_request.update({
      where: { id: invite.id },
      data: {
        submitted_data: mergedData,
        submitted_at: new Date(),
        status: 'SUBMITTED',
      },
    });

    return { submitted: true };
  }

  async approve(id: string, companyId: string, reviewerUserId?: string) {
    const invite = await this.prisma.onboarding_request.findUnique({
      where: { id },
    });

    if (!invite || invite.company_id !== companyId) {
      throw new NotFoundException('Onboarding não encontrado');
    }

    if (invite.status !== 'SUBMITTED') {
      throw new BadRequestException('Somente onboarding submetido pode ser aprovado');
    }

    const data = (invite.submitted_data || {}) as Record<string, any>;

    if (!data.legal_name || !data.government_id || !data.email || !data.hire_date) {
      throw new BadRequestException('Dados mínimos não preenchidos para aprovação');
    }

    const hireDate = this.parseDate(data.hire_date);
    if (!hireDate) {
      throw new BadRequestException('Data de admissão inválida');
    }

    const cpf = this.cleanDigits(data.government_id);

    const result = await this.prisma.$transaction(async (tx) => {
      let person = await tx.person.findFirst({
        where: { government_id: cpf },
      });

      if (!person) {
        person = await tx.person.create({
          data: {
            legal_name: data.legal_name,
            preferred_name: data.preferred_name || null,
            government_id: cpf,
            passport: data.passport || null,
            rg_issuer: data.rg_issuer || null,
            rg_state: data.rg_state || null,
            rg_issue_date: this.parseDate(data.rg_issue_date),
            ssn: data.ssn || null,
            cnh_category: data.cnh_category || null,
            cnh_issue_date: this.parseDate(data.cnh_issue_date),
            cnh_expiry_date: this.parseDate(data.cnh_expiry_date),
            cnh_issuer: data.cnh_issuer || null,
            cnh_state: data.cnh_state || null,
            pis: data.pis || null,
            date_of_birth: this.parseDate(data.date_of_birth),
            gender: data.gender || null,
            nationality: data.nationality || null,
            ethnicity: data.ethnicity || null,
            mother_name: data.mother_name || null,
            education_level: data.education_level || null,
            marital_status: data.marital_status || null,
            has_food_intolerance: !!data.food_intolerance,
            food_intolerance: data.food_intolerance || null,
            has_medication_allergy: !!data.medication_allergy,
            medication_allergy: data.medication_allergy || null,
          },
        });
      }

      const employeeFromPerson = await tx.employee.findFirst({
        where: { person_id: person.id, company_id: companyId },
      });
      if (employeeFromPerson) {
        throw new BadRequestException('Este colaborador já existe para a empresa atual');
      }

      await tx.personal_contact.create({
        data: {
          person_id: person.id,
          email: data.email || null,
          personal_email: data.personal_email || null,
          phone: data.phone || null,
          corporate_phone: data.corporate_phone || null,
          postal_code: data.postal_code || null,
          address: data.address || null,
          address_number: data.address_number || null,
          address_complement: data.address_complement || null,
          neighborhood: data.neighborhood || null,
          city: data.city || null,
          state: data.state || null,
          country: data.country || null,
          is_primary: true,
        },
      });

      let costCenterId: string | null = null;
      if (data.cost_center) {
        const cc = await tx.cost_center.findFirst({
          where: { company_id: companyId, name: data.cost_center },
          select: { id: true },
        });
        costCenterId = cc?.id || null;
      }

      let managerId: string | null = null;
      if (data.manager_id) {
        const manager = await tx.employee.findFirst({
          where: {
            id: data.manager_id,
            company_id: companyId,
          },
          select: { id: true },
        });
        managerId = manager?.id || null;
      } else if (data.manager_cpf) {
        const managerCpf = this.cleanDigits(data.manager_cpf);
        const manager = await tx.employee.findFirst({
          where: {
            company_id: companyId,
            person: { government_id: managerCpf },
          },
          select: { id: true },
        });
        managerId = manager?.id || null;
      }

      const employee = await tx.employee.create({
        data: {
          person_id: person.id,
          company_id: companyId,
          employee_number: data.employee_number || null,
          employee_type: invite.employee_type_value || data.employee_type || null,
          status: 'ACTIVE',
          hire_date: hireDate,
          manager_id: managerId,
          cost_center_id: costCenterId,
          observation: data.observation || null,
        },
      });

      const departmentId = data.department_id || null;
      if (departmentId || data.department) {
        const dept = await tx.department.findFirst({
          where: departmentId
            ? { company_id: companyId, id: departmentId }
            : { company_id: companyId, name: data.department },
          select: { id: true },
        });

        if (dept) {
          await tx.employee_department.create({
            data: {
              employee_id: employee.id,
              department_id: dept.id,
              start_date: hireDate,
              is_primary: true,
            },
          });
        }
      }

      const positionId = data.position_id || null;
      if (positionId || data.position) {
        const position = await tx.position.findFirst({
          where: positionId
            ? { company_id: companyId, id: positionId }
            : { company_id: companyId, name: data.position },
          select: { id: true },
        });

        if (position) {
          await tx.employee_position.create({
            data: {
              employee_id: employee.id,
              position_id: position.id,
              start_date: hireDate,
            },
          });
        }
      }

      if (data.contract_type || data.work_hours || data.salary) {
        const contract = await tx.contract.create({
          data: {
            employee_id: employee.id,
            contract_type: data.contract_type || null,
            work_hours: data.work_hours || null,
            payment_category: 'MONTHLY',
            start_date: hireDate,
          },
        });

        if (data.salary && !isNaN(Number(String(data.salary).replace(',', '.')))) {
          await tx.salary.create({
            data: {
              contract_id: contract.id,
              amount: Number(String(data.salary).replace(',', '.')),
              currency: 'BRL',
              start_date: hireDate,
            },
          });
        }
      }

      await tx.onboarding_request.update({
        where: { id: invite.id },
        data: {
          status: 'APPROVED',
          reviewed_at: new Date(),
          reviewed_by_user_id: reviewerUserId || null,
          created_employee_id: employee.id,
        },
      });

      return employee;
    });

    this.logger.log(`Onboarding approved: ${id} -> employee ${result.id}`);
    return { approved: true, employee_id: result.id };
  }

  async reject(id: string, companyId: string, reviewerUserId?: string, reviewNotes?: string) {
    const invite = await this.prisma.onboarding_request.findUnique({
      where: { id },
    });

    if (!invite || invite.company_id !== companyId) {
      throw new NotFoundException('Onboarding não encontrado');
    }

    if (invite.status === 'APPROVED') {
      throw new BadRequestException('Onboarding já aprovado não pode ser rejeitado');
    }

    await this.prisma.onboarding_request.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewed_at: new Date(),
        reviewed_by_user_id: reviewerUserId || null,
        review_notes: reviewNotes || null,
      },
    });

    return { rejected: true };
  }

  async cancel(id: string, companyId: string, reviewerUserId?: string) {
    const invite = await this.prisma.onboarding_request.findUnique({
      where: { id },
    });

    if (!invite || invite.company_id !== companyId) {
      throw new NotFoundException('Onboarding não encontrado');
    }

    if (invite.status === 'APPROVED') {
      throw new BadRequestException('Onboarding aprovado não pode ser excluído');
    }

    await this.prisma.onboarding_request.delete({
      where: { id },
    });

    return { deleted: true };
  }
}
