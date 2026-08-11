import { Injectable, NestMiddleware, ForbiddenException, Logger, OnModuleDestroy } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { tenantStore, TenantData } from '../../tenant/tenant.context';

/**
 * TenantMiddleware
 * 
 * Identifica o tenant a partir da requisição:
 * - PRODUÇÃO: Extrai slug do subdomínio (acme.seudominio.com → acme)
 * - DESENVOLVIMENTO: Lê do header x-tenant-slug ou query ?tenant=acme
 * 
 * Busca o tenant no banco MASTER e injeta:
 * - req['tenant'], req['tenantSlug'], req['tenantDatabaseName'] (legado)
 * - AsyncLocalStorage via tenantStore (usado pelo PrismaService)
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware, OnModuleDestroy {
  private readonly logger = new Logger(TenantMiddleware.name);
  private masterPool: Pool;
  // Cache de tenants para evitar queries a cada request
  private tenantCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 60_000; // 1 minuto

  constructor(private readonly config: ConfigService) {
    const masterDbUrl = this.config.get<string>('MASTER_DATABASE_URL');
    if (masterDbUrl) {
      this.masterPool = new Pool({ connectionString: masterDbUrl });
      this.logger.log('🔗 Multi-tenant habilitado — conectado ao banco MASTER');
    } else {
      this.logger.warn('⚠️ MASTER_DATABASE_URL não definido — rodando em modo single-tenant');
    }
  }

  async onModuleDestroy() {
    if (this.masterPool) {
      await this.masterPool.end();
    }
  }

  async use(req: Request, _res: Response, next: NextFunction) {
    // Se não há banco master configurado, prosseguir sem multi-tenancy
    // (modo compatível com a instalação single-tenant atual)
    if (!this.masterPool) {
      return next();
    }

    const slug = this.extractSlug(req);
    if (!slug) {
      throw new ForbiddenException('Tenant não identificado. Forneça x-tenant-slug no header ou ?tenant= na query string.');
    }

    // Buscar tenant (com cache)
    const tenant = await this.resolveTenant(slug);
    if (!tenant) {
      throw new ForbiddenException(`Tenant "${slug}" não encontrado`);
    }

    if (tenant.status === 'SUSPENDED') {
      throw new ForbiddenException('Conta suspensa. Entre em contato com o suporte.');
    }

    if (tenant.status === 'CANCELLED' || tenant.status === 'INACTIVE') {
      throw new ForbiddenException('Conta desativada.');
    }

    // Injetar dados do tenant na request (compatibilidade legada)
    req['tenant'] = tenant;
    req['tenantSlug'] = tenant.slug;
    req['tenantDatabaseName'] = tenant.database_name;

    // Injetar no AsyncLocalStorage para que o PrismaService use o banco correto
    const tenantData: TenantData = {
      id: tenant.id,
      slug: tenant.slug,
      databaseName: tenant.database_name,
      databaseHost: tenant.database_host,
      databasePort: tenant.database_port,
      status: tenant.status,
      maxEmployees: tenant.max_employees,
      maxUsers: tenant.max_users,
    };

    tenantStore.run(tenantData, () => {
      next();
    });
  }

  /**
   * Extrai o slug do tenant da requisição.
   * Ordem de prioridade:
   * 1. Header x-tenant-slug (dev + produção)
   * 2. Query string ?tenant=slug (dev)
   * 3. Subdomínio do hostname (produção)
   */
  private extractSlug(req: Request): string | null {
    // 1. Header explícito
    const headerSlug = req.headers['x-tenant-slug'] as string;
    if (headerSlug) return headerSlug.toLowerCase();

    // 2. Query string (apenas em dev)
    const nodeEnv = this.config.get('NODE_ENV', 'development');
    if (nodeEnv === 'development' && req.query.tenant) {
      const slug = (req.query.tenant as string).toLowerCase();
      // Remover 'tenant' do query para não conflitar com validation pipe
      // É necessário remover da URL também, pois Express repopula req.query
      delete req.query.tenant;
      const url = new URL(req.url, `http://${req.headers.host}`);
      url.searchParams.delete('tenant');
      req.url = url.pathname + (url.search || '');
      return slug;
    }

    // 3. Subdomínio
    const hostname = req.hostname;
    const baseDomain = this.config.get('BASE_DOMAIN', ''); // ex: 'seudominio.com'
    if (baseDomain && hostname.endsWith(baseDomain)) {
      const subdomain = hostname.replace(`.${baseDomain}`, '');
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        return subdomain.toLowerCase();
      }
    }

    // Extrair de hostname genérico (acme.localhost → acme)
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'api') {
      // Apenas se não for IP
      if (!/^\d+$/.test(parts[0])) {
        return parts[0].toLowerCase();
      }
    }

    return null;
  }

  /**
   * Resolve o tenant no banco MASTER com cache.
   */
  private async resolveTenant(slug: string): Promise<any | null> {
    // Verificar cache
    const cached = this.tenantCache.get(slug);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const result = await this.masterPool.query(
        `SELECT id, slug, name, database_name, database_host, database_port,
                status, max_employees, max_users, trial_ends_at
         FROM tenant
         WHERE slug = $1`,
        [slug],
      );

      const tenant = result.rows[0] || null;
      if (tenant) {
        this.tenantCache.set(slug, { data: tenant, timestamp: Date.now() });
      }
      return tenant;
    } catch (error) {
      this.logger.error(`Erro ao resolver tenant "${slug}": ${error.message}`);
      return null;
    }
  }
}
