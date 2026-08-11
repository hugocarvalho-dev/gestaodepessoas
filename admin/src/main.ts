import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3002);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*').split(','),
    credentials: true,
  });

  app.setGlobalPrefix('api/admin');

  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Admin API — Multi-Tenant Management')
      .setDescription('API para gerenciamento de tenants, assinaturas e faturamento')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/admin/docs', app, document, {
      swaggerOptions: { tagsSorter: 'alpha', operationsSorter: 'alpha' },
    });

    console.log(`📚 Admin Docs: http://localhost:${port}/api/admin/docs`);
  }

  await app.listen(port);
  console.log(`🚀 Admin API rodando em: http://localhost:${port}/api/admin`);
}
bootstrap();
