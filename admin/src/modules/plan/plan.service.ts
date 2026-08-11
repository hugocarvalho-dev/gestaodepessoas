import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@Injectable()
export class PlanService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: { active_only?: boolean }) {
    const where: any = {};
    if (params?.active_only) {
      where.is_active = true;
    }

    return this.prisma.plan.findMany({
      where,
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return plan;
  }

  async create(dto: CreatePlanDto) {
    const existing = await this.prisma.plan.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Já existe um plano com este nome');

    return this.prisma.plan.create({
      data: {
        name: dto.name,
        description: dto.description,
        max_employees: dto.max_employees,
        max_users: dto.max_users,
        max_companies: dto.max_companies ?? 1,
        price_monthly: dto.price_monthly,
        price_yearly: dto.price_yearly ?? 0,
        is_trial: dto.is_trial ?? false,
        trial_days: dto.trial_days ?? 0,
        features: dto.features ?? null,
        is_active: dto.is_active ?? true,
        sort_order: dto.sort_order ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plano não encontrado');

    if (dto.name && dto.name !== plan.name) {
      const existing = await this.prisma.plan.findUnique({ where: { name: dto.name } });
      if (existing) throw new ConflictException('Já existe um plano com este nome');
    }

    return this.prisma.plan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.max_employees !== undefined && { max_employees: dto.max_employees }),
        ...(dto.max_users !== undefined && { max_users: dto.max_users }),
        ...(dto.max_companies !== undefined && { max_companies: dto.max_companies }),
        ...(dto.price_monthly !== undefined && { price_monthly: dto.price_monthly }),
        ...(dto.price_yearly !== undefined && { price_yearly: dto.price_yearly }),
        ...(dto.is_trial !== undefined && { is_trial: dto.is_trial }),
        ...(dto.trial_days !== undefined && { trial_days: dto.trial_days }),
        ...(dto.features !== undefined && { features: dto.features }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
        ...(dto.sort_order !== undefined && { sort_order: dto.sort_order }),
      },
    });
  }

  async remove(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plano não encontrado');

    await this.prisma.plan.delete({ where: { id } });
    return { message: 'Plano removido com sucesso' };
  }
}
