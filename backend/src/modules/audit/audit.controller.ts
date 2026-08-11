import { Controller, Get, Query, Res, UseGuards, Request, BadRequestException, Param } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuditService } from '@/modules/logger/audit.service';
import { ExportService } from '@/common/services/export.service';

@ApiTags('Audit & Reports')
@Controller('audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(
    private auditService: AuditService,
    private exportService: ExportService,
  ) {}

  /**
   * Retorna histórico de auditoria de um registro
   */
  @Get('history/:table/:recordId')
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getHistory(
    @Param('table') table: string,
    @Param('recordId') recordId: string,
    @Query('limit') limit: number = 50,
    @Request() req,
  ) {
    const companyId = req.headers['x-company-id'];

    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }

    return this.auditService.getHistory(table, recordId, companyId, limit);
  }

  /**
   * Retorna auditoria por usuário
   */
  @Get('user/:userId')
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getByUser(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 100,
    @Request() req,
  ) {
    const companyId = req.headers['x-company-id'];

    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }

    return this.auditService.getByUser(userId, companyId, limit);
  }

  /**
   * Retorna relatório de auditoria (período específico)
   */
  @Get('report')
  @ApiQuery({ name: 'startDate', type: String, required: true })
  @ApiQuery({ name: 'endDate', type: String, required: true })
  @ApiQuery({ name: 'action', type: String, required: false })
  async getReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('action') action: 'CREATE' | 'UPDATE' | 'DELETE' = undefined,
    @Request() req,
  ) {
    const companyId = req.headers['x-company-id'];

    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }

    try {
      return await this.auditService.getAuditReport(
        companyId,
        new Date(startDate),
        new Date(endDate),
        action,
      );
    } catch (error) {
      throw new BadRequestException('Invalid date format. Use ISO format (YYYY-MM-DD)');
    }
  }

  /**
   * Exporta relatório de auditoria como CSV
   */
  @Get('export/csv')
  @ApiQuery({ name: 'startDate', type: String, required: true })
  @ApiQuery({ name: 'endDate', type: String, required: true })
  async exportAuditCSV(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const companyId = req.headers['x-company-id'];

    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }

    try {
      const report = await this.auditService.getAuditReport(
        companyId,
        new Date(startDate),
        new Date(endDate),
      );

      const csv = this.exportService.exportToCSV(
        report.logs.map(log => ({
          table: log.table_name,
          recordId: log.record_id,
          action: log.action,
          user: log.user_id,
          timestamp: log.created_at,
          ipAddress: log.ip_address,
        })),
        'audit-report.csv',
      );

      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="audit-report.csv"',
      });

      res.send(csv);
    } catch (error) {
      throw new BadRequestException('Invalid date format');
    }
  }

  /**
   * Exporta relatório de auditoria como JSON
   */
  @Get('export/json')
  @ApiQuery({ name: 'startDate', type: String, required: true })
  @ApiQuery({ name: 'endDate', type: String, required: true })
  async exportAuditJSON(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const companyId = req.headers['x-company-id'];

    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }

    try {
      const report = await this.auditService.getAuditReport(
        companyId,
        new Date(startDate),
        new Date(endDate),
      );

      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="audit-report.json"',
      });

      res.json(report);
    } catch (error) {
      throw new BadRequestException('Invalid date format');
    }
  }

  /**
   * Retorna mudanças de um campo específico
   */
  @Get('field-changes/:table/:recordId/:field')
  async getFieldChanges(
    @Param('table') table: string,
    @Param('recordId') recordId: string,
    @Param('field') field: string,
    @Request() req,
  ) {
    const companyId = req.headers['x-company-id'];

    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }

    return this.auditService.getFieldChanges(table, recordId, companyId, field);
  }
}

