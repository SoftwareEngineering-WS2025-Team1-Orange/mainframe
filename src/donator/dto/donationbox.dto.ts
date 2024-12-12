import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectDonationBoxDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}
