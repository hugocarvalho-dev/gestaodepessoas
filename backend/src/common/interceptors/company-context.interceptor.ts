import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class CompanyContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Extrair companyId do header x-company-id
    const companyId = request.headers['x-company-id'] || request.body?.companyId || request.query?.companyId;
    
    // Se há usuário autenticado, validar companyId contra empresas acessíveis
    if (request.user && companyId) {
      const hasAccess = request.user.userCompanies?.some(uc => uc.companyId === companyId && uc.isActive);
      
      if (!hasAccess) {
        throw new BadRequestException('Usuário não tem acesso a esta empresa');
      }
      
      // Adicionar companyId ao request para uso posterior
      request.companyId = companyId;
    }
    
    return next.handle();
  }
}
