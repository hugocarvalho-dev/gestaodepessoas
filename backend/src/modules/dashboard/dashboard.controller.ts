import { Controller, Get, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Company ID' })
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('company/:id/overview')
  getCompanyOverview(@Param('id') companyId: string, @Request() req) {
    const requestCompanyId = req.headers['x-company-id'];
    if (!requestCompanyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.getCompanyOverview(requestCompanyId);
  }

  @Get('employee/:id/comprehensive')
  getEmployeeComprehensive(@Param('id') employeeId: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.getEmployeeComprehensive(employeeId, companyId);
  }

  @Get('company/:id/organization-chart')
  getOrganizationChart(@Param('id') companyId: string, @Request() req) {
    const requestCompanyId = req.headers['x-company-id'];
    if (!requestCompanyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.getOrganizationChart(requestCompanyId);
  }
}
