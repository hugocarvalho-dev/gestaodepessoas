import { 
  Controller, Post, UseInterceptors, UploadedFile, 
  UploadedFiles, UseGuards, Get, Param, Res, BadRequestException, NotFoundException
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';
import type { Response } from 'express';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import {
  ensureUploadDirs,
  getUploadPath,
  isUploadFolder,
  sanitizeStoredFileName,
  sanitizeUploadFileName,
} from './upload-paths';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        ensureUploadDirs();
        cb(null, getUploadPath('profiles'));
      },
      filename: (req, file, cb) => {
        cb(null, sanitizeUploadFileName(file.originalname));
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        cb(new Error('Apenas imagens são permitidas!'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' }
      }
    }
  })
  uploadProfile(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      originalname: file.originalname,
      path: `/uploads/profiles/${file.filename}`,
      size: file.size
    };
  }

  @Post('document')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({
      destination: (req, file, cb) => {
        ensureUploadDirs();
        cb(null, getUploadPath('documents'));
      },
      filename: (req, file, cb) => {
        cb(null, sanitizeUploadFileName(file.originalname));
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' }
        }
      }
    }
  })
  uploadDocuments(@UploadedFiles() files: Express.Multer.File[]) {
    return files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: `/uploads/documents/${file.filename}`,
      size: file.size
    }));
  }

  @Get(':type/:filename')
  async getFile(
    @Param('type') type: string,
    @Param('filename') filename: string,
    @Res() res: Response
  ) {
    if (!isUploadFolder(type)) {
      throw new BadRequestException('Tipo de upload inválido');
    }

    const filePath = join(getUploadPath(type), sanitizeStoredFileName(filename));
    if (!existsSync(filePath)) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    const file = createReadStream(filePath);
    file.pipe(res);
  }
}
