import { Module } from '@nestjs/common';
import { AuthModule } from '@/api-ngo/auth/auth.module';
import {ApiNgoController} from "@/api-ngo/api-ngo.controller";
import {SharedServicesModule} from "@/shared/services/shared-services.module";

@Module({
  imports: [AuthModule, SharedServicesModule],
  controllers: [ApiNgoController],
  providers: [],
})
export class ApiNgoModule {}
