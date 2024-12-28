import { Module } from '@nestjs/common';
import { AuthModule } from '@/api-donator/auth/auth.module';
import { SharedServicesModule } from '@/shared/services/shared-services.module';
import { ApiDonatorController } from '@/api-donator/api-donator.controller';

@Module({
  imports: [AuthModule, SharedServicesModule],
  controllers: [ApiDonatorController],
  providers: [],
})
export class ApiDonatorModule {}
