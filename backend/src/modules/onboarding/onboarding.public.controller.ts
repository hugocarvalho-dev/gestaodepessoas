import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { SubmitOnboardingDto } from './dto/onboarding.dto';

@ApiTags('Onboarding Public')
@Controller('onboarding/public')
export class OnboardingPublicController {
  constructor(private readonly service: OnboardingService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Get public onboarding form by token' })
  getPublicForm(@Param('token') token: string) {
    return this.service.getPublicForm(token);
  }

  @Get(':token/languages')
  @ApiOperation({ summary: 'Get available languages for public onboarding by token' })
  getLanguages(@Param('token') token: string) {
    return this.service.getPublicLanguages(token);
  }

  @Post(':token/submit')
  @ApiOperation({ summary: 'Submit public onboarding form by token' })
  submit(@Param('token') token: string, @Body() dto: SubmitOnboardingDto) {
    return this.service.submitByToken(token, dto);
  }
}
