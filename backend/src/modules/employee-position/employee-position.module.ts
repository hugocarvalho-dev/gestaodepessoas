import { Module } from '@nestjs/common';
import { EmployeePositionService } from './employee-position.service';
import { EmployeePositionController } from './employee-position.controller';

@Module({
  controllers: [EmployeePositionController],
  providers: [EmployeePositionService],
})
export class EmployeePositionModule {}
