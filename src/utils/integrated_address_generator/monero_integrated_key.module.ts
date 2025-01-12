import { Module } from '@nestjs/common';
import { MoneroIntegratedAddressService } from './monero_integrated_key.service';

@Module({
  providers: [MoneroIntegratedAddressService],
  exports: [MoneroIntegratedAddressService],
})
export class IntegratedKeyModule {}
