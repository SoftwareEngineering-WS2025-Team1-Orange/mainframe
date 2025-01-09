import { ForbiddenException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DonatorScopeEnum, NGOScopeEnum } from '@prisma/client';
import { DonatorService } from '@/shared/services/donator.service';
import {
  DonatorClientWithScope,
  DonatorWithScope,
} from '@/api-donator/auth/types';
import {
  convertBigIntToInt,
  generateAlphanumericClientUuid10,
  generateClientResponseEntityFromPrisma,
  generateSecret,
  validateClientWithScopesImpl,
  validateScopes,
} from '@/utils/auth.helper';
import { PrismaService } from '@/shared/prisma/prisma.service';
import {
  DonatorCreateOAuth2ClientDTO,
  DonatorUpdateOAuth2ClientDTO,
} from '@/api-donator/auth/dto/auth.dto';
import { OAuth2PasswordDto } from '@/shared/auth/dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private donatorService: DonatorService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    const insertScopes = async () => {
      const inserts = [];
      Object.values(DonatorScopeEnum).forEach((scope) => {
        inserts.push(
          prismaService.donatorScope.upsert({
            where: { name: scope },
            update: {},
            create: { name: scope },
          }),
        );
      });
      await prismaService.$transaction(inserts);
    };
    insertScopes().catch((error) => {
      throw error;
    });
  }

  async validateClient(clientId: string, clientSecret: string) {
    const client = await this.prismaService.donatorClient.findFirst({
      where: {
        clientId,
        clientSecretExpires: {
          gte: Date.now(),
        },
      },
      include: {
        allowedScopes: true,
      },
    });

    if (!client || !(await argon2.verify(client.clientSecret, clientSecret))) {
      throw new ForbiddenException('Access Denied');
    }

    return client;
  }

  async registerClient(data: DonatorCreateOAuth2ClientDTO) {
    const dateNow = Date.now();
    const [secret, hash] = await generateSecret(64);
    const client = await this.prismaService.donatorClient.create({
      data: {
        clientId: await generateAlphanumericClientUuid10(this.prismaService),
        clientSecret: hash,
        clientName: data.client_name,
        clientSecretExpires: dateNow + data.client_secret_lifetime,
        clientSecretLifetime: data.client_secret_lifetime,
        accessTokenLifetime: data.access_token_lifetime,
        refreshTokenLifetime: data.refresh_token_lifetime,
        allowedScopes: {
          connect: data.scope.map((scope: DonatorScopeEnum | NGOScopeEnum) => ({
            name: scope as DonatorScopeEnum,
          })),
        },
      },
      include: {
        allowedScopes: true,
      },
    });

    return generateClientResponseEntityFromPrisma(client, secret, dateNow);
  }

  async updateClient(
    clientId: string,
    data: DonatorUpdateOAuth2ClientDTO,
    rotateSecret: boolean,
  ) {
    const dateNow = Date.now();
    const [secret, hash] = rotateSecret
      ? await generateSecret(64)
      : [data.client_secret, undefined];
    const client = await this.prismaService.donatorClient.update({
      where: {
        clientId,
      },
      data: {
        clientName: data.client_name,
        clientSecret: hash,
        clientSecretExpires: dateNow + data.client_secret_lifetime,
        clientSecretLifetime: data.client_secret_lifetime,
        accessTokenLifetime: data.access_token_lifetime,
        refreshTokenLifetime: data.refresh_token_lifetime,
        allowedScopes: {
          set: data.scope.map((scope: DonatorScopeEnum | NGOScopeEnum) => ({
            name: scope as DonatorScopeEnum,
          })),
        },
      },
      include: {
        allowedScopes: true,
      },
    });

    return generateClientResponseEntityFromPrisma(client, secret, dateNow);
  }

  async deleteClient(clientId: string) {
    await this.prismaService.donatorClient.delete({
      where: {
        clientId,
      },
    });
  }

  async validateClientWithScopes(
    clientId: string,
    clientSecret: string,
    scope: string[],
  ) {
    return (await validateClientWithScopesImpl(
      clientId,
      clientSecret,
      scope,
      this.validateClient.bind(this),
    )) as DonatorClientWithScope;
  }

  async signIn(
    data: OAuth2PasswordDto,
    client: DonatorClientWithScope,
    scope: DonatorScopeEnum[],
  ) {
    const donator: DonatorWithScope = await this.validateDonator(
      data.username,
      data.password,
    );
    if (!donator) {
      throw new ForbiddenException('Access Denied');
    }
    const tokens = await this.getTokens(donator, client, scope);
    await this.donatorService.updateRefreshToken(
      donator.id,
      tokens.refreshToken,
    );
    return tokens;
  }

  async generateTokensFromRefreshToken(
    token: string,
    client: DonatorClientWithScope,
  ) {
    return this.refreshTokens(token, client);
  }

  async logout(donatorId: number) {
    return this.donatorService.updateRefreshToken(donatorId, null);
  }

  async getTokens(
    donator: DonatorWithScope,
    client: DonatorClientWithScope,
    scopes: DonatorScopeEnum[],
  ) {
    validateScopes(
      scopes,
      donator.scope.map((scope) => scope.name),
    );
    const payload = {
      email: donator.email,
      scope: scopes,
      sub: donator.id,
      iat: Math.floor(Date.now()),
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('DONATOR_JWT_ACCESS_SECRET'),
        expiresIn: convertBigIntToInt(client.accessTokenLifetime),
      }),
      this.jwtService.signAsync(
        {
          sub: payload.sub,
          scope: payload.scope,
        },
        {
          secret: this.configService.get<string>('DONATOR_JWT_REFRESH_SECRET'),
          expiresIn: convertBigIntToInt(client.refreshTokenLifetime),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string, client: DonatorClientWithScope) {
    const { sub: donatorId } = await this.jwtService.verifyAsync<{
      sub: number;
    }>(refreshToken, {
      secret: this.configService.get<string>('DONATOR_JWT_REFRESH_SECRET'),
    });
    const { scope } = this.jwtService.decode<{ scope: DonatorScopeEnum[] }>(
      refreshToken,
    );
    const donatorPaginationObject =
      await this.donatorService.findFilteredDonator({ filterId: donatorId });
    const donator = donatorPaginationObject.donators[0];
    if (!donator || !donator.refreshToken) {
      throw new ForbiddenException('Access Denied');
    }
    const refreshTokenMatches = await argon2.verify(
      donator.refreshToken,
      refreshToken,
    );
    if (!refreshTokenMatches) {
      throw new ForbiddenException('Access Denied');
    }
    const tokens = await this.getTokens(donator, client, scope);
    await this.donatorService.updateRefreshToken(
      donator.id,
      tokens.refreshToken,
    );
    return tokens;
  }

  private async validateDonator(
    mail: string,
    pass: string,
  ): Promise<DonatorWithScope | null> {
    const donatorPaginationObject =
      await this.donatorService.findFilteredDonator({ filterMail: mail });
    const donator = donatorPaginationObject.donators[0];
    if (
      !donator ||
      !(await argon2.verify(donator.password, pass + donator.salt))
    ) {
      return null;
    }
    return donator;
  }
}
