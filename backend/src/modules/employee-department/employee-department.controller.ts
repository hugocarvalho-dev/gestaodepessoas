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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { EmployeeDepartmentService } from './employee-department.service';
import { CreateEmployeeDepartmentDto, UpdateEmployeeDepartmentDto } from './dto/employee-department.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Employee Departments')
@Controller('employee-departments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Company ID' })
export class EmployeeDepartmentController {
  constructor(private readonly employeeDepartmentService: EmployeeDepartmentService) {}

  @Get()
  @ApiOperation({ summary: 'List all employee departments' })
  @ApiQuery({ name: 'skip', type: Number, required: false })
  @ApiQuery({ name: 'take', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Employee departments retrieved' })
  findAll(@Query() pagination: PaginationDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.employeeDepartmentService.findAll(pagination, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee department by ID' })
  @ApiParam({ name: 'id', description: 'Employee department ID' })
  @ApiResponse({ status: 200, description: 'Employee department retrieved' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  findOne(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.employeeDepartmentService.findOne(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new employee department assignment' })
  @ApiResponse({ status: 201, description: 'Employee department created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createEmployeeDepartmentDto: CreateEmployeeDepartmentDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.employeeDepartmentService.create(createEmployeeDepartmentDto, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee department' })
  @ApiParam({ name: 'id', description: 'Employee department ID' })
  @ApiResponse({ status: 200, description: 'Employee department updated' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDepartmentDto: UpdateEmployeeDepartmentDto,
    @Request() req,
  ) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.employeeDepartmentService.update(id, updateEmployeeDepartmentDto, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete employee department' })
  @ApiParam({ name: 'id', description: 'Employee department ID' })
  @ApiResponse({ status: 200, description: 'Employee department deleted' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  remove(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.employeeDepartmentService.remove(id, companyId);
  }
}
