import { IsArray, IsEnum } from 'class-validator';
import { DonatorScopeEnum } from '@prisma/client';
import {
  BaseCreateOAuth2ClientDto,
  BaseUpdateOAuth2ClientDto,
} from '@/shared/auth/dto/auth.dto';

export class DonatorCreateOAuth2ClientDTO extends BaseCreateOAuth2ClientDto {
  @IsArray()
  @IsEnum(DonatorScopeEnum, { each: true })
  scope: DonatorScopeEnum[];
}

export class DonatorUpdateOAuth2ClientDTO extends BaseUpdateOAuth2ClientDto {
  @IsArray()
  @IsEnum(DonatorScopeEnum, { each: true })
  scope: DonatorScopeEnum[];
}
