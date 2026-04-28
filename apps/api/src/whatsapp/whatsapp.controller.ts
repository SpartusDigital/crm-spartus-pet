import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private service: WhatsappService) {}

  @Post('webhook/:tenantSlug')
  async webhook(@Param('tenantSlug') slug: string, @Body() payload: any) {
    return this.service.handleWebhook(slug, payload);
  }

  @Get('conversations')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getConversations(@Request() req: any) {
    return this.service.getConversations(req.user.tenantId);
  }

  @Get('conversations/:id/messages')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getMessages(@Request() req: any, @Param('id') id: string) {
    return this.service.getMessages(req.user.tenantId, id);
  }

  @Post('conversations/:id/reply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  reply(@Request() req: any, @Param('id') id: string, @Body('message') message: string) {
    return this.service.replyToConversation(req.user.tenantId, id, message);
  }
}
