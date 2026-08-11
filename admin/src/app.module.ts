import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ProvisioningModule } from './modules/provisioning/provisioning.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PlanModule } from './modules/plan/plan.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),
    PrismaModule,
    AuthModule,
    TenantModule,
    SubscriptionModule,
    PaymentModule,
    ProvisioningModule,
    DashboardModule,
    PlanModule,
  ],
})
export class AppModule {}
