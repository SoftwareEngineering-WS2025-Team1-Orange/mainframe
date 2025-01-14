import { IsString, IsNotEmpty, IsNumber, IsInt } from 'class-validator';

export class MiningPoolApiPayoutDto {
  @IsNumber()
  @IsNotEmpty()
  ts: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsNotEmpty()
  paidFee: number;

  @IsString()
  @IsNotEmpty()
  txnHash: string;

  @IsString()
  @IsNotEmpty()
  txnKey: string;

  @IsInt()
  @IsNotEmpty()
  mixin: number;
}
