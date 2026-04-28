import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { CreatePetRecordDto } from './dto/create-pet-record.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('pets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pets')
export class PetsController {
  constructor(private service: PetsService) {}

  @Post() create(@Request() req: any, @Body() dto: CreatePetDto) {
    return this.service.create(req.user.tenantId, dto);
  }

  @Get() findAll(@Request() req: any, @Query('customerId') customerId?: string) {
    return this.service.findAll(req.user.tenantId, customerId);
  }

  @Get('vaccines/upcoming') upcomingVaccines(@Request() req: any) {
    return this.service.getUpcomingVaccines(req.user.tenantId);
  }

  @Get(':id') findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.tenantId, id);
  }

  @Patch(':id') update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdatePetDto) {
    return this.service.update(req.user.tenantId, id, dto);
  }

  @Delete(':id') remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.tenantId, id);
  }

  @Post(':id/records') addRecord(@Request() req: any, @Param('id') id: string, @Body() dto: CreatePetRecordDto) {
    return this.service.addRecord(id, req.user.tenantId, dto);
  }

  @Post(':id/vaccines') addVaccine(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.addVaccine(id, req.user.tenantId, data);
  }
}
