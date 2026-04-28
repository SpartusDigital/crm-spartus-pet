import { Controller, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WhitelabelService } from './whitelabel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('whitelabel')
@Controller('whitelabel')
export class WhitelabelController {
  constructor(private service: WhitelabelService) {}

  @Get('theme/:slug')
  getTheme(@Param('slug') slug: string) {
    return this.service.getTheme(slug);
  }

  @Patch('theme')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateTheme(@Request() req: any, @Body() data: any) {
    return this.service.updateTheme(req.user.tenantId, data);
  }

  @Patch('settings')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateSettings(@Request() req: any, @Body() data: any) {
    return this.service.updateSettings(req.user.tenantId, data);
  }
}
