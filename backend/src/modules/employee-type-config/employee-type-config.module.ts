import { Module } from '@nestjs/common';
import { EmployeeTypeConfigService } from './employee-type-config.service';
import { EmployeeTypeConfigController } from './employee-type-config.controller';

@Module({
  controllers: [EmployeeTypeConfigController],
  providers: [EmployeeTypeConfigService],
})
export class EmployeeTypeConfigModule {}
