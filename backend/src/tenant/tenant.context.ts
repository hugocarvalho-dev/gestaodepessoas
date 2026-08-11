import { AsyncLocalStorage } from 'async_hooks';

/**
 * TenantContext — Armazena dados do tenant por request usando AsyncLocalStorage.
 * 
 * Fluxo:
 * 1. TenantMiddleware identifica o tenant e chama tenantStore.run(context, next)
 * 2. PrismaService lê tenantStore.getStore() para saber qual banco usar
 * 3. Todos os services continuam usando this.prisma normalmente (zero mudanças)
 * 
 * Em modo single-tenant (sem MASTER_DATABASE_URL), o store fica vazio
 * e o PrismaService usa o DATABASE_URL padrão.
 */
export interface TenantData {
  id: string;
  slug: string;
  databaseName: string;
  databaseHost?: string;
  databasePort?: number;
  status: string;
  maxEmployees: number;
  maxUsers: number;
}

export const tenantStore = new AsyncLocalStorage<TenantData>();

/**
 * Retorna os dados do tenant da request atual ou null.
 */
export function getCurrentTenant(): TenantData | undefined {
  return tenantStore.getStore();
}

/**
 * Retorna o nome do banco do tenant atual (ou undefined se single-tenant).
 */
export function getCurrentDatabaseName(): string | undefined {
  return tenantStore.getStore()?.databaseName;
}
