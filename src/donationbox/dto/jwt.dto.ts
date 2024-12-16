import { IsJWT, Validate } from 'class-validator';
import { Expose } from 'class-transformer';
import { isCuid } from '@paralleldrive/cuid2';

// REST
export class CreateJWTDonationBoxDto {
  @Validate(isCuid, {
    message: 'Invalid CUID',
  })
  readonly cuid: string;
}

export class JwtDonationBoxDtoResponse {
  @Expose()
  readonly token: string;
}

// WS

export class JwtDonationBoxDto {
  @IsJWT()
  readonly token: string;
}
