import { validateOrReject, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Request, Response } from 'express';
import { DonatorScope, NGOScope } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import {
  GrantType,
  OAuth2Dto,
  OAuth2PasswordDto,
  OAuth2RefreshTokenDto,
  TokenEndpointAuthMethod,
} from '@/shared/auth/dto/auth.dto';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { DonatorClientWithScope } from '@/api-donator/auth/types';
import { NGOClientWithScope } from '@/api-ngo/auth/types';

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
  jwtService: JwtService,
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
      sameSite: 'none',
      path: req.url,
      expires: new Date(
        jwtService.decode<{ exp: number }>(tokens.refreshToken).exp * 1000,
      ),
    });

    return {
      access_token: tokens.accessToken,
      token_type: 'Bearer',
      expires_at: jwtService.decode<{ exp: number }>(tokens.refreshToken).exp,
    };
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
      sameSite: 'none',
      path: req.url,
      expires: new Date(
        jwtService.decode<{ exp: number }>(tokens.refreshToken).exp * 1000,
      ),
    });

    return {
      access_token: tokens.accessToken,
      token_type: 'Bearer',
      expires_at: jwtService.decode<{ exp: number }>(tokens.refreshToken).exp,
    };
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

export async function generateAlphanumericClientUuid10(
  prismaService: PrismaService,
): Promise<string> {
  let result: string = '';

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 10; i += 1) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // eslint-disable-next-line no-await-in-loop
    const [inTableA, inTableB] = await Promise.all([
      prismaService.nGOClient.findFirst({ where: { clientId: result } }),
      prismaService.donatorClient.findFirst({ where: { clientId: result } }),
    ]);

    if (!(!!inTableA || !!inTableB)) {
      return result;
    }
  }
}

export function generateClientResponseEntityFromPrisma(
  client: DonatorClientWithScope | NGOClientWithScope,
  secret: string,
  dateNow: number,
) {
  return {
    client_id: client.clientId,
    client_secret: secret,
    client_name: client.clientName,
    client_secret_expires_at: Math.floor(
      convertBigIntToInt(client.clientSecretExpires) / 1000,
    ),
    client_id_issued_at: dateNow,
    grant_types: [GrantType.PASSWORD],
    token_endpoint_auth_method: TokenEndpointAuthMethod.CLIENT_SECRET_BASIC,
    client_secret_lifetime: Math.floor(
      convertBigIntToInt(client.clientSecretLifetime) / 1000,
    ),
    access_token_lifetime: Math.floor(
      convertBigIntToInt(client.accessTokenLifetime) / 1000,
    ),
    refresh_token_lifetime: Math.floor(
      convertBigIntToInt(client.refreshTokenLifetime) / 1000,
    ),
    scope: client.allowedScopes.map(
      (scope: DonatorScope | NGOScope) => scope.name,
    ),
  };
}

export function convertBigIntToInt(value: bigint | number) {
  // Solution for JavaScript BigInt to Number conversion
  return Number(value);
}

export async function generateSecret(length: number): Promise<string[]> {
  const secret = randomBytes(length * 2)
    .toString('base64')
    .slice(0, length);

  const hash = await argon2.hash(secret);

  return [secret, hash];
}

export async function validateClientWithScopesImpl(
  clientId: string,
  clientSecret: string,
  scopes: string[],
  validateClient: (
    clientId: string,
    clientSecret: string,
  ) => Promise<DonatorClientWithScope | NGOClientWithScope>,
) {
  const client = await validateClient(clientId, clientSecret);

  const clientScopes = new Set(
    client.allowedScopes.map(
      (scope: DonatorScope | NGOScope) => scope.name as string,
    ),
  );
  if (scopes.some((scope) => !clientScopes.has(scope))) {
    throw new ForbiddenException('Access Denied');
  }
  return client;
}

export function validateScopes(scopesFirst: string[], scopesSecond: string[]) {
  if (!scopesFirst.every((scope) => scopesSecond.includes(scope))) {
    throw new ForbiddenException('Access Denied');
  }
}
