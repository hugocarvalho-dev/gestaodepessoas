import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService } from '@/modules/logger/audit.service';
import { Logger } from '@nestjs/common';

/**
 * Interceptor que captura automaticamente mudanças em operações CRUD
 * e registra no audit log
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(@Inject(AuditService) private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, user, headers, body } = request;

    // Apenas audita operações de escrita
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const companyId = (headers['x-company-id'] as string);
    const userId = (user as any)?.id;

    const pathParts = url.split('?')[0].split('/').filter(Boolean);
    const resourceIndex = pathParts[0] === 'api' ? 1 : 0;
    const tableName = pathParts[resourceIndex] || 'unknown';
    const possibleRecordId = pathParts[pathParts.length - 1];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isIdOnPath = uuidRegex.test(possibleRecordId);

    // Skip auditoria se não houver companyId (ex: rotas de auth pública)
    if (!companyId) {
      return next.handle();
    }

    const beforeDataPromise =
      ['PATCH', 'DELETE'].includes(method) && isIdOnPath
        ? this.auditService.getRecordSnapshot(tableName, possibleRecordId, companyId)
        : Promise.resolve(null);

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const recordId = response?.id || pathParts[pathParts.length - 1];

          if (!uuidRegex.test(recordId)) {
            // Skip se não é UUID válido
            return;
          }

          const beforeData = await beforeDataPromise;

          // Determina a ação
          let action: 'CREATE' | 'UPDATE' | 'DELETE' = 'UPDATE';
          if (method === 'POST') action = 'CREATE';
          if (method === 'DELETE') action = 'DELETE';

          // Registra auditoria (não deve bloquear)
          await this.auditService.log({
            companyId,
            tableName,
            recordId,
            action,
            dataBefore: beforeData,
            dataAfter: response,
            userId,
            ipAddress: this.getClientIp(request),
            userAgent: request.get('user-agent'),
          });
        } catch (error) {
          // Silencia erros de auditoria para não bloquear requisição
          this.logger.warn(`Erro ao registrar auditoria: ${error.message}`);
        }
      }),
    );
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.ip ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}
