import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsString() assignedToId?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() cancelReason?: string;
  @IsOptional() price?: number;
}
