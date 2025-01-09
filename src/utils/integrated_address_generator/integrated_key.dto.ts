import { Length, IsString } from 'class-validator';

export class IntegratedAddressDto {
  @IsString()
  @Length(106, 106, {
    message: 'Integrated address must be exactly 106 characters long',
  })
  readonly integratedAddress: string;

  @IsString()
  @Length(16, 16, { message: 'Payment ID must be exactly 16 characters long' })
  readonly paymentId: string;

  constructor(partial: Partial<IntegratedAddressDto>) {
    Object.assign(this, partial);
  }
}
