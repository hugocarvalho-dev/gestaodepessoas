import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = 
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const stack = exception instanceof Error ? exception.stack : undefined;

    const logPayload = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      message: exception instanceof Error ? exception.message : message,
      ...(stack ? { stack } : {}),
      user: (request.user as any)?.email,
      companyId: request.headers['x-company-id'],
      body: request.body,
      query: request.query,
      params: request.params,
    };

    if (status >= 500) {
      this.logger.error(logPayload as any);
    } else {
      this.logger.warn(logPayload as any);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
    });
  }
}