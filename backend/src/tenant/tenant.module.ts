import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { TenantMiddleware } from '../common/middleware/tenant.middleware';
import { TenantConnectionService } from '../common/services/tenant-connection.service';

/**
 * TenantModule
 *
 * Registra o middleware de identificacao de tenant e o servico de conexao dinamica.
 *
 * O middleware e aplicado a todas as rotas da API principal, exceto:
 * - /api/health (health check)
 * - GET /api/upload/* (servir arquivos estaticos; img tags nao enviam headers customizados)
 *
 * Login tambem precisa de tenant, porque o usuario mora no banco do tenant.
 *
 * Para usar em modo single-tenant, remova MASTER_DATABASE_URL do ambiente.
 */
@Module({
  providers: [TenantConnectionService],
  exports: [TenantConnectionService],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        'health',
        'api/health',
        { path: 'upload/(.*)', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
