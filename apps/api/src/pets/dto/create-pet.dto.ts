import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreatePetDto {
  @IsString() customerId: string;
  @IsString() name: string;
  @IsString() species: string;
  @IsOptional() @IsString() breed?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsDateString() birthDate?: string;
  @IsOptional() weight?: number;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() microchip?: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsString() notes?: string;
}
