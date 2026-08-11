import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto, UpdateTenantStatusDto, AddCompanyDto } from './dto/tenant.dto';
import { ProvisioningService } from '../provisioning/provisioning.service';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provisioning: ProvisioningService,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { document: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          subscription: true,
          _count: { select: { companies: true, payments: true } },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: true,
        companies: { orderBy: { created_at: 'asc' } },
        payments: { orderBy: { created_at: 'desc' }, take: 10 },
        admin_notes: { orderBy: { created_at: 'desc' }, take: 20 },
      },
    });

    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: { subscription: true },
    });
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    return tenant;
  }

  async create(dto: CreateTenantDto) {
    // Verificar slug único
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug já está em uso');

    // Verificar document único
    if (dto.document) {
      const existingDoc = await this.prisma.tenant.findUnique({ where: { document: dto.document } });
      if (existingDoc) throw new ConflictException('Documento (CNPJ/CPF) já cadastrado');
    }

    const databaseName = `tenant_${dto.slug.replace(/-/g, '_')}`;

    // Criar tenant no banco master
    let tenant;
    try {
      tenant = await this.prisma.tenant.create({
        data: {
          ...dto,
          database_name: databaseName,
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias trial
        },
        include: { subscription: true },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'campo';
        throw new ConflictException(`Já existe um tenant com este ${field === 'slug' ? 'slug' : field === 'document' ? 'documento (CNPJ/CPF)' : field}`);
      }
      throw error;
    }

    // Provisionar banco do tenant (criar database + rodar migrations — SEM seed)
    try {
      await this.provisioning.provisionTenantDatabase(databaseName);
    } catch (error) {
      // Se falhar o provisionamento, remover o registro criado
      await this.prisma.tenant.delete({ where: { id: tenant.id } });
      throw error;
    }

    // Criar assinatura padrão (STARTER)
    await this.prisma.subscription.create({
      data: {
        tenant_id: tenant.id,
        plan: 'STARTER',
        price_monthly: 0,
        billing_cycle: 'MONTHLY',
        status: 'ACTIVE',
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return this.findOne(tenant.id);
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant não encontrado');

    // Verificar slug único (se alterado)
    if (dto.slug && dto.slug !== tenant.slug) {
      const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new ConflictException('Slug já está em uso');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: dto,
      include: { subscription: true },
    });
  }

  async updateStatus(id: string, dto: UpdateTenantStatusDto, adminUserId?: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant não encontrado');

    const updateData: any = { status: dto.status };

    switch (dto.status) {
      case 'ACTIVE':
        updateData.activated_at = new Date();
        updateData.suspended_at = null;
        break;
      case 'SUSPENDED':
        updateData.suspended_at = new Date();
        break;
      case 'CANCELLED':
        updateData.cancelled_at = new Date();
        break;
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: updateData,
      include: { subscription: true },
    });

    // Registrar auditoria
    await this.prisma.tenant_audit_log.create({
      data: {
        tenant_id: id,
        admin_user_id: adminUserId || null,
        action: `STATUS_CHANGED_TO_${dto.status}`,
        details: { previous_status: tenant.status, reason: dto.reason },
      },
    });

    return updated;
  }

  async addNote(tenantId: string, author: string, content: string) {
    return this.prisma.admin_note.create({
      data: { tenant_id: tenantId, author, content },
    });
  }

  /**
   * Adiciona uma empresa ao tenant.
   * Cria a company no banco do tenant + cria/atualiza usuário admin.
   * Também registra a empresa no banco master (tenant_company).
   */
  async addCompany(tenantId: string, dto: AddCompanyDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant não encontrado');

    // Criar company no banco do tenant + admin user
    const result = await this.provisioning.addCompanyToTenant(
      tenant.database_name,
      {
        name: dto.name,
        document: dto.document,
        phone: dto.phone,
        address: dto.address,
        address_number: dto.address_number,
        complement: dto.complement,
        neighborhood: dto.neighborhood,
        city: dto.city,
        state: dto.state,
        postal_code: dto.postal_code,
        country: dto.country,
        is_headquarters: dto.is_headquarters,
      },
      dto.admin_email,
    );

    // Registrar no banco master (tenant_company)
    await this.prisma.tenant_company.create({
      data: {
        tenant_id: tenantId,
        company_name: dto.name,
        company_document: dto.document,
        is_headquarters: dto.is_headquarters || false,
        status: 'ACTIVE',
      },
    });

    return {
      message: 'Empresa adicionada com sucesso',
      companyId: result.companyId,
      userId: result.userId,
      isNewUser: result.isNewUser,
      adminEmail: dto.admin_email,
      ...(result.isNewUser ? { defaultPassword: 'MudarSenha@123' } : {}),
    };
  }

  /**
   * Aplica migrations pendentes em todos os bancos de tenants.
   */
  async migrateAllTenants() {
    const tenants = await this.prisma.tenant.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { slug: true, database_name: true, status: true },
    });

    if (tenants.length === 0) {
      return { message: 'Nenhum tenant encontrado para migrar', success: [], failed: [] };
    }

    this.logger.log(`🔄 Migrando ${tenants.length} tenant(s)...`);
    const databaseNames = tenants.map(t => t.database_name);
    const result = await this.provisioning.migrateAllTenants(databaseNames);

    this.logger.log(`✅ Migração concluída: ${result.success.length} sucesso, ${result.failed.length} falhas`);
    return {
      message: `Migração concluída: ${result.success.length} sucesso, ${result.failed.length} falhas`,
      ...result,
    };
  }

  async getStats() {
    const [total, active, trial, suspended, cancelled] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      this.prisma.tenant.count({ where: { status: 'TRIAL' } }),
      this.prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.tenant.count({ where: { status: 'CANCELLED' } }),
    ]);

    return { total, active, trial, suspended, cancelled };
  }
}
