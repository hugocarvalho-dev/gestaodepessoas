import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      tenantStats,
      recentTenants,
      paymentSummary,
      subscriptionBreakdown,
    ] = await Promise.all([
      this.getTenantStats(),
      this.getRecentTenants(),
      this.getPaymentSummary(),
      this.getSubscriptionBreakdown(),
    ]);

    return {
      tenants: tenantStats,
      recent_tenants: recentTenants,
      payments: paymentSummary,
      subscriptions: subscriptionBreakdown,
    };
  }

  private async getTenantStats() {
    const [total, active, trial, suspended, cancelled] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      this.prisma.tenant.count({ where: { status: 'TRIAL' } }),
      this.prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.tenant.count({ where: { status: 'CANCELLED' } }),
    ]);
    return { total, active, trial, suspended, cancelled };
  }

  private async getRecentTenants() {
    return this.prisma.tenant.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true, slug: true, name: true, status: true,
        email: true, created_at: true,
        subscription: { select: { plan: true, status: true } },
      },
    });
  }

  private async getPaymentSummary() {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalReceived, monthReceived, pending, overdue] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'PAID', paid_at: { gte: thisMonth } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: { status: 'PENDING', due_date: { lt: now } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      total_received: totalReceived._sum.amount || 0,
      month_received: monthReceived._sum.amount || 0,
      pending_amount: pending._sum.amount || 0,
      pending_count: pending._count || 0,
      overdue_amount: overdue._sum.amount || 0,
      overdue_count: overdue._count || 0,
    };
  }

  private async getSubscriptionBreakdown() {
    const plans = await this.prisma.subscription.groupBy({
      by: ['plan'],
      _count: true,
    });

    return plans.map((p) => ({ plan: p.plan, count: p._count }));
  }
}
