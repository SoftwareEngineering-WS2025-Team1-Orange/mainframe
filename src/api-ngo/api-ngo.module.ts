import { Module } from '@nestjs/common';
import { AuthModule } from '@/api-ngo/auth/auth.module';
import {NgoModule} from "@/api-ngo/ngo/ngo.module";

@Module({
  imports: [AuthModule, NgoModule],
  controllers: [],
  providers: [],
})
export class ApiNgoModule {}
