import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ContractTypeConfigService } from './contract-type-config.service';
import { CreateContractTypeConfigDto, UpdateContractTypeConfigDto } from './dto/contract-type-config.dto';

@Controller('contract-type-configs')
@UseGuards(JwtAuthGuard)
export class ContractTypeConfigController {
  constructor(private readonly service: ContractTypeConfigService) {}

  @Get()
  findAll(@Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    return this.service.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    return this.service.findOne(id, companyId);
  }

  @Post()
  create(@Body() dto: CreateContractTypeConfigDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    return this.service.create(dto, companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContractTypeConfigDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    return this.service.update(id, dto, companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    return this.service.remove(id, companyId);
  }
}
