import { Module } from '@nestjs/common';
import { AuthModule } from '@/api-donator/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [],
})
export class ApiDonatorModule {}
