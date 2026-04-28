import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('financial')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('financial')
export class FinancialController {
  constructor(private service: FinancialService) {}

  @Get('kpis')
  getKpis(@Request() req: any, @Query('period') period: any) {
    return this.service.getKpis(req.user.tenantId, period);
  }

  @Get('chart/revenue')
  getRevenueChart(@Request() req: any, @Query('year') year?: number) {
    return this.service.getRevenueChart(req.user.tenantId, year);
  }

  @Get('top-services')
  getTopServices(@Request() req: any) {
    return this.service.getTopServices(req.user.tenantId);
  }

  @Get('transactions')
  getTransactions(@Request() req: any, @Query() filters: any) {
    return this.service.getTransactions(req.user.tenantId, filters);
  }

  @Post('transactions')
  createTransaction(@Request() req: any, @Body() data: any) {
    return this.service.createTransaction(req.user.tenantId, data);
  }
}
