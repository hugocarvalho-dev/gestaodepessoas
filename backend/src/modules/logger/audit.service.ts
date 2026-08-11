import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface AuditLogPayload {
  companyId: string;
  tableName: string;
  recordId: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  dataBefore?: any;
  dataAfter?: any;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  private readonly routeToModelMap: Record<string, string> = {
    users: 'user',
    companies: 'company',
    employees: 'employee',
    departments: 'department',
    positions: 'position',
    contracts: 'contract',
    salaries: 'salary',
    documents: 'document',
    languages: 'language',
    skills: 'skill',
    educations: 'education',
    dashboard: 'dashboard',
    person: 'person',
    persons: 'person',
    'personal-contact': 'personal_contact',
    'emergency-contact': 'emergency_contact',
    'family-info': 'family_info',
    'work-experience': 'work_experience',
    'employee-department': 'employee_department',
    'employee-position': 'employee_position',
    'employee-language': 'employee_language',
    'employee-skill': 'employee_skill',
    'employee-departments': 'employee_department',
    'employee-positions': 'employee_position',
    'employee-languages': 'employee_language',
    'employee-skills': 'employee_skill',
    roles: 'role',
    permissions: 'permission',
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Registra uma ação de auditoria no banco de dados
   * Imutável e rastreável para compliance
   * Captura estado antes E depois (importante para UPDATE/DELETE)
   */
  async log(payload: AuditLogPayload): Promise<void> {
    try {
      const dataBeforeJson = payload.dataBefore 
        ? this.safeJsonParse(payload.dataBefore)
        : null;
      
      const dataAfterJson = payload.dataAfter 
        ? this.safeJsonParse(payload.dataAfter)
        : null;

      await this.prisma.audit_log.create({
        data: {
          company_id: payload.companyId,
          table_name: payload.tableName,
          record_id: payload.recordId,
          action: payload.action,
          data_before: dataBeforeJson,
          data_after: dataAfterJson,
          user_id: payload.userId,
          ip_address: payload.ipAddress,
          user_agent: payload.userAgent,
        },
      });

      this.logger.debug(
        `Audit log: ${payload.action} on ${payload.tableName} (${payload.recordId}) by user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`);
    }
  }

  /**
   * Recupera histórico de auditoria de um registro
   */
  async getHistory(
    tableName: string,
    recordId: string,
    companyId: string,
    limit: number = 50,
  ) {
    try {
      return await this.prisma.audit_log.findMany({
        where: {
          table_name: tableName,
          record_id: recordId,
          company_id: companyId,
        },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Failed to fetch audit history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Recupera auditoria por usuário (para relatórios de compliance)
   */
  async getByUser(userId: string, companyId: string, limit: number = 100) {
    try {
      return await this.prisma.audit_log.findMany({
        where: {
          user_id: userId,
          company_id: companyId,
        },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Failed to fetch audit by user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Recupera auditoria por data (para investigações)
   */
  async getByDateRange(
    companyId: string,
    startDate: Date,
    endDate: Date,
    tableName?: string,
  ) {
    try {
      return await this.prisma.audit_log.findMany({
        where: {
          company_id: companyId,
          created_at: {
            gte: startDate,
            lte: endDate,
          },
          ...(tableName && { table_name: tableName }),
        },
        orderBy: { created_at: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch audit by date range: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retorna mudanças específicas em um campo
   */
  async getFieldChanges(
    tableName: string,
    recordId: string,
    companyId: string,
    fieldName: string,
  ) {
    try {
      const history = await this.getHistory(tableName, recordId, companyId);
      
      return history.map(log => ({
        action: log.action,
        timestamp: log.created_at,
        user: log.user_id,
        before: log.data_before?.[fieldName],
        after: log.data_after?.[fieldName],
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch field changes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gera relatório de quem modificou o quê
   */
  async getAuditReport(
    companyId: string,
    startDate: Date,
    endDate: Date,
    action?: 'CREATE' | 'UPDATE' | 'DELETE',
  ) {
    try {
      const logs = await this.prisma.audit_log.findMany({
        where: {
          company_id: companyId,
          created_at: { gte: startDate, lte: endDate },
          ...(action && { action }),
        },
        orderBy: { created_at: 'desc' },
      });

      return {
        total: logs.length,
        byAction: {
          CREATE: logs.filter(l => l.action === 'CREATE').length,
          UPDATE: logs.filter(l => l.action === 'UPDATE').length,
          DELETE: logs.filter(l => l.action === 'DELETE').length,
        },
        byTable: logs.reduce((acc, log) => {
          acc[log.table_name] = (acc[log.table_name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byUser: logs.reduce((acc, log) => {
          acc[log.user_id || 'anonymous'] = (acc[log.user_id || 'anonymous'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        logs,
      };
    } catch (error) {
      this.logger.error(`Failed to generate audit report: ${error.message}`);
      throw error;
    }
  }

  resolveModelFromRoute(routeSegment: string): string | null {
    if (!routeSegment) return null;

    const normalized = routeSegment.toLowerCase();
    if (this.routeToModelMap[normalized]) {
      return this.routeToModelMap[normalized];
    }

    if (normalized.endsWith('s')) {
      const singular = normalized.slice(0, -1);
      if (this.routeToModelMap[singular]) {
        return this.routeToModelMap[singular];
      }
      return singular;
    }

    return normalized;
  }

  async getRecordSnapshot(
    routeSegment: string,
    recordId: string,
    companyId?: string,
  ): Promise<any | null> {
    try {
      const model = this.resolveModelFromRoute(routeSegment);
      if (!model) return null;

      const delegate = (this.prisma as any)[model];
      if (!delegate || typeof delegate.findUnique !== 'function') {
        return null;
      }

      const where: Record<string, any> = { id: recordId };
      if (companyId && ['company', 'employee', 'department', 'position'].includes(model)) {
        if (model === 'company') {
          where.id = recordId;
        } else {
          where.company_id = companyId;
        }
      }

      return await delegate.findUnique({ where });
    } catch {
      return null;
    }
  }

  private safeJsonParse(obj: any): any {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj;
    }
  }
}

