import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<{ resource: string; action: string }[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredPermissions) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }
    
    // Pegar empresa da requisição (pode vir do header, body, ou param)
    const companyId = request.headers['x-company-id'] || request.body.companyId || request.params.companyId;
    
    if (!companyId) {
      throw new ForbiddenException('Empresa não especificada');
    }
    
    // Verificar se usuário tem acesso à empresa
    const userCompany = await this.prisma.user_company.findFirst({
      where: {
        userId: user.id,
        companyId: companyId,
        isActive: true,
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    if (!userCompany) {
      throw new ForbiddenException('Usuário não tem acesso a esta empresa');
    }
    
    // Coletar todas permissões do usuário para esta empresa
    const userPermissions = userCompany.userRoles.flatMap(ur => 
      ur.role.permissions.map(rp => ({
        resource: rp.permission.resourceId,
        action: rp.permission.actionId,
      }))
    );
    
    // Verificar se possui TODAS as permissões necessárias
    const hasPermission = requiredPermissions.every(required => 
      userPermissions.some(up => 
        up.resource === required.resource && up.action === required.action
      )
    );
    
    if (!hasPermission) {
      throw new ForbiddenException('Permissão negada');
    }
    
    // Adicionar companyId ao request para uso posterior
    request.companyId = companyId;
    
    return true;
  }
}