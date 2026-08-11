import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/document.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, companyId: string) {
    try {
      const [data, total] = await Promise.all([
        this.prisma.document.findMany({
          where: { employee: { company_id: companyId } },
          skip: pagination.skip,
          take: pagination.take,
          include: { employee: { include: { person: true } } },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.document.count({ where: { employee: { company_id: companyId } } }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching documents: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, companyId: string) {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id },
        include: { employee: true },
      });

      if (!document) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      if (document.employee.company_id !== companyId) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      return document;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error fetching document ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateDocumentDto, companyId: string) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: data.employee_id },
        select: { company_id: true },
      });

      if (!employee || employee.company_id !== companyId) {
        throw new NotFoundException('Employee not found in this company');
      }

      const document = await this.prisma.document.create({
        data: {
          employee_id: data.employee_id,
          document_type: data.document_type,
          file_url: data.file_url,
          file_name: data.file_name,
          file_size_bytes: data.file_size_bytes,
          mime_type: data.mime_type,
          description: data.description,
          uploaded_by_user_id: data.uploaded_by_user_id,
        },
        include: { employee: true },
      });

      this.logger.log(`Document created: ${document.id}`);
      return document;
    } catch (error) {
      this.logger.error(`Error creating document: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: UpdateDocumentDto, companyId: string) {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id },
        include: { employee: true },
      });

      if (!document || document.employee.company_id !== companyId) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      const updatedDoc = await this.prisma.document.update({
        where: { id },
        data: {
          ...(data.document_type && { document_type: data.document_type }),
          ...(data.file_url !== undefined && { file_url: data.file_url }),
          ...(data.file_name !== undefined && { file_name: data.file_name }),
          ...(data.file_size_bytes !== undefined && { file_size_bytes: data.file_size_bytes }),
          ...(data.mime_type !== undefined && { mime_type: data.mime_type }),
          ...(data.description !== undefined && { description: data.description }),
        },
        include: { employee: true },
      });

      this.logger.log(`Document updated: ${id}`);
      return document;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }
      this.logger.error(`Error updating document ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, companyId: string) {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id },
        include: { employee: true },
      });

      if (!document || document.employee.company_id !== companyId) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      await this.prisma.document.delete({
        where: { id },
      });

      this.logger.log(`Document deleted: ${id}`);
      return { message: 'Document deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }
      this.logger.error(`Error deleting document ${id}: ${error.message}`);
      throw error;
    }
  }

  async getDocumentsByEmployee(employeeId: string, pagination: PaginationDto, companyId: string) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        select: { company_id: true },
      });

      if (!employee || employee.company_id !== companyId) {
        throw new NotFoundException('Employee not found in this company');
      }

      const [documents, total] = await Promise.all([
        this.prisma.document.findMany({
          where: { employee_id: employeeId },
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.document.count({ where: { employee_id: employeeId } }),
      ]);

      return new PaginatedResponse(documents, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching employee documents: ${error.message}`);
      throw error;
    }
  }
}
