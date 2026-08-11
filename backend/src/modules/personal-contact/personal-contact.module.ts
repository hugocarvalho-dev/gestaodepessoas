import { Module } from '@nestjs/common';
import { PersonalContactService } from './personal-contact.service';
import { PersonalContactController } from './personal-contact.controller';

@Module({
  controllers: [PersonalContactController],
  providers: [PersonalContactService],
})
export class PersonalContactModule {}
