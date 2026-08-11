import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';
import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  CreateOnboardingPlanDto,
  CreateOnboardingRequestDto,
  RejectOnboardingDto,
  UpdateOnboardingPlanDto,
} from './dto/onboarding.dto';

@ApiTags('Onboarding')
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Company ID' })
export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}

  @Get()
  @ApiOperation({ summary: 'List onboarding processes' })
  findAll(@Query() pagination: PaginationDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.findAll(pagination, companyId);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List onboarding plans' })
  findPlans(@Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.findPlans(companyId);
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create onboarding plan' })
  createPlan(@Body() dto: CreateOnboardingPlanDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.createPlan(dto, companyId);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update onboarding plan' })
  updatePlan(@Param('id') id: string, @Body() dto: UpdateOnboardingPlanDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.updatePlan(id, dto, companyId);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete onboarding plan' })
  removePlan(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.removePlan(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create onboarding process' })
  create(@Body() dto: CreateOnboardingRequestDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.createInvite(dto, companyId, req.user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get onboarding request by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.findOne(id, companyId);
  }

  @Get(':id/link')
  @ApiOperation({ summary: 'Get public onboarding link if still valid' })
  getLink(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.getInviteLink(id, companyId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve onboarding request and create employee' })
  approve(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.approve(id, companyId, req.user?.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject onboarding request' })
  reject(@Param('id') id: string, @Body() dto: RejectOnboardingDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.reject(id, companyId, req.user?.id, dto.review_notes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete onboarding process' })
  cancel(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.cancel(id, companyId, req.user?.id);
  }
}
