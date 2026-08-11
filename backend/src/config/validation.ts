import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, IsEnum, IsOptional, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;

  // Multi-Tenancy (opcionais — se presentes, habilita modo multi-tenant)
  @IsOptional()
  @IsString()
  MASTER_DATABASE_URL?: string;

  @IsOptional()
  @IsString()
  TENANT_DB_HOST?: string;

  @IsOptional()
  @IsString()
  TENANT_DB_USER?: string;

  @IsOptional()
  @IsString()
  TENANT_DB_PASSWORD?: string;

  @IsOptional()
  @IsString()
  BASE_DOMAIN?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}