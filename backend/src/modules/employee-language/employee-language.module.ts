import { Module } from '@nestjs/common';
import { EmployeeLanguageService } from './employee-language.service';
import { EmployeeLanguageController } from './employee-language.controller';

@Module({
  controllers: [EmployeeLanguageController],
  providers: [EmployeeLanguageService],
})
export class EmployeeLanguageModule {}
