import { Controller, Get, Post, Body, Patch, Delete, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { EmployeePositionService } from './employee-position.service';
import { CreateEmployeePositionDto } from './dto/employee-position.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Employee Positions')
@Controller('employee-position')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Company ID' })
export class EmployeePositionController {
  constructor(private readonly service: EmployeePositionService) {}

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get employee positions by employee ID' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiQuery({ name: 'skip', type: Number, required: false })
  @ApiQuery({ name: 'take', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Employee positions retrieved' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  findByEmployee(@Param('employeeId') employeeId: string, @Query() pagination: PaginationDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.findByEmployee(employeeId, pagination, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new employee position assignment' })
  @ApiResponse({ status: 201, description: 'Employee position created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() data: CreateEmployeePositionDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.create(data, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee position' })
  @ApiParam({ name: 'id', description: 'Employee position ID' })
  @ApiResponse({ status: 200, description: 'Employee position updated' })
  @ApiResponse({ status: 404, description: 'Position not found' })
  update(@Param('id') id: string, @Body() data: any, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.update(id, data, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete employee position' })
  @ApiParam({ name: 'id', description: 'Employee position ID' })
  @ApiResponse({ status: 200, description: 'Employee position deleted' })
  @ApiResponse({ status: 404, description: 'Position not found' })
  remove(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.remove(id, companyId);
  }
}
