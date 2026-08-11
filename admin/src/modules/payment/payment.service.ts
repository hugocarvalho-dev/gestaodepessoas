import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenant(tenantId: string, query: { page?: number; limit?: number; status?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: tenantId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(tenantId: string, data: {
    amount: number;
    payment_method?: string;
    description?: string;
    due_date?: string;
    reference?: string;
  }) {
    return this.prisma.payment.create({
      data: {
        tenant_id: tenantId,
        amount: data.amount,
        payment_method: data.payment_method,
        description: data.description,
        due_date: data.due_date ? new Date(data.due_date) : null,
        reference: data.reference,
        status: 'PENDING',
      },
    });
  }

  async markAsPaid(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'PAID', paid_at: new Date() },
    });
  }

  async cancel(paymentId: string) {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'CANCELLED' },
    });
  }

  // Resumo financeiro de todos os tenants
  async getSummary() {
    const [totalReceived, totalPending, totalOverdue] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'PENDING',
          due_date: { lt: new Date() },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      total_received: totalReceived._sum.amount || 0,
      total_pending: totalPending._sum.amount || 0,
      total_overdue: totalOverdue._sum.amount || 0,
      overdue_count: totalOverdue._count || 0,
    };
  }
}
