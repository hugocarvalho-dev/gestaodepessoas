import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @Tenant() — Extrai os dados do tenant da request
 * 
 * Uso:
 * ```ts
 * @Get()
 * findAll(@Tenant() tenant: TenantData) {
 *   console.log(tenant.slug, tenant.database_name);
 * }
 * ```
 */
export const Tenant = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request['tenant'];
    return data ? tenant?.[data] : tenant;
  },
);

/**
 * @TenantSlug() — Atalho para pegar apenas o slug do tenant
 */
export const TenantSlug = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request['tenantSlug'];
  },
);

/**
 * Interface do tenant injetado na request
 */
export interface TenantData {
  id: string;
  slug: string;
  name: string;
  database_name: string;
  database_host: string | null;
  database_port: number;
  status: string;
  max_employees: number;
  max_users: number;
  trial_ends_at: Date | null;
}
