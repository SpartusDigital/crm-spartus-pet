import { IsString, IsOptional, IsDecimal, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty() @IsString() petId: string;
  @ApiProperty() @IsString() customerId: string;
  @ApiProperty() @IsString() serviceId: string;
  @ApiProperty() @IsDateString() startsAt: string;
  @ApiProperty() @IsDateString() endsAt: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() assignedToId?: string;
  @ApiProperty({ required: false }) @IsOptional() price?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}
