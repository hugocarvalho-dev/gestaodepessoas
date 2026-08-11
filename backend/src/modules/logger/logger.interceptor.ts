import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    const user = request.user?.email || 'anonymous';
    const companyId = headers['x-company-id'] || 'no-company';

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.logger.log(
            `${method} ${url} - User: ${user} - Company: ${companyId} - ${Date.now() - now}ms`,
          );
        },
        error: (error) => {
          const statusCode = Number(error?.status || error?.statusCode || 500);
          const logMessage = `${method} ${url} - User: ${user} - Company: ${companyId} - ${error.message}`;

          if (statusCode >= 500) {
            this.logger.error(logMessage);
            return;
          }

          this.logger.warn(logMessage);
        },
      }),
    );
  }
}