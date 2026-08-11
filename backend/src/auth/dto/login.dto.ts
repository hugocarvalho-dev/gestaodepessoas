import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsValidEmail } from '@/common/validators';

export class LoginDto {
 @ApiProperty({
    example: 'admin@sistema.com',
    description: 'E-mail do usuário'
  })
  @IsValidEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: 'admin@123',
    description: 'Senha do usuário'
  })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;

}


