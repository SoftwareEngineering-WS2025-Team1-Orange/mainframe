import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { generateIntegratedAddress } from './crypto_functions/addresses.js';
import { IntegratedAddressDto } from './integrated_key.dto.js';
import { IntegratedKeyGenerationError } from '@/shared/errors/IntegratedKeyGenerationError';
import { IntegratedPublicAddress } from './types.js';

@Injectable()
export class IntegratedKeyService {
  constructor(private configService: ConfigService) {}

  async generateIntegratedAddress(): Promise<IntegratedPublicAddress> {
    const walletPublicKey = this.configService.get<string>('WALLET_PUBLIC_KEY');
    if (!walletPublicKey) {
      throw new IntegratedKeyGenerationError(
        'WALLET_PUBLIC_KEY is not configured',
      );
    }

    const result = generateIntegratedAddress(walletPublicKey);
    if (!result || typeof result !== 'object') {
      throw new IntegratedKeyGenerationError(
        'Invalid response from generateIntegratedAddress',
      );
    }

    const integratedAddressDto = plainToInstance(IntegratedAddressDto, result);
    await validateOrReject(integratedAddressDto).catch(() => {
      throw new IntegratedKeyGenerationError(
        `Validating integrated address failed.`,
      );
    });

    return {
      integratedPublicAddress: integratedAddressDto.integratedAddress,
      integratedPublicAddressId: integratedAddressDto.paymentId,
    };
  }
}
