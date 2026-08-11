import { Controller, Get, Post, Body, Patch, Delete, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { PersonalContactService } from './personal-contact.service';
import { CreatePersonalContactDto } from './dto/personal-contact.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Personal Contacts')
@Controller('personal-contact')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Company ID' })
export class PersonalContactController {
  constructor(private readonly service: PersonalContactService) {}

  @Get('person/:personId')
  @ApiOperation({ summary: 'Get personal contacts by person ID' })
  @ApiParam({ name: 'personId', description: 'Person ID' })
  @ApiQuery({ name: 'skip', type: Number, required: false })
  @ApiQuery({ name: 'take', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Personal contacts retrieved' })
  @ApiResponse({ status: 404, description: 'Person not found' })
  findByPerson(@Param('personId') personId: string, @Query() pagination: PaginationDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.findByPerson(personId, pagination, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new personal contact' })
  @ApiResponse({ status: 201, description: 'Personal contact created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() data: CreatePersonalContactDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.create(data, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update personal contact' })
  @ApiParam({ name: 'id', description: 'Personal contact ID' })
  @ApiResponse({ status: 200, description: 'Personal contact updated' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  update(@Param('id') id: string, @Body() data: any, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.update(id, data, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete personal contact' })
  @ApiParam({ name: 'id', description: 'Personal contact ID' })
  @ApiResponse({ status: 200, description: 'Personal contact deleted' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  remove(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.remove(id, companyId);
  }
}
