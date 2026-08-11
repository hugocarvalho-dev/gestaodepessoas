import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule as any);

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: nodeEnv === 'production',
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*').split(','), // 👈 TRANSFORMA EM ARRAY
    credentials: true,
  });
  
  app.setGlobalPrefix('api');
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('API de Gestão')
      .setDescription('Documentação completa da API de Gestão')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'x-company-id', in: 'header' }, 'x-company-id')
      .build();
    
  const document = SwaggerModule.createDocument(app, config);
  
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

    console.log(`📚 Documentação: http://localhost:${port}/api/docs`);
}

  await app.listen(port);
  console.log(`🚀 API rodando em: http://localhost:${port}/api`);
  console.log(`🌍 Ambiente: ${nodeEnv}`);
}
bootstrap();
