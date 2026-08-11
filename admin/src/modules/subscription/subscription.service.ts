import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenant(tenantId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { tenant_id: tenantId },
      include: { tenant: { select: { id: true, name: true, slug: true } } },
    });
    if (!sub) throw new NotFoundException('Assinatura não encontrada');
    return sub;
  }

  async update(tenantId: string, data: {
    plan?: string;
    price_monthly?: number;
    billing_cycle?: string;
    status?: string;
  }) {
    const sub = await this.prisma.subscription.findUnique({ where: { tenant_id: tenantId } });
    if (!sub) throw new NotFoundException('Assinatura não encontrada');

    return this.prisma.subscription.update({
      where: { tenant_id: tenantId },
      data: {
        plan: data.plan as any,
        price_monthly: data.price_monthly ?? sub.price_monthly,
        billing_cycle: data.billing_cycle as any ?? sub.billing_cycle,
        status: data.status as any ?? sub.status,
      },
    });
  }

  async cancel(tenantId: string) {
    return this.prisma.subscription.update({
      where: { tenant_id: tenantId },
      data: { status: 'CANCELLED', cancelled_at: new Date() },
    });
  }
}
