export default () => ({
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  company: {
    defaultId: process.env.DEFAULT_COMPANY_ID,
  },

  // Multi-Tenancy
  // MASTER_DATABASE_URL: se definido, habilita modo multi-tenant
  // Se ausente, o sistema roda em single-tenant (compatível com a instalação atual)
  MASTER_DATABASE_URL: process.env.MASTER_DATABASE_URL || '',
  TENANT_DB_HOST: process.env.TENANT_DB_HOST || 'localhost',
  TENANT_DB_PORT: parseInt(process.env.TENANT_DB_PORT, 10) || 5432,
  TENANT_DB_USER: process.env.TENANT_DB_USER || 'postgres',
  TENANT_DB_PASSWORD: process.env.TENANT_DB_PASSWORD || 'postgres',
  BASE_DOMAIN: process.env.BASE_DOMAIN || '', // ex: 'seudominio.com'
});