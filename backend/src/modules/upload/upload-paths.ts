import { existsSync, mkdirSync } from 'fs';
import { basename, join } from 'path';

export type UploadType = 'profile' | 'document' | 'temp';
export type UploadFolder = 'profiles' | 'documents' | 'temp';

const uploadTypeToFolder: Record<UploadType, UploadFolder> = {
  profile: 'profiles',
  document: 'documents',
  temp: 'temp',
};

export const uploadFolders: UploadFolder[] = ['profiles', 'documents', 'temp'];

export function getUploadRoot(): string {
  return process.env.UPLOAD_DIR || join(process.cwd(), 'storage', 'uploads');
}

export function ensureUploadDirs(): void {
  for (const folder of uploadFolders) {
    const path = join(getUploadRoot(), folder);
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }
  }
}

export function getUploadPath(type: UploadType): string;
export function getUploadPath(type: UploadFolder): string;
export function getUploadPath(type: UploadType | UploadFolder): string {
  const folder = type in uploadTypeToFolder ? uploadTypeToFolder[type as UploadType] : type;
  return join(getUploadRoot(), folder);
}

export function isUploadFolder(value: string): value is UploadFolder {
  return uploadFolders.includes(value as UploadFolder);
}

export function sanitizeUploadFileName(originalName: string): string {
  const safeName = basename(originalName).replace(/[^a-zA-Z0-9._ -]/g, '_');
  return `${Date.now()}-${safeName}`;
}

export function sanitizeStoredFileName(fileName: string): string {
  return basename(fileName).replace(/[^a-zA-Z0-9._ -]/g, '_');
}
