import { IsEnum, IsOptional, IsString } from 'class-validator';

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
}

export class OAuth2PasswordDto extends OAuth2BaseDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

export class OAuth2ClientCredentialsDto extends OAuth2BaseDto {}

export class OAuth2RefreshTokenDto extends OAuth2BaseDto {}
