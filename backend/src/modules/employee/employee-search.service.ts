import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { searchText, CursorPaginatedResponse, encodeCursor, decodeCursor } from '@/common/decorators/optimization.decorators';

@Injectable()
export class EmployeeSearchService {
  private readonly logger = new Logger(EmployeeSearchService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Full-text search para funcionários
   * Pesquisa em: nome, número de funcionário, email, etc
   */
  async searchEmployees(
    companyId: string,
    query: string,
    limit: number = 20,
  ) {
    try {
      // Busca simples com ILIKE (PostgreSQL)
      const employees = await this.prisma.employee.findMany({
        where: {
          company_id: companyId,
          OR: [
            {
              person: {
                legal_name: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            },
            {
              person: {
                preferred_name: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            },
            {
              employee_number: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          employee_number: true,
          status: true,
          person: {
            select: {
              legal_name: true,
              preferred_name: true,
            },
          },
        },
        take: limit,
      });

      return employees;
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Paginação cursor-based para melhor performance
   * Ideal para listagens grandes
   */
  async findWithCursor(
    companyId: string,
    limit: number = 20,
    cursor?: string,
    orderBy: 'created_at' | 'legal_name' = 'created_at',
  ): Promise<CursorPaginatedResponse<any>> {
    try {
      const decodedCursor = decodeCursor(cursor);
      
      const employees = await this.prisma.employee.findMany({
        where: { company_id: companyId },
        select: {
          id: true,
          employee_number: true,
          status: true,
          person: {
            select: {
              legal_name: true,
              preferred_name: true,
            },
          },
          created_at: true,
        },
        orderBy: { [orderBy]: 'asc' },
        ...(decodedCursor && {
          skip: 1,
          cursor: { id: decodedCursor.id },
        }),
        take: limit + 1, // +1 para verificar se há próxima página
      });

      const hasNext = employees.length > limit;
      const data = employees.slice(0, limit);
      const nextCursor = hasNext && data.length > 0
        ? encodeCursor(data[data.length - 1].id, data[data.length - 1][orderBy])
        : null;

      return {
        data,
        nextCursor,
        hasBefore: !!decodedCursor,
        hasNext,
      };
    } catch (error) {
      this.logger.error(`Cursor pagination failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca com filtros avançados
   */
  async searchAdvanced(
    companyId: string,
    filters: {
      query?: string;
      status?: string;
      departmentId?: string;
      positionId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    try {
      const { query, status, departmentId, positionId, limit = 20, offset = 0 } = filters;

      const [data, total] = await Promise.all([
        this.prisma.employee.findMany({
          where: {
            company_id: companyId,
            ...(query && {
              OR: [
                { person: { legal_name: { contains: query, mode: 'insensitive' } } },
                { person: { preferred_name: { contains: query, mode: 'insensitive' } } },
                { employee_number: { contains: query, mode: 'insensitive' } },
              ],
            }),
            ...(status && { status }),
            ...(departmentId && {
              employee_department: {
                some: {
                  department_id: departmentId,
                  end_date: null,
                },
              },
            }),
            ...(positionId && {
              employee_position: {
                some: {
                  position_id: positionId,
                  end_date: null,
                },
              },
            }),
          },
          select: {
            id: true,
            employee_number: true,
            status: true,
            hire_date: true,
            person: {
              select: {
                legal_name: true,
                preferred_name: true,
              },
            },
            employee_department: {
              where: { end_date: null },
              select: { department: { select: { name: true } } },
            },
          },
          skip: offset,
          take: limit,
          orderBy: { person: { legal_name: 'asc' } },
        }),
        this.prisma.employee.count({
          where: {
            company_id: companyId,
            ...(query && {
              OR: [
                { person: { legal_name: { contains: query, mode: 'insensitive' } } },
                { person: { preferred_name: { contains: query, mode: 'insensitive' } } },
                { employee_number: { contains: query, mode: 'insensitive' } },
              ],
            }),
            ...(status && { status }),
          },
        }),
      ]);

      return {
        data,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    } catch (error) {
      this.logger.error(`Advanced search failed: ${error.message}`);
      throw error;
    }
  }
}
