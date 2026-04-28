import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { CustomersModule } from './customers/customers.module';
import { PetsModule } from './pets/pets.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ServicesModule } from './services/services.module';
import { FinancialModule } from './financial/financial.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { AutomationsModule } from './automations/automations.module';
import { WhitelabelModule } from './whitelabel/whitelabel.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    TenantsModule,
    CustomersModule,
    PetsModule,
    AppointmentsModule,
    ServicesModule,
    FinancialModule,
    WhatsappModule,
    AutomationsModule,
    WhitelabelModule,
  ],
})
export class AppModule {}
