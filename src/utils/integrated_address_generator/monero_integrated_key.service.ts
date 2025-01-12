import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { generateIntegratedAddressCryptoHelper } from '@/utils/integrated_address_generator/monero_crypto_functions/addresses.js';
import { MoneroIntegratedAddressDto } from './monero_integrated_key.dto.js';
import { IntegratedKeyGenerationError } from '@/shared/errors/IntegratedKeyGenerationError';
import { MoneroIntegratedPublicAddress } from './types.js';

@Injectable()
export class MoneroIntegratedAddressService {
  constructor(private configService: ConfigService) {}

  async generateIntegratedAddress(): Promise<MoneroIntegratedPublicAddress> {
    const walletPublicKey = this.configService.get<string>('WALLET_PUBLIC_KEY');
    if (!walletPublicKey) {
      throw new IntegratedKeyGenerationError(
        'WALLET_PUBLIC_KEY is not configured',
      );
    }

    const result = generateIntegratedAddressCryptoHelper(walletPublicKey); // from crypto helper
    if (!result || typeof result !== 'object') {
      throw new IntegratedKeyGenerationError(
        'Invalid response from generateIntegratedAddress',
      );
    }

    const integratedAddressDto = plainToInstance(
      MoneroIntegratedAddressDto,
      result,
    );
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
