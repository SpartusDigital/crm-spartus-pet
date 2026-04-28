import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateCustomerDto {
  @IsString() name: string;
  @IsString() phone: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() whatsappId?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() notes?: string;
}
