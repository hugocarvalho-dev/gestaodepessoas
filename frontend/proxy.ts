import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas (não requerem autenticação)
const publicRoutes = ['/login'];

// Rotas protegidas (requerem autenticação)
const protectedRoutes = [
  '/dashboard',
  '/colaboradores',
  '/departamentos',
  '/cargos',
  '/contratos',
  '/usuarios',
  '/onboarding',
  '/relatorios',
  '/settings',
  '/perfil',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Se for rota protegida, verificar autenticação
  if (isProtectedRoute) {
    // Nota: Cookies/Headers são a forma correta de verificar auth no middleware
    // localStorage não está disponível no middleware (server-side)
    
    // Exemplo com cookie (se você usar cookies para o token):
    // const token = request.cookies.get('auth_token');
    // if (!token) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }

    // Por enquanto, apenas continue (a verificação real será no client-side)
    return NextResponse.next();
  }

  // Se estiver logado e tentar acessar login, redirecionar para dashboard
  if (isPublicRoute && pathname === '/login') {
    // Mesma observação: verificar cookie ao invés de localStorage
    // const token = request.cookies.get('auth_token');
    // if (token) {
    //   return NextResponse.redirect(new URL('/dashboard', request.url));
    // }
  }

  return NextResponse.next();
}

// Configurar quais rotas o middleware deve processar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
