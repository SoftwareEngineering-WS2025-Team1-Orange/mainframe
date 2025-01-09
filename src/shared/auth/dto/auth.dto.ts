import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Expose } from 'class-transformer';
import { DonatorScopeEnum, NGOScopeEnum } from '@prisma/client';

export enum GrantType {
  AUTHORIZATION_CODE = 'authorization_code',
  PASSWORD = 'password',
  CLIENT_CREDENTIALS = 'client_credentials',
  REFRESH_TOKEN = 'refresh_token',
}

export class OAuth2Dto {
  @IsEnum(GrantType)
  grant_type: GrantType;

  @IsString()
  client_id: string;

  @IsString()
  client_secret: string;

  @IsArray()
  @IsEnum({ ...DonatorScopeEnum, ...NGOScopeEnum }, { each: true })
  @IsOptional()
  scope?: DonatorScopeEnum[] | NGOScopeEnum[];

  // Grant type: authorization_code
  @IsOptional()
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  redirect_url?: string;

  // Grant type: password

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  // Grant type: refresh_token
  @IsOptional()
  @IsString()
  refresh_token: string;
}

class OAuth2BaseDto {
  @IsEnum(GrantType)
  grant_type: GrantType;

  @IsString()
  client_id: string;

  @IsString()
  client_secret: string;
}

export class OAuth2AuthorizationCode extends OAuth2BaseDto {
  @IsString()
  code: string;

  @IsString()
  redirect_url: string;

  @IsArray()
  @IsEnum({ ...DonatorScopeEnum, ...NGOScopeEnum }, { each: true })
  scope: DonatorScopeEnum[] | NGOScopeEnum[];
}

export class OAuth2PasswordDto extends OAuth2BaseDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsArray()
  @IsEnum({ ...DonatorScopeEnum, ...NGOScopeEnum }, { each: true })
  scope: DonatorScopeEnum[] | NGOScopeEnum[];
}

export class OAuth2ClientCredentialsDto extends OAuth2BaseDto {
  @IsArray()
  @IsEnum({ ...DonatorScopeEnum, ...NGOScopeEnum }, { each: true })
  scope: DonatorScopeEnum[] | NGOScopeEnum[];
}

export class OAuth2RefreshTokenDto extends OAuth2BaseDto {}

export enum TokenEndpointAuthMethod {
  CLIENT_SECRET_BASIC = 'client_secret_basic',
}

export class BaseCreateOAuth2ClientDto {
  @IsString()
  @IsOptional()
  redirect_uris?: string[];

  @IsString()
  client_name: string;

  @IsEnum(TokenEndpointAuthMethod)
  token_endpoint_auth_method: TokenEndpointAuthMethod;

  @IsNumber()
  client_secret_lifetime: number;

  @IsNumber()
  access_token_lifetime: number;

  @IsNumber()
  refresh_token_lifetime: number;
}

export class BaseUpdateOAuth2ClientDto {
  @IsString()
  client_secret: string;

  @IsString()
  @IsOptional()
  redirect_uris?: string[];

  @IsString()
  @IsOptional()
  client_name: string;

  @IsEnum(TokenEndpointAuthMethod)
  @IsOptional()
  token_endpoint_auth_method: TokenEndpointAuthMethod;

  @IsNumber()
  @IsOptional()
  client_secret_lifetime: number;

  @IsNumber()
  @IsOptional()
  access_token_lifetime: number;

  @IsNumber()
  @IsOptional()
  refresh_token_lifetime: number;
}

export class DeleteOAuth2ClientDto {
  @IsString()
  client_secret: string;
}

export class OAuth2ClientResponseDto {
  @Expose()
  client_id: string;

  @Expose()
  client_secret: string;

  @Expose()
  client_id_issued_at: number;

  @Expose()
  client_secret_expires_at: number;

  @Expose()
  redirect_uris?: string[];

  @Expose()
  grant_types: GrantType[];

  @Expose()
  token_endpoint_auth_method: TokenEndpointAuthMethod;

  @Expose()
  client_name: string;

  @Expose()
  client_secret_lifetime: number;

  @Expose()
  access_token_lifetime: number;

  @Expose()
  refresh_token_lifetime: number;

  @Expose()
  scope: DonatorScopeEnum[] | NGOScopeEnum[];
}
