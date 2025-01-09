import { Module } from '@nestjs/common';
import { IntegratedKeyService } from './integrated_key.service';

@Module({
  providers: [IntegratedKeyService],
  exports: [IntegratedKeyService],
})
export class IntegratedKeyModule {}
