import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private service: ServicesService) {}

  @Get() findAll(@Request() req: any) { return this.service.findAll(req.user.tenantId); }
  @Post() create(@Request() req: any, @Body() data: any) { return this.service.create(req.user.tenantId, data); }
  @Patch(':id') update(@Request() req: any, @Param('id') id: string, @Body() data: any) { return this.service.update(req.user.tenantId, id, data); }
  @Delete(':id') remove(@Request() req: any, @Param('id') id: string) { return this.service.remove(req.user.tenantId, id); }
}
