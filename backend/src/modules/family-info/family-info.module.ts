import { Module } from '@nestjs/common';
import { FamilyInfoService } from './family-info.service';
import { FamilyInfoController } from './family-info.controller';

@Module({
  controllers: [FamilyInfoController],
  providers: [FamilyInfoService],
})
export class FamilyInfoModule {}
