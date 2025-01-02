import { validateOrReject, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  GrantType,
  OAuth2Dto,
  OAuth2PasswordDto,
  OAuth2RefreshTokenDto,
} from '@/shared/auth/dto/auth.dto';

export function buildValidationErrorResponse(errors: ValidationError[]) {
  return {
    message: errors.flatMap((e) => Object.values(e.constraints)),
    error: 'Bad Request',
    statusCode: 400,
  };
}

export async function handleOAuthFlow(
  data: OAuth2Dto,
  req: Request,
  res: Response,
  signInFn: (
    data: OAuth2PasswordDto,
  ) => Promise<{ accessToken: string; refreshToken: string }>,
  genrateTokensFn: (
    token: string,
  ) => Promise<{ accessToken: string; refreshToken: string }>,
) {
  if (data.grant_type === GrantType.AUTHORIZATION_CODE)
    throw new Error('Not implemented');

  if (data.grant_type === GrantType.PASSWORD) {
    const toValidate = plainToInstance(OAuth2PasswordDto, data);
    await validateOrReject(toValidate).catch((error: ValidationError[]) => {
      throw new BadRequestException(buildValidationErrorResponse(error));
    });

    const tokens = await signInFn(toValidate);

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: req.url,
    });

    return { access_token: tokens.accessToken };
  }

  if (data.grant_type === GrantType.CLIENT_CREDENTIALS)
    throw new Error('Not implemented');

  if (data.grant_type === GrantType.REFRESH_TOKEN) {
    const toValidate = plainToInstance(OAuth2RefreshTokenDto, data);
    await validateOrReject(toValidate).catch((error: ValidationError[]) => {
      throw new BadRequestException(buildValidationErrorResponse(error));
    });
    const tokens = await genrateTokensFn(req.cookies.refresh_token);

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: req.url,
    });

    return { access_token: tokens.accessToken };
  }

  throw new BadRequestException('Invalid grant type');
}

export function rejectOnNotOwnedResource(id: number, req: Request): number {
  const ident = req.user as { sub: number };
  if (ident.sub !== id) {
    throw new BadRequestException('Not authorized');
  }
  return ident.sub;
}
