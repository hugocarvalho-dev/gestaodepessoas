import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { LoggerModule } from '@/modules/logger/logger.module';
import { ExportService } from '@/common/services/export.service';

@Module({
  imports: [LoggerModule],
  controllers: [AuditController],
  providers: [ExportService],
})
export class AuditModule {}
