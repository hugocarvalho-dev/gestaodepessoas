import { SetMetadata } from '@nestjs/common';

export const Permissions = (permissions: { resource: string; action: string }[]) => 
  SetMetadata('permissions', permissions);