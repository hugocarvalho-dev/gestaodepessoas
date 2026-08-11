import { Injectable, Scope, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * TenantConnectionService (REQUEST-scoped)
 * 
 * Cria uma conexão Prisma dinâmica para o banco do tenant
 * identificado pelo TenantMiddleware.
 * 
 * Ciclo de vida:
 * 1. TenantMiddleware identifica o tenant e coloca na request
 * 2. TenantConnectionService é instanciado por request
 * 3. No primeiro acesso a `this.client`, cria a conexão Prisma
 * 4. No fim da request, desconecta automaticamente
 * 
 * Uso nos services:
 * ```ts
 * @Injectable({ scope: Scope.REQUEST })
 * export class EmployeesService {
 *   constructor(private readonly tenantDb: TenantConnectionService) {}
 *   
 *   async findAll() {
 *     return this.tenantDb.client.employee.findMany();
 *   }
 * }
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionService.name);
  private _client: PrismaClient | null = null;
  private _pool: Pool | null = null;

  // Cache estático de pools por database (compartilhado entre requests)
  private static poolCache = new Map<string, Pool>();
  private static readonly MAX_POOL_SIZE = 10;

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly config: ConfigService,
  ) {}

  /**
   * Retorna o PrismaClient conectado ao banco do tenant.
   * Cria a conexão lazy na primeira chamada.
   */
  get client(): PrismaClient {
    if (this._client) return this._client;

    const databaseName = this.request['tenantDatabaseName'];
    if (!databaseName) {
      // Fallback: sem multi-tenancy (usa DATABASE_URL padrão)
      this.logger.warn('Nenhum tenant na request — usando banco padrão');
      const pool = new Pool({ connectionString: this.config.get('DATABASE_URL') });
      const adapter = new PrismaPg(pool);
      this._client = new PrismaClient({ adapter });
      this._pool = pool;
      return this._client;
    }

    // Reutilizar pool existente ou criar novo
    const pool = this.getOrCreatePool(databaseName);
    const adapter = new PrismaPg(pool);
    this._client = new PrismaClient({ adapter });

    return this._client;
  }

  private getOrCreatePool(databaseName: string): Pool {
    const cached = TenantConnectionService.poolCache.get(databaseName);
    if (cached) return cached;

    const host = this.request['tenant']?.database_host
      || this.config.get('TENANT_DB_HOST', 'localhost');
    const port = this.request['tenant']?.database_port
      || this.config.get<number>('TENANT_DB_PORT', 5432);
    const user = this.config.get('TENANT_DB_USER', 'postgres');
    const password = this.config.get('TENANT_DB_PASSWORD', 'postgres');

    const pool = new Pool({
      host,
      port: Number(port),
      user,
      password,
      database: databaseName,
      max: TenantConnectionService.MAX_POOL_SIZE,
      idleTimeoutMillis: 30000,
    });

    TenantConnectionService.poolCache.set(databaseName, pool);
    this.logger.log(`🔌 Pool criado para tenant: ${databaseName}`);
    return pool;
  }

  async onModuleDestroy() {
    if (this._client) {
      await this._client.$disconnect();
      this._client = null;
    }
    // Nota: NÃO fechamos o pool aqui pois é compartilhado entre requests
  }

  /**
   * Método estático para limpar todos os pools (shutdown gracioso).
   */
  static async destroyAllPools() {
    for (const [name, pool] of TenantConnectionService.poolCache) {
      await pool.end();
      console.log(`🔌 Pool encerrado: ${name}`);
    }
    TenantConnectionService.poolCache.clear();
  }
}
