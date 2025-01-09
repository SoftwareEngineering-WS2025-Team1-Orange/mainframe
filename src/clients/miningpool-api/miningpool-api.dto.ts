import { IsString, IsNotEmpty, IsNumber, IsInt } from 'class-validator';

export class MiningPoolApiRewardDto {
  @IsInt()
  @IsNotEmpty()
  height: number;

  @IsInt()
  @IsNotEmpty()
  amt: number;

  @IsInt()
  @IsNotEmpty()
  hs: number;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @IsNotEmpty()
  ts: number;
}
