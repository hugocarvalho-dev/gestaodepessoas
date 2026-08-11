import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CompanyQueryDto } from './dto/company-query.dto';

@ApiTags('Companies')
@Controller('companies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Company ID' })
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @ApiQuery({ name: 'scope', required: false, enum: ['all'] })
  async findAll(@Query() query: CompanyQueryDto, @Request() req) {
    const { scope, ...pagination } = query;
    if (scope === 'all') {
      try {
        return await this.companyService.findAllForAdmin(pagination, req.user.id);
      } catch (error) {
        if (error instanceof ForbiddenException) {
          return this.companyService.findUserCompanies(req.user.id);
        }
        throw error;
      }
    }
    const companyId = req.headers['x-company-id'];
    // Se não houver companyId, retorna as empresas do usuário logado
    if (!companyId) {
      return this.companyService.findUserCompanies(req.user.id);
    }
    return this.companyService.findAll(pagination, companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.companyService.findOne(id, companyId);
  }

  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto, @Request() req) {
    return this.companyService.create(createCompanyDto, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Request() req,
  ) {
    return this.companyService.update(id, updateCompanyDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.companyService.remove(id, req.user.id);
  }

  @Get(':id/employees')
  getCompanyEmployees(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
    @Request() req,
  ) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.companyService.getEmployeesByCompany(id, pagination, companyId);
  }

  @Get(':id/departments')
  getCompanyDepartments(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
    @Request() req,
  ) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.companyService.getDepartmentsByCompany(id, pagination, companyId);
  }
}
