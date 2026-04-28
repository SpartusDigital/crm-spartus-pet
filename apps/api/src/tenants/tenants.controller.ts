import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private service: TenantsService) {}

  @Get('users') getUsers(@Request() req: any) { return this.service.getUsers(req.user.tenantId); }
  @Post('users') createUser(@Request() req: any, @Body() data: any) { return this.service.createUser(req.user.tenantId, data); }
  @Patch('users/:id') updateUser(@Request() req: any, @Param('id') id: string, @Body() data: any) { return this.service.updateUser(req.user.tenantId, id, data); }
  @Delete('users/:id') removeUser(@Request() req: any, @Param('id') id: string) { return this.service.removeUser(req.user.tenantId, id); }
}
