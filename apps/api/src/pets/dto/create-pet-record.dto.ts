import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreatePetRecordDto {
  @IsString() type: string;
  @IsDateString() date: string;
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() performedBy?: string;
  @IsOptional() cost?: number;
  @IsOptional() attachments?: any;
}
