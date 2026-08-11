import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Get('payments/summary')
  getSummary() {
    return this.service.getSummary();
  }

  @Get('tenants/:tenantId/payments')
  findByTenant(
    @Param('tenantId') tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.service.findByTenant(tenantId, { page, limit, status });
  }

  @Post('tenants/:tenantId/payments')
  create(
    @Param('tenantId') tenantId: string,
    @Body() body: { amount: number; payment_method?: string; description?: string; due_date?: string; reference?: string },
  ) {
    return this.service.create(tenantId, body);
  }

  @Patch('payments/:paymentId/pay')
  markAsPaid(@Param('paymentId') paymentId: string) {
    return this.service.markAsPaid(paymentId);
  }

  @Patch('payments/:paymentId/cancel')
  cancel(@Param('paymentId') paymentId: string) {
    return this.service.cancel(paymentId);
  }
}
