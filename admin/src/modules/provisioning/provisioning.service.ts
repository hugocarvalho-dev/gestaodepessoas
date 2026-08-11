import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as bcrypt from 'bcryptjs';

/**
 * ProvisioningService
 * 
 * Responsável por:
 * 1. Criar o banco de dados PostgreSQL do tenant
 * 2. Rodar as migrations do Prisma no banco criado
 * 3. Criar empresa e usuário admin inicial no banco do tenant
 * 
 * O schema Prisma usado para os tenants é o mesmo do backend principal:
 * ../backend/prisma/schema.prisma
 */
@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(private readonly config: ConfigService) {}

  /** Retorna as credenciais padrão do tenant DB */
  private getDbConfig() {
    return {
      host: this.config.get('TENANT_DB_HOST', 'localhost'),
      port: this.config.get<number>('TENANT_DB_PORT', 5432),
      user: this.config.get('TENANT_DB_USER', 'postgres'),
      password: this.config.get('TENANT_DB_PASSWORD', 'postgres'),
    };
  }

  /** Retorna o diretório do backend (onde está o schema.prisma) */
  private getBackendDir(): string {
    // Tentar múltiplos caminhos para encontrar o diretório do backend
    const candidates = [
      path.resolve(process.cwd(), '..', 'backend'),          // Se cwd = admin/
      path.resolve(process.cwd(), 'backend'),                 // Se cwd = project root
      path.resolve(__dirname, '..', '..', '..', '..', 'backend'), // Relativo ao dist
    ];

    for (const candidate of candidates) {
      const schemaPath = path.join(candidate, 'prisma', 'schema.prisma');
      if (fs.existsSync(schemaPath)) {
        this.logger.log(`📂 Backend encontrado em: ${candidate}`);
        return candidate;
      }
    }

    throw new InternalServerErrorException(
      `Não foi possível encontrar o diretório do backend. Candidatos testados: ${candidates.join(', ')}`,
    );
  }

  /**
   * Cria um novo banco PostgreSQL e roda migrations.
   * NÃO cria dados iniciais — empresas e usuários são adicionados separadamente.
   */
  async provisionTenantDatabase(
    databaseName: string,
  ): Promise<void> {
    this.logger.log(`🔧 Provisionando banco: ${databaseName}`);

    const { host, port, user, password } = this.getDbConfig();

    // 1. Criar o banco de dados PostgreSQL
    const adminPool = new Pool({
      host,
      port,
      user,
      password,
      database: 'postgres',
    });

    try {
      const result = await adminPool.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [databaseName],
      );

      if (result.rows.length === 0) {
        const safeName = databaseName.replace(/[^a-z0-9_]/g, '');
        await adminPool.query(`CREATE DATABASE "${safeName}" OWNER "${user}"`);
        this.logger.log(`✅ Banco "${safeName}" criado com sucesso`);
      } else {
        this.logger.warn(`⚠️ Banco "${databaseName}" já existe — pulando criação`);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao criar banco: ${error.message}`);
      throw new InternalServerErrorException(`Falha ao criar banco do tenant: ${error.message}`);
    } finally {
      await adminPool.end();
    }

    // 2. Instalar função uuidv7 e rodar migrations
    const tenantDbUrl = `postgresql://${user}:${password}@${host}:${port}/${databaseName}`;
    await this.installUuidV7Function(tenantDbUrl, databaseName);
    await this.runMigrations(tenantDbUrl, databaseName);
  }

  /**
   * Instala a função uuidv7() no banco do tenant (necessária pelas migrations).
   */
  private async installUuidV7Function(tenantDbUrl: string, databaseName: string): Promise<void> {
    const pool = new Pool({ connectionString: tenantDbUrl });
    try {
      this.logger.log(`🔑 Instalando função uuidv7() em ${databaseName}`);
      await pool.query(`
        CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid AS $$
        DECLARE
          unix_ts_ms BYTEA;
          uuid_bytes BYTEA;
        BEGIN
          unix_ts_ms = substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3);
          uuid_bytes = unix_ts_ms || gen_random_bytes(10);
          uuid_bytes = set_byte(uuid_bytes, 6, (b'0111' || get_byte(uuid_bytes, 6)::bit(4))::bit(8)::int);
          uuid_bytes = set_byte(uuid_bytes, 8, (b'10' || get_byte(uuid_bytes, 8)::bit(6))::bit(8)::int);
          RETURN encode(uuid_bytes, 'hex')::uuid;
        END
        $$ LANGUAGE plpgsql VOLATILE;
      `);
      this.logger.log(`✅ Função uuidv7() instalada em ${databaseName}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao instalar uuidv7(): ${error.message}`);
      throw new InternalServerErrorException(`Falha ao instalar uuidv7: ${error.message}`);
    } finally {
      await pool.end();
    }
  }

  /**
   * Roda as migrations do Prisma no banco do tenant.
   */
  private async runMigrations(tenantDbUrl: string, databaseName: string): Promise<void> {
    try {
      const backendDir = this.getBackendDir();
      this.logger.log(`📦 Rodando migrations no banco: ${databaseName}`);

      // Detectar o comando npx correto para o SO
      const isWindows = process.platform === 'win32';
      const npxCommand = isWindows ? 'npx.cmd' : 'npx';

      const output = execSync(`${npxCommand} prisma migrate deploy`, {
        cwd: backendDir,
        env: {
          ...process.env,
          DATABASE_URL: tenantDbUrl,
        },
        shell: isWindows ? process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe' : '/bin/sh',
        stdio: 'pipe',
        timeout: 120000,
      });

      this.logger.log(`✅ Migrations aplicadas com sucesso em ${databaseName}`);
      this.logger.debug(`Migration output: ${output?.toString()}`);
    } catch (error) {
      const stderr = error.stderr?.toString() || '';
      const stdout = error.stdout?.toString() || '';
      this.logger.error(`❌ Erro ao rodar migrations: ${error.message}`);
      if (stderr) this.logger.error(`stderr: ${stderr}`);
      if (stdout) this.logger.error(`stdout: ${stdout}`);
      throw new InternalServerErrorException(
        `Falha ao aplicar migrations no banco ${databaseName}: ${error.message}`,
      );
    }
  }

  /**
   * Adiciona uma empresa ao banco do tenant e cria/atualiza o usuário admin.
   * - Se é a primeira empresa: cria company + user admin + resources + actions + role Admin + permissões
   * - Se já existe admin: cria company + vincula admin à nova empresa + cria role Admin para ela
   */
  async addCompanyToTenant(
    databaseName: string,
    companyInfo: {
      name: string;
      document?: string;
      phone?: string;
      address?: string;
      address_number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
      is_headquarters?: boolean;
    },
    adminEmail: string,
  ): Promise<{ companyId: string; userId: string; isNewUser: boolean }> {
    this.logger.log(`🏢 Adicionando empresa "${companyInfo.name}" ao tenant ${databaseName}`);

    const tenantDbUrl = this.getTenantConnectionUrl(databaseName);
    const tenantPool = new Pool({ connectionString: tenantDbUrl });
    let transactionStarted = false;

    try {
      await tenantPool.query('BEGIN');
      transactionStarted = true;

      // 1. Criar empresa
      const companyResult = await tenantPool.query(
        `INSERT INTO company (id, name, document, phone, address, address_number, complement, neighborhood, city, state, postal_code, country, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE', NOW(), NOW())
         RETURNING id`,
        [
          companyInfo.name,
          companyInfo.document || null,
          companyInfo.phone || null,
          companyInfo.address || null,
          companyInfo.address_number || null,
          companyInfo.complement || null,
          companyInfo.neighborhood || null,
          companyInfo.city || null,
          companyInfo.state || null,
          companyInfo.postal_code || null,
          companyInfo.country || 'BR',
        ],
      );
      const companyId = companyResult.rows[0].id;
      this.logger.log(`✅ Empresa "${companyInfo.name}" criada (${companyId})`);

      // 2. Garantir que resources e actions existam (idempotente)
      await this.ensureResourcesAndActions(tenantPool);

      // 3. Verificar se já existe um usuário admin
      const existingUser = await tenantPool.query(
        `SELECT id FROM users WHERE email = $1 LIMIT 1`,
        [adminEmail],
      );

      let userId: string;
      let isNewUser = false;

      if (existingUser.rows.length > 0) {
        // Usuário admin já existe — apenas vincular à nova empresa
        userId = existingUser.rows[0].id;
        this.logger.log(`👤 Usuário admin existente encontrado: ${userId}`);
      } else {
        // Criar novo usuário admin (senha padrão: MudarSenha@123)
        const defaultPassword = await bcrypt.hash('MudarSenha@123', 10);
        const userResult = await tenantPool.query(
          `INSERT INTO users (id, email, password, "firstName", "lastName", status, "isActive", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, 'Admin', 'Sistema', 'ACTIVE', true, NOW(), NOW())
           RETURNING id`,
          [adminEmail, defaultPassword],
        );
        userId = userResult.rows[0].id;
        isNewUser = true;
        this.logger.log(`✅ Usuário admin criado: ${adminEmail}`);
      }

      // 4. Vincular usuário à empresa (user_companies)
      const userCompanyResult = await tenantPool.query(
        `INSERT INTO user_companies (id, "userId", "companyId", "isActive", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW())
         ON CONFLICT ("userId", "companyId") DO UPDATE SET "isActive" = true
         RETURNING id`,
        [userId, companyId],
      );
      const userCompanyId = userCompanyResult.rows[0].id;
      this.logger.log(`✅ Usuário vinculado à empresa`);

      // 5. Criar role Admin para esta empresa
      const roleResult = await tenantPool.query(
        `INSERT INTO roles (id, name, description, "companyId", "isSystem", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), 'Admin', 'Administrador com acesso total', $1, true, NOW(), NOW())
         RETURNING id`,
        [companyId],
      );
      const roleId = roleResult.rows[0].id;

      // 6. Criar permissões completas para o role Admin desta empresa
      const resources = await tenantPool.query(`SELECT id FROM resources`);
      const actions = await tenantPool.query(`SELECT id FROM actions`);

      for (const resource of resources.rows) {
        for (const action of actions.rows) {
          const permResult = await tenantPool.query(
            `INSERT INTO permissions (id, "resourceId", "actionId", "createdAt")
             VALUES (gen_random_uuid(), $1, $2, NOW())
             ON CONFLICT ("resourceId", "actionId") DO UPDATE SET "resourceId" = EXCLUDED."resourceId"
             RETURNING id`,
            [resource.id, action.id],
          );

          await tenantPool.query(
            `INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
             VALUES (gen_random_uuid(), $1, $2, NOW())
             ON CONFLICT ("roleId", "permissionId") DO NOTHING`,
            [roleId, permResult.rows[0].id],
          );
        }
      }

      // 7. Vincular role Admin ao usuário nesta empresa
      await tenantPool.query(
        `INSERT INTO user_roles (id, "userId", "roleId", "userCompanyId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
         ON CONFLICT ("userId", "roleId", "userCompanyId") DO NOTHING`,
        [userId, roleId, userCompanyId],
      );

      // 8. Seed: Tipos de Colaborador
      this.logger.log(`🌱 Criando dados iniciais para a empresa...`);
      const employeeTypes = [
        { value: 'FULL_TIME', label: 'Tempo Integral', description: 'Colaborador em jornada completa' },
        { value: 'PART_TIME', label: 'Meio Período', description: 'Colaborador em jornada parcial' },
        { value: 'CONTRACTOR', label: 'Prestador (PJ)', description: 'Prestador de serviço pessoa jurídica' },
        { value: 'INTERN', label: 'Estagiário', description: 'Estagiário' },
        { value: 'APPRENTICE', label: 'Jovem Aprendiz', description: 'Jovem aprendiz' },
        { value: 'TEMPORARY', label: 'Temporário', description: 'Colaborador temporário' },
      ];
      for (const et of employeeTypes) {
        await tenantPool.query(
          `INSERT INTO employee_type_config (id, company_id, value, label, description, is_system, created_at, updated_at)
           VALUES (uuidv7(), $1, $2, $3, $4, true, NOW(), NOW())
           ON CONFLICT (company_id, value) DO NOTHING`,
          [companyId, et.value, et.label, et.description],
        );
      }

      // 9. Seed: Tipos de Contrato
      const contractTypes = [
        { value: 'INDEFINITE', label: 'Indeterminado', description: 'Contrato por prazo indeterminado' },
        { value: 'FIXED_TERM', label: 'Prazo Determinado', description: 'Contrato por prazo determinado' },
        { value: 'APPRENTICE', label: 'Aprendiz', description: 'Contrato de aprendizagem' },
        { value: 'TEMPORARY', label: 'Temporário', description: 'Contrato temporário' },
        { value: 'EXPERIENCE', label: 'Experiência', description: 'Contrato de experiência' },
      ];
      for (const ct of contractTypes) {
        await tenantPool.query(
          `INSERT INTO contract_type_config (id, company_id, value, label, description, is_system, created_at, updated_at)
           VALUES (uuidv7(), $1, $2, $3, $4, true, NOW(), NOW())
           ON CONFLICT (company_id, value) DO NOTHING`,
          [companyId, ct.value, ct.label, ct.description],
        );
      }

      // 10. Seed: Centros de Custo
      const costCenters = [
        { name: 'Administrativo', code: 'ADM', description: 'Centro de custo administrativo' },
        { name: 'Operacional', code: 'OPR', description: 'Centro de custo operacional' },
        { name: 'Comercial', code: 'COM', description: 'Centro de custo comercial' },
        { name: 'Tecnologia da Informação', code: 'TI', description: 'Centro de custo de TI' },
        { name: 'Recursos Humanos', code: 'RH', description: 'Centro de custo de RH' },
        { name: 'Financeiro', code: 'FIN', description: 'Centro de custo financeiro' },
      ];
      for (const cc of costCenters) {
        await tenantPool.query(
          `INSERT INTO cost_center (id, company_id, name, code, description, created_at, updated_at)
           VALUES (uuidv7(), $1, $2, $3, $4, NOW(), NOW())
           ON CONFLICT (company_id, name) DO NOTHING`,
          [companyId, cc.name, cc.code, cc.description],
        );
      }

      // 11. Seed: Idiomas
      const languages = [
        { name: 'Português' },
        { name: 'Inglês' },
        { name: 'Espanhol' },
        { name: 'Francês' },
        { name: 'Alemão' },
        { name: 'Italiano' },
        { name: 'Mandarim' },
        { name: 'Japonês' },
      ];
      for (const lang of languages) {
        await tenantPool.query(
          `INSERT INTO language (id, name, created_at)
           VALUES (uuidv7(), $1, NOW())
           ON CONFLICT (name) DO NOTHING`,
          [lang.name],
        );
      }

      // 12. Seed: Habilidades
      const skills = [
        { name: 'Excel', category: 'Informática' },
        { name: 'Word', category: 'Informática' },
        { name: 'PowerPoint', category: 'Informática' },
        { name: 'Comunicação', category: 'Interpessoal' },
        { name: 'Liderança', category: 'Gestão' },
        { name: 'Trabalho em Equipe', category: 'Interpessoal' },
        { name: 'Gestão de Projetos', category: 'Gestão' },
        { name: 'Negociação', category: 'Comercial' },
        { name: 'Planejamento Estratégico', category: 'Gestão' },
        { name: 'Atendimento ao Cliente', category: 'Comercial' },
        { name: 'Power BI', category: 'Informática' },
        { name: 'SAP', category: 'Informática' },
      ];
      for (const sk of skills) {
        await tenantPool.query(
          `INSERT INTO skill (id, name, category, created_at)
           VALUES (uuidv7(), $1, $2, NOW())
           ON CONFLICT (name) DO NOTHING`,
          [sk.name, sk.category],
        );
      }

      this.logger.log(`✅ Dados iniciais criados com sucesso`);

      this.logger.log(`✅ Empresa "${companyInfo.name}" adicionada com sucesso ao tenant ${databaseName}`);
      if (isNewUser) {
        this.logger.log(`📧 Login: ${adminEmail} | Senha: MudarSenha@123`);
      }

      await tenantPool.query('COMMIT');
      transactionStarted = false;

      return { companyId, userId, isNewUser };

    } catch (error) {
      if (transactionStarted) {
        try {
          await tenantPool.query('ROLLBACK');
        } catch (rollbackError) {
          this.logger.error(`❌ Erro ao desfazer transação: ${rollbackError.message}`);
        }
      }
      this.logger.error(`❌ Erro ao adicionar empresa: ${error.message}`);
      this.logger.error(error.stack);
      throw new InternalServerErrorException(`Falha ao adicionar empresa ao tenant: ${error.message}`);
    } finally {
      await tenantPool.end();
    }
  }

  /**
   * Garante que resources e actions padrão existam no banco (idempotente).
   */
  private async ensureResourcesAndActions(pool: Pool): Promise<void> {
    const resourceNames = [
      { name: 'employees', displayName: 'Funcionários', order: 1 },
      { name: 'departments', displayName: 'Departamentos', order: 2 },
      { name: 'positions', displayName: 'Cargos', order: 3 },
      { name: 'contracts', displayName: 'Contratos', order: 4 },
      { name: 'companies', displayName: 'Empresas', order: 5 },
      { name: 'users', displayName: 'Usuários', order: 6 },
      { name: 'roles', displayName: 'Papéis', order: 7 },
      { name: 'reports', displayName: 'Relatórios', order: 8 },
    ];

    for (const res of resourceNames) {
      await pool.query(
        `INSERT INTO resources (id, name, "displayName", "order", "isActive", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), NOW())
         ON CONFLICT (name) DO NOTHING`,
        [res.name, res.displayName, res.order],
      );
    }

    const actionNames = [
      { name: 'create', displayName: 'Criar' },
      { name: 'read', displayName: 'Visualizar' },
      { name: 'update', displayName: 'Editar' },
      { name: 'delete', displayName: 'Excluir' },
      { name: 'manage', displayName: 'Gerenciar' },
    ];

    for (const act of actionNames) {
      await pool.query(
        `INSERT INTO actions (id, name, "displayName", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, NOW())
         ON CONFLICT (name) DO NOTHING`,
        [act.name, act.displayName],
      );
    }
  }

  /**
   * Deleta o banco PostgreSQL de um tenant (CUIDADO — irreversível).
   */
  async dropTenantDatabase(databaseName: string): Promise<void> {
    this.logger.warn(`🗑️ Removendo banco: ${databaseName}`);

    const { host, port, user, password } = this.getDbConfig();

    const adminPool = new Pool({
      host, port, user, password,
      database: 'postgres',
    });

    try {
      const safeName = databaseName.replace(/[^a-z0-9_]/g, '');

      // Desconectar todos os clientes do banco
      await adminPool.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${safeName}'
        AND pid <> pg_backend_pid()
      `);

      await adminPool.query(`DROP DATABASE IF EXISTS "${safeName}"`);
      this.logger.log(`✅ Banco "${safeName}" removido`);
    } catch (error) {
      this.logger.error(`❌ Erro ao remover banco: ${error.message}`);
      throw new InternalServerErrorException(`Falha ao remover banco: ${error.message}`);
    } finally {
      await adminPool.end();
    }
  }

  /**
   * Aplica as migrations pendentes em todos os bancos de tenants ativos.
   * Recebe uma lista de database_names e roda `prisma migrate deploy` em cada um.
   */
  async migrateAllTenants(databaseNames: string[]): Promise<{ success: string[]; failed: { db: string; error: string }[] }> {
    const success: string[] = [];
    const failed: { db: string; error: string }[] = [];

    for (const dbName of databaseNames) {
      try {
        const tenantDbUrl = this.getTenantConnectionUrl(dbName);
        await this.installUuidV7Function(tenantDbUrl, dbName);
        await this.runMigrations(tenantDbUrl, dbName);
        success.push(dbName);
      } catch (error) {
        this.logger.error(`❌ Falha ao migrar ${dbName}: ${error.message}`);
        failed.push({ db: dbName, error: error.message });
      }
    }

    return { success, failed };
  }

  /**
   * Retorna a connection string de um tenant.
   */
  getTenantConnectionUrl(databaseName: string): string {
    const { host, port, user, password } = this.getDbConfig();
    return `postgresql://${user}:${password}@${host}:${port}/${databaseName}`;
  }
}
