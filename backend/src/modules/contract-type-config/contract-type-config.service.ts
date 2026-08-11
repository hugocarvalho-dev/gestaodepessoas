import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateContractTypeConfigDto, UpdateContractTypeConfigDto } from './dto/contract-type-config.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class ContractTypeConfigService {
  private readonly logger = new Logger(ContractTypeConfigService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    const data = await this.prisma.contract_type_config.findMany({
      where: { company_id: companyId },
      orderBy: { label: 'asc' },
    });
    return PaginatedResponse.fromArray(data);
  }

  async findOne(id: string, companyId: string) {
    const item = await this.prisma.contract_type_config.findUnique({ where: { id } });
    if (!item || item.company_id !== companyId) {
      throw new NotFoundException(`Contract type config with ID ${id} not found`);
    }
    return item;
  }

  async create(data: CreateContractTypeConfigDto, companyId: string) {
    const value = data.value.trim().toUpperCase().replace(/\s+/g, '_');
    return this.prisma.contract_type_config.create({
      data: {
        company_id: companyId,
        value,
        label: data.label.trim(),
        description: data.description?.trim() || null,
        is_system: data.is_system ?? false,
      },
    });
  }

  async update(id: string, data: UpdateContractTypeConfigDto, companyId: string) {
    const existing = await this.prisma.contract_type_config.findUnique({ where: { id } });
    if (!existing || existing.company_id !== companyId) {
      throw new NotFoundException(`Contract type config with ID ${id} not found`);
    }
    if (existing.is_system) {
      throw new BadRequestException('Tipos de sistema não podem ser editados');
    }
    return this.prisma.contract_type_config.update({
      where: { id },
      data: {
        ...(data.value && { value: data.value.trim().toUpperCase().replace(/\s+/g, '_') }),
        ...(data.label && { label: data.label.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
      },
    });
  }

  async remove(id: string, companyId: string) {
    const existing = await this.prisma.contract_type_config.findUnique({ where: { id } });
    if (!existing || existing.company_id !== companyId) {
      throw new NotFoundException(`Contract type config with ID ${id} not found`);
    }
    if (existing.is_system) {
      throw new BadRequestException('Tipos de sistema não podem ser excluídos');
    }
    await this.prisma.contract_type_config.delete({ where: { id } });
    return { message: 'Contract type config deleted successfully' };
  }
}
