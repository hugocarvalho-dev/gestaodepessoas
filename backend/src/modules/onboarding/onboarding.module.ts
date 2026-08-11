import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { OnboardingPublicController } from './onboarding.public.controller';

@Module({
  controllers: [OnboardingController, OnboardingPublicController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
