import { IsJWT } from 'class-validator';

export class JwtDonationBoxDto {
  @IsJWT()
  readonly token: string;
}
