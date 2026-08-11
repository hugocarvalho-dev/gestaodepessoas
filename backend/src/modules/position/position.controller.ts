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
import { PositionService } from './position.service';
import { CreatePositionDto, UpdatePositionDto } from './dto/position.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Positions')
@Controller('positions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Company ID' })
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Get()
  findAll(@Query() pagination: PaginationDto, @Query('search') search: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.positionService.findAll(pagination, companyId, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.positionService.findOne(id, companyId);
  }

  @Post()
  create(@Body() createPositionDto: CreatePositionDto, @Request() req) {
    const companyId = req.headers['x-company-id'] || createPositionDto.company_id;
    if (!companyId) {
      throw new BadRequestException('x-company-id header or company_id in body is required');
    }
    return this.positionService.create(createPositionDto, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePositionDto: UpdatePositionDto,
    @Request() req,
  ) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.positionService.update(id, updatePositionDto, companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.positionService.remove(id, companyId);
  }
}
