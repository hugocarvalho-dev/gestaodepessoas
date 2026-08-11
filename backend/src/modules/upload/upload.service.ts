import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ensureUploadDirs, getUploadPath, UploadType } from './upload-paths';

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {
    ensureUploadDirs();
  }

  getUploadPath(type: UploadType): string {
    return getUploadPath(type);
  }

  generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = originalName.split('.').pop();
    return `${timestamp}-${random}.${ext}`;
  }

  async saveDocument(employeeId: string, file: Express.Multer.File, type: string) {
    return this.prisma.document.create({
      data: {
        employee_id: employeeId,
        document_type: type,
        file_url: `/uploads/documents/${file.filename}`,
        file_name: file.originalname,
        file_size_bytes: file.size,
        mime_type: file.mimetype
      }
    });
  }

  async updateProfilePhoto(employeeId: string, file: Express.Multer.File) {
    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { 
        profilePhoto: `/uploads/profiles/${file.filename}`
      }
    });
  }
}
