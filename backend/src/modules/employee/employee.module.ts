import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeImportExportService } from './employee-import-export.service';
import { EmployeeController } from './employee.controller';

@Module({
  controllers: [EmployeeController],
  providers: [EmployeeService, EmployeeImportExportService],
})
export class EmployeeModule {}
