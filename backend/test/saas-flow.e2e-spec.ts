import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Pool } from 'pg';
import { AppModule as BackendAppModule } from '../src/app.module';
import { AppModule as AdminAppModule } from '../../admin/src/app.module';

describe('SaaS provisioning flow (e2e)', () => {
  let backendApp: INestApplication;
  let adminApp: INestApplication;
  let slug: string;
  let databaseName: string;
  let tenantId: string | undefined;

  jest.setTimeout(180000);

  beforeAll(async () => {
    const adminModule: TestingModule = await Test.createTestingModule({
      imports: [AdminAppModule],
    }).compile();

    adminApp = adminModule.createNestApplication();
    adminApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    adminApp.setGlobalPrefix('api/admin');
    await adminApp.init();

    const backendModule: TestingModule = await Test.createTestingModule({
      imports: [BackendAppModule],
    }).compile();

    backendApp = backendModule.createNestApplication();
    backendApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    backendApp.setGlobalPrefix('api');
    await backendApp.init();

    slug = `e2e-${Date.now().toString(36)}`;
    databaseName = `tenant_${slug.replace(/-/g, '_')}`;
  });

  afterAll(async () => {
    await cleanupTenant();
    await backendApp?.close();
    await adminApp?.close();
  });

  it('creates tenant, provisions company, logs in and creates employee', async () => {
    const adminLogin = await request(adminApp.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ email: 'admin@gestao.com', password: 'admin123' })
      .expect(201);

    const adminToken = adminLogin.body.access_token;
    expect(adminToken).toBeTruthy();

    const tenantResponse = await request(adminApp.getHttpServer())
      .post('/api/admin/tenants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slug,
        name: `Empresa E2E ${slug}`,
        trade_name: `E2E ${slug}`,
        document: `E2E-${Date.now()}`,
        email: `${slug}@example.com`,
        phone: '(11) 90000-0000',
        max_employees: 25,
        max_users: 5,
      })
      .expect(201);

    tenantId = tenantResponse.body.id;
    expect(tenantResponse.body.database_name).toBe(databaseName);

    const companyResponse = await request(adminApp.getHttpServer())
      .post(`/api/admin/tenants/${tenantId}/companies`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Empresa Operacional ${slug}`,
        document: `DOC-${Date.now()}`,
        admin_email: `${slug}.admin@example.com`,
        is_headquarters: true,
      })
      .expect(201);

    const companyId = companyResponse.body.companyId;
    expect(companyId).toBeTruthy();

    const tenantLogin = await request(backendApp.getHttpServer())
      .post('/api/auth/login')
      .set('x-tenant-slug', slug)
      .send({ email: `${slug}.admin@example.com`, password: 'MudarSenha@123' })
      .expect(201);

    expect(tenantLogin.body.token).toBeTruthy();
    expect(tenantLogin.body.companies).toHaveLength(1);

    const createEmployee = await request(backendApp.getHttpServer())
      .post('/api/employees/full')
      .set('Authorization', `Bearer ${tenantLogin.body.token}`)
      .set('x-tenant-slug', slug)
      .set('x-company-id', companyId)
      .send({
        first_name: 'Pessoa',
        last_name: `E2E ${slug}`,
        government_id: `${Date.now()}`,
        gender: 'OTHER',
        nationality: 'Brasileira',
        employee_number: `E2E-${Date.now()}`,
        employee_type: 'FULL_TIME',
        hire_date: '2026-05-10',
        contact: {
          email: `${slug}.employee@example.com`,
          phone: '(11) 98888-7777',
        },
        contract: {
          contract_type: 'INDEFINITE',
          start_date: '2026-05-10',
          work_hours: '44h',
        },
        salary: {
          amount: 3500,
          currency: 'BRL',
          start_date: '2026-05-10',
        },
      })
      .expect(201);

    expect(createEmployee.body.id).toBeTruthy();
    expect(createEmployee.body.company_id).toBe(companyId);

    const contracts = await request(backendApp.getHttpServer())
      .get('/api/contracts')
      .set('Authorization', `Bearer ${tenantLogin.body.token}`)
      .set('x-tenant-slug', slug)
      .set('x-company-id', companyId)
      .expect(200);

    expect(Array.isArray(contracts.body.data)).toBe(true);
    expect(contracts.body.data).toHaveLength(1);
    expect(contracts.body.data[0].employee_id).toBe(createEmployee.body.id);
    expect(contracts.body.meta.total).toBe(1);
  });

  async function cleanupTenant() {
    if (!databaseName) return;

    const masterUrl = process.env.MASTER_DATABASE_URL;
    if (!masterUrl) return;

    const adminUrl = new URL(masterUrl);
    adminUrl.pathname = '/postgres';

    const masterPool = new Pool({ connectionString: masterUrl });
    const adminPool = new Pool({ connectionString: adminUrl.toString() });

    try {
      await adminPool.query(
        'select pg_terminate_backend(pid) from pg_stat_activity where datname = $1 and pid <> pg_backend_pid()',
        [databaseName],
      );
      await adminPool.query(`drop database if exists "${databaseName.replace(/[^a-z0-9_]/g, '')}"`);

      if (tenantId) {
        await masterPool.query('delete from tenant where id = $1', [tenantId]);
      } else if (slug) {
        await masterPool.query('delete from tenant where slug = $1', [slug]);
      }
    } finally {
      await masterPool.end();
      await adminPool.end();
    }
  }
});
