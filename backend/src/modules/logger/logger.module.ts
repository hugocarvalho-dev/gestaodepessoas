import { Module } from '@nestjs/common';
import { WinstonModule, utilities } from 'nest-winston';
import * as winston from 'winston';
import { LoggingInterceptor } from './logger.interceptor';
import { AllExceptionsFilter } from './logger.filter';
import { AuditService } from './audit.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            utilities.format.nestLike('API', {
              prettyPrint: true,
              colors: true,
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
    PrismaModule,
  ],
  providers: [
    LoggingInterceptor,
    AllExceptionsFilter,
    AuditService,
  ],
  exports: [WinstonModule, LoggingInterceptor, AllExceptionsFilter, AuditService],
})
export class LoggerModule {}