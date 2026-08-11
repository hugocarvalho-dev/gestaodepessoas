import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { CompanyModule } from './modules/company/company.module';
import { PersonModule } from './modules/person/person.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { DepartmentModule } from './modules/department/department.module';
import { PositionModule } from './modules/position/position.module';
import { PositionLevelModule } from './modules/position-level/position-level.module';
import { ContractModule } from './modules/contract/contract.module';
import { SalaryModule } from './modules/salary/salary.module';
import { DocumentModule } from './modules/document/document.module';
import { LanguageModule } from './modules/language/language.module';
import { SkillModule } from './modules/skill/skill.module';
import { EmployeeDepartmentModule } from './modules/employee-department/employee-department.module';
import { EmployeePositionModule } from './modules/employee-position/employee-position.module';
import { EmployeeLanguageModule } from './modules/employee-language/employee-language.module';
import { EmployeeSkillModule } from './modules/employee-skill/employee-skill.module';
import { EducationModule } from './modules/education/education.module';
import { FamilyInfoModule } from './modules/family-info/family-info.module';
import { PersonalContactModule } from './modules/personal-contact/personal-contact.module';
import { EmergencyContactModule } from './modules/emergency-contact/emergency-contact.module';
import { WorkExperienceModule } from './modules/work-experience/work-experience.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UserModule } from './modules/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { validate } from './config/validation';
import { UploadModule } from './modules/upload/upload.module';
import { LoggerModule } from './modules/logger/logger.module';
import { LoggingInterceptor } from './modules/logger/logger.interceptor';
import { AllExceptionsFilter } from './modules/logger/logger.filter';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AuditModule } from './modules/audit/audit.module';
import { CostCenterModule } from './modules/cost-center/cost-center.module';
import { EmployeeTypeConfigModule } from './modules/employee-type-config/employee-type-config.module';
import { ContractTypeConfigModule } from './modules/contract-type-config/contract-type-config.module';
import { TenantModule } from './tenant/tenant.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';


@Module({
  imports: [
    // Rate limiting: 100 requisições por 60 segundos globalmente
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos
        limit: 100, // 100 requisições
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      envFilePath: ['.env.development', '.env'],
    }),
    PrismaModule,
    CompanyModule,
    PersonModule,
    EmployeeModule,
    DepartmentModule,
    PositionModule,
    PositionLevelModule,
    ContractModule,
    SalaryModule,
    DocumentModule,
    LanguageModule,
    SkillModule,
    EmployeeDepartmentModule,
    EmployeePositionModule,
    EmployeeLanguageModule,
    EmployeeSkillModule,
    EducationModule,
    FamilyInfoModule,
    PersonalContactModule,
    EmergencyContactModule,
    WorkExperienceModule,
    DashboardModule,
    UserModule,
    AuthModule,
    UploadModule,
    LoggerModule,
    AuditModule,
    CostCenterModule,
    EmployeeTypeConfigModule,
    ContractTypeConfigModule,
    TenantModule,
    OnboardingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
