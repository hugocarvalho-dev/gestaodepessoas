import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { EmployeeTypeConfigService } from './employee-type-config.service';
import { CreateEmployeeTypeConfigDto, UpdateEmployeeTypeConfigDto } from './dto/employee-type-config.dto';

@Controller('employee-type-configs')
@UseGuards(JwtAuthGuard)
export class EmployeeTypeConfigController {
  constructor(private readonly service: EmployeeTypeConfigService) {}

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
  create(@Body() dto: CreateEmployeeTypeConfigDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    return this.service.create(dto, companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeTypeConfigDto, @Request() req) {
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
