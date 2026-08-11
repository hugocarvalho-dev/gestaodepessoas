import { Module } from '@nestjs/common';
import { EmployeeSkillService } from './employee-skill.service';
import { EmployeeSkillController } from './employee-skill.controller';

@Module({
  controllers: [EmployeeSkillController],
  providers: [EmployeeSkillService],
})
export class EmployeeSkillModule {}
