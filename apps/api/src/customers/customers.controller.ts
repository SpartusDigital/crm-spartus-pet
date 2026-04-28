import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private service: CustomersService) {}

  @Post() create(@Request() req: any, @Body() dto: CreateCustomerDto) {
    return this.service.create(req.user.tenantId, dto);
  }

  @Get() findAll(@Request() req: any, @Query('search') search?: string) {
    return this.service.findAll(req.user.tenantId, search);
  }

  @Get(':id') findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.tenantId, id);
  }

  @Patch(':id') update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.update(req.user.tenantId, id, dto);
  }

  @Delete(':id') remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.tenantId, id);
  }
}
