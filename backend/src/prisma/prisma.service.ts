import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { getCurrentDatabaseName } from '../tenant/tenant.context';

/**
 * PrismaService — Multi-Tenant Transparente
 * 
 * COMO FUNCIONA:
 * - Mantém o PrismaClient padrão (DATABASE_URL) para modo single-tenant
 * - Quando há um tenant ativo (via AsyncLocalStorage), retorna um PrismaClient
 *   conectado ao banco do tenant
 * - Usa Proxy para interceptar acesso às propriedades (employee, company, etc.)
 *   e redirecionar para o client correto
 * - Nenhum service precisa ser alterado — todos continuam usando this.prisma
 * 
 * Cache de pools:
 * - Cada tenant database tem um Pool PostgreSQL compartilhado
 * - PrismaClients são criados por pool (não por request)
 * - Pools ficam ativos enquanto o servidor roda
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private static readonly logger = new Logger('PrismaService');
  
  // Pool e client padrão (DATABASE_URL)
  private defaultPool: Pool;
  
  // Cache estático: databaseName → { pool, client }
  private static tenantCache = new Map<string, { pool: Pool; client: PrismaClient }>();
  private static readonly MAX_POOL_SIZE = 10;

  constructor() {
    // Criar pool de conexão PostgreSQL padrão
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Criar adapter para Prisma
    const adapter = new PrismaPg(pool);
    
    // Passar o adapter para o PrismaClient (OBRIGATÓRIO no Prisma 7)
    super({ adapter });
    
    // Guardar referência ao pool padrão
    this.defaultPool = pool;
    
    console.log('✅ Prisma adapter criado com sucesso');

    // Retornar um Proxy que intercepta acesso aos models
    // e redireciona para o PrismaClient do tenant correto
    return new Proxy(this, {
      get(target: PrismaService, prop: string | symbol, receiver: any) {
        // Propriedades internas do Proxy/JS — não interceptar
        if (typeof prop === 'symbol') {
          return Reflect.get(target, prop, receiver);
        }

        // Métodos do serviço NestJS e lifecycle — sempre no target original
        const serviceMethods = [
          'onModuleInit', 'onModuleDestroy', 'constructor',
          'getClientForCurrentTenant', 'getOrCreateTenantClient',
          'defaultPool',
        ];
        if (serviceMethods.includes(prop)) {
          return Reflect.get(target, prop, receiver);
        }

        // Verificar se há tenant ativo no contexto assíncrono
        const databaseName = getCurrentDatabaseName();
        
        if (!databaseName) {
          // Sem tenant → usar client padrão (this = PrismaClient original)
          return Reflect.get(target, prop, receiver);
        }

        // Com tenant → redirecionar para o client do tenant
        const tenantClient = target.getOrCreateTenantClient(databaseName);
        const value = (tenantClient as any)[prop];
        
        // Se for uma função, bind ao client correto
        if (typeof value === 'function') {
          return value.bind(tenantClient);
        }
        
        return value;
      },
    });
  }

  /**
   * Obtém ou cria um PrismaClient para o banco do tenant.
   * Os clients são cacheados estaticamente (compartilhados entre requests).
   */
  getOrCreateTenantClient(databaseName: string): PrismaClient {
    const cached = PrismaService.tenantCache.get(databaseName);
    if (cached) return cached.client;

    PrismaService.logger.log(`🔌 Criando PrismaClient para tenant: ${databaseName}`);

    const host = process.env.TENANT_DB_HOST || 'localhost';
    const port = parseInt(process.env.TENANT_DB_PORT, 10) || 5432;
    const user = process.env.TENANT_DB_USER || 'postgres';
    const password = process.env.TENANT_DB_PASSWORD || 'postgres';

    const pool = new Pool({
      host,
      port,
      user,
      password,
      database: databaseName,
      max: PrismaService.MAX_POOL_SIZE,
      idleTimeoutMillis: 30000,
    });

    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({ adapter });

    PrismaService.tenantCache.set(databaseName, { pool, client });
    PrismaService.logger.log(`✅ PrismaClient criado para tenant: ${databaseName}`);

    return client;
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Conectado ao banco de dados padrão');
  }

  async onModuleDestroy() {
    // Desconectar client padrão
    await this.$disconnect();
    await this.defaultPool.end();
    
    // Desconectar todos os clients de tenant
    for (const [name, { pool, client }] of PrismaService.tenantCache) {
      await client.$disconnect();
      await pool.end();
      PrismaService.logger.log(`🔌 Pool/Client encerrado: ${name}`);
    }
    PrismaService.tenantCache.clear();
    
    console.log('🔄 Desconectado de todos os bancos de dados');
  }
}
