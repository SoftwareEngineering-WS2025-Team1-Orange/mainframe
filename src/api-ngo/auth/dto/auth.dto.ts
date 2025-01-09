import { IsArray, IsEnum } from 'class-validator';
import { NGOScopeEnum } from '@prisma/client';
import {
  BaseCreateOAuth2ClientDto,
  BaseUpdateOAuth2ClientDto,
} from '@/shared/auth/dto/auth.dto';

export class NGOCreateOAuth2ClientDTO extends BaseCreateOAuth2ClientDto {
  @IsArray()
  @IsEnum(NGOScopeEnum, { each: true })
  scope: NGOScopeEnum[];
}

export class NGOUpdateOAuth2ClientDTO extends BaseUpdateOAuth2ClientDto {
  @IsArray()
  @IsEnum(NGOScopeEnum, { each: true })
  scope: NGOScopeEnum[];
}
