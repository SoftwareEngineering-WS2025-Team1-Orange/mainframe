import { Module } from '@nestjs/common';
import { AuthModule } from '@/api-ngo/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [],
})
export class ApiNgoModule {}
