import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private service: AppointmentsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateAppointmentDto) {
    return this.service.create(req.user.tenantId, dto);
  }

  @Get()
  findAll(@Request() req: any, @Query() filters: any) {
    return this.service.findAll(req.user.tenantId, filters);
  }

  @Get('slots')
  getSlots(@Request() req: any, @Query('date') date: string, @Query('serviceId') serviceId: string, @Query('userId') userId?: string) {
    return this.service.getAvailableSlots(req.user.tenantId, date, serviceId, userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.service.update(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.tenantId, id);
  }
}
