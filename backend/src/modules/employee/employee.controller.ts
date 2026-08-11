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
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiHeader, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmployeeService } from './employee.service';
import { EmployeeImportExportService } from './employee-import-export.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { CreateFullEmployeeDto } from './dto/create-full-employee.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Employees')
@Controller('employees')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Company ID' })
export class EmployeeController {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly importExportService: EmployeeImportExportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all employees' })
  @ApiQuery({ name: 'skip', type: Number, required: false })
  @ApiQuery({ name: 'take', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Employees list retrieved' })
  findAll(@Query() pagination: PaginationDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.employeeService.findAll(pagination, companyId);
  }

  @Get('template')
  @ApiOperation({ summary: 'Download XLSX import template' })
  @ApiResponse({ status: 200, description: 'Template file downloaded' })
  downloadTemplate(@Res() res) {
    const buffer = this.importExportService.generateTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template_importacao_colaboradores.xlsx');
    res.send(buffer);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export employees to XLSX' })
  @ApiResponse({ status: 200, description: 'Employees exported' })
  async exportEmployees(@Request() req, @Res() res) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    const buffer = await this.importExportService.generateExport(companyId);
    const date = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=colaboradores_${date}.xlsx`);
    res.send(buffer);
  }

  @Post('import/validate')
  @ApiOperation({ summary: 'Validate XLSX file for import (preview)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiResponse({ status: 200, description: 'Validation result' })
  validateImport(@UploadedFile() file, @Request() req) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }
    return this.importExportService.parseFile(file.buffer);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import employees from XLSX' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiResponse({ status: 201, description: 'Employees imported' })
  async importEmployees(@UploadedFile() file, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }
    return this.importExportService.importEmployees(file.buffer, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee retrieved' })
  findOne(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.employeeService.findOne(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new employee' })
  @ApiResponse({ status: 201, description: 'Employee created' })
  create(@Body() createEmployeeDto: CreateEmployeeDto, @Request() req) {
    const companyId = req.headers['x-company-id'] || createEmployeeDto.company_id;
    if (!companyId) {
      throw new BadRequestException('x-company-id header or companyId in body is required');
    }
    return this.employeeService.create(createEmployeeDto, companyId);
  }

  @Post('full')
  @ApiOperation({ summary: 'Create employee with all related data in a single request' })
  @ApiResponse({ status: 201, description: 'Full employee created with person, contact, contract, etc.' })
  createFull(@Body() dto: CreateFullEmployeeDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.employeeService.createFull(dto, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee updated' })
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @Request() req,
  ) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.employeeService.update(id, updateEmployeeDto, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete employee' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee deleted' })
  remove(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.employeeService.remove(id, companyId);
  }

  @Get(':id/departments')
  @ApiOperation({ summary: 'Get employee departments' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Departments retrieved' })
  getEmployeeDepartments(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
    @Request() req,
  ) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.employeeService.getDepartmentsByEmployee(id, pagination, companyId);
  }

  @Get(':id/positions')
  @ApiOperation({ summary: 'Get employee positions' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Positions retrieved' })
  getEmployeePositions(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
    @Request() req,
  ) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.employeeService.getPositionsByEmployee(id, pagination, companyId);
  }

  @Get(':id/contracts')
  @ApiOperation({ summary: 'Get employee contracts' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Contracts retrieved' })
  getEmployeeContracts(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
    @Request() req,
  ) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.employeeService.getContractsByEmployee(id, pagination, companyId);
  }
}
