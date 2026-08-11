import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('CompanyController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/api/companies (GET) - exige autenticacao', () => {
    return request(app.getHttpServer())
      .get('/api/companies')
      .set('x-tenant-slug', 'acme')
      .expect(401);
  });

  it('/api/companies (POST) - exige autenticacao', () => {
    return request(app.getHttpServer())
      .post('/api/companies')
      .set('x-tenant-slug', 'acme')
      .send({ name: 'Nova Empresa' })
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
