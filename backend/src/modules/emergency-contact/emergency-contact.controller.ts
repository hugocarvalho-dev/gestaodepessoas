import { Controller, Get, Post, Body, Patch, Delete, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { EmergencyContactService } from './emergency-contact.service';
import { CreateEmergencyContactDto } from './dto/emergency-contact.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Emergency Contacts')
@Controller('emergency-contact')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Company ID' })
export class EmergencyContactController {
  constructor(private readonly service: EmergencyContactService) {}

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get emergency contacts by employee ID' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiQuery({ name: 'skip', type: Number, required: false })
  @ApiQuery({ name: 'take', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Emergency contacts retrieved' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  findByEmployee(@Param('employeeId') employeeId: string, @Query() pagination: PaginationDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.findByEmployee(employeeId, pagination, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new emergency contact' })
  @ApiResponse({ status: 201, description: 'Emergency contact created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() data: CreateEmergencyContactDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.create(data, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update emergency contact' })
  @ApiParam({ name: 'id', description: 'Emergency contact ID' })
  @ApiResponse({ status: 200, description: 'Emergency contact updated' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  update(@Param('id') id: string, @Body() data: any, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.update(id, data, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete emergency contact' })
  @ApiParam({ name: 'id', description: 'Emergency contact ID' })
  @ApiResponse({ status: 200, description: 'Emergency contact deleted' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  remove(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.remove(id, companyId);
  }
}
