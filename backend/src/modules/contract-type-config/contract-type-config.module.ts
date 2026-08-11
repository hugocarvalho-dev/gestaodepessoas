import { Module } from '@nestjs/common';
import { ContractTypeConfigService } from './contract-type-config.service';
import { ContractTypeConfigController } from './contract-type-config.controller';

@Module({
  controllers: [ContractTypeConfigController],
  providers: [ContractTypeConfigService],
})
export class ContractTypeConfigModule {}
