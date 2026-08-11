/**
 * Tenant Detection — Frontend
 * 
 * Detecta o tenant (cliente SaaS) de acordo com o ambiente:
 * - PRODUÇÃO: Extrai slug do subdomínio (acme.seudominio.com → acme)
 * - DESENVOLVIMENTO: Lê de ?tenant=, localStorage, ou .env
 * 
 * O slug é enviado em TODAS requisições via header `x-tenant-slug`.
 */

const TENANT_STORAGE_KEY = 'tenant_slug';

/**
 * Detecta o slug do tenant automaticamente.
 */
export function detectTenantSlug(): string | null {
  // 1. Variável de ambiente fixa (dev)
  const envTenant = process.env.NEXT_PUBLIC_TENANT_SLUG;
  if (envTenant) return envTenant;

  if (typeof window === 'undefined') return null; // SSR

  // 2. Query string: ?tenant=acme
  const urlParams = new URLSearchParams(window.location.search);
  const queryTenant = urlParams.get('tenant');
  if (queryTenant) {
    // Salvar para persistir entre navegações
    localStorage.setItem(TENANT_STORAGE_KEY, queryTenant.toLowerCase());
    return queryTenant.toLowerCase();
  }

  // 3. Subdomínio (produção): acme.seudominio.com → acme
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || '';
  const hostname = window.location.hostname;

  if (baseDomain && hostname.endsWith(baseDomain)) {
    const subdomain = hostname.replace(`.${baseDomain}`, '');
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      return subdomain.toLowerCase();
    }
  }

  // 4. Subdomínio genérico: acme.localhost → acme
  const parts = hostname.split('.');
  if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'app') {
    if (!/^\d+$/.test(parts[0])) {
      return parts[0].toLowerCase();
    }
  }

  // 5. localStorage (persistência do ?tenant= anterior)
  const stored = localStorage.getItem(TENANT_STORAGE_KEY);
  if (stored) return stored;

  return null;
}

/**
 * Retorna o slug do tenant atual.
 * Memoizado após a primeira detecção.
 */
let cachedSlug: string | null | undefined = undefined;

export function getTenantSlug(): string | null {
  if (cachedSlug !== undefined) return cachedSlug;
  cachedSlug = detectTenantSlug();
  return cachedSlug;
}

/**
 * Define manualmente o tenant (útil em dev/admin).
 */
export function setTenantSlug(slug: string) {
  cachedSlug = slug;
  if (typeof window !== 'undefined') {
    localStorage.setItem(TENANT_STORAGE_KEY, slug);
  }
}

/**
 * Limpa o tenant.
 */
export function clearTenantSlug() {
  cachedSlug = undefined;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TENANT_STORAGE_KEY);
  }
}

/**
 * Retorna os headers HTTP necessários para o tenant.
 * Adicionar em TODAS as requisições para a API.
 */
export function getTenantHeaders(): Record<string, string> {
  const slug = getTenantSlug();
  if (!slug) return {};
  return { 'x-tenant-slug': slug };
}
