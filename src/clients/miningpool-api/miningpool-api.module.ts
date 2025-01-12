import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MiningPoolApiClient } from './miningpool-api.client';

@Module({
  providers: [MiningPoolApiClient],
  imports: [HttpModule],
  exports: [MiningPoolApiClient],
})
export class MiningPoolApiModule {}
