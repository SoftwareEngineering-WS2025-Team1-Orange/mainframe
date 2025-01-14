import { Module } from '@nestjs/common';
import { MiningPoolApiModule } from './miningpool-api/miningpool-api.module';

@Module({
  imports: [MiningPoolApiModule],
  exports: [MiningPoolApiModule],
})
export class ClientsModule {}
