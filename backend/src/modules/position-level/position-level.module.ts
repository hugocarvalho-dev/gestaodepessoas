import { Module } from '@nestjs/common';
import { PositionLevelService } from './position-level.service';
import { PositionLevelController } from './position-level.controller';

@Module({
  controllers: [PositionLevelController],
  providers: [PositionLevelService],
})
export class PositionLevelModule {}
