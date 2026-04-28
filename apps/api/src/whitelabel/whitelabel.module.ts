import { Module } from '@nestjs/common';
import { WhitelabelService } from './whitelabel.service';
import { WhitelabelController } from './whitelabel.controller';

@Module({
  providers: [WhitelabelService],
  controllers: [WhitelabelController],
})
export class WhitelabelModule {}
