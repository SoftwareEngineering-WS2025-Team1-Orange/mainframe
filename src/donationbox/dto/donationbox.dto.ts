import { Expose } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { Status } from '@prisma/client';

export class DonationBoxDtoResponse {
  @Expose()
  readonly cuid: string;
}

export class DonationBoxStatusDto {
  @IsEnum(Status)
  status: Status;
}
