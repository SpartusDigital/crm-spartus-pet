import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'meu-petshop' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug deve conter apenas letras minúsculas, números e hífens' })
  tenantSlug: string;

  @ApiProperty({ example: 'Pet Shop Feliz' })
  @IsString()
  businessName: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'joao@petshopfeliz.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senhaSegura123' })
  @IsString()
  @MinLength(8)
  password: string;
}
