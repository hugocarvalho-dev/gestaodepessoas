import { Controller, Get, Patch, Param, Body, Delete, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tenants/:tenantId/subscription')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Get()
  findByTenant(@Param('tenantId') tenantId: string) {
    return this.service.findByTenant(tenantId);
  }

  @Patch()
  update(
    @Param('tenantId') tenantId: string,
    @Body() body: { plan?: string; price_monthly?: number; billing_cycle?: string; status?: string },
  ) {
    return this.service.update(tenantId, body);
  }

  @Delete()
  cancel(@Param('tenantId') tenantId: string) {
    return this.service.cancel(tenantId);
  }
}
