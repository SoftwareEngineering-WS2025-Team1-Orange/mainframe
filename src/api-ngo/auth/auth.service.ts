import { ForbiddenException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DonatorScopeEnum, NGOScopeEnum } from '@prisma/client';
import { NgoService } from '@/shared/services/ngo.service';
import { NGOClientWithScope, NGOWithScope } from '@/api-ngo/auth/types';
import { OAuth2PasswordDto } from '@/shared/auth/dto/auth.dto';
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
  NGOCreateOAuth2ClientDTO,
  NGOUpdateOAuth2ClientDTO,
} from '@/api-ngo/auth/dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private ngoService: NgoService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    const insertScopes = async () => {
      const inserts = [];
      Object.values(NGOScopeEnum).forEach((scope) => {
        inserts.push(
          prismaService.nGOScope.upsert({
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
    const client = await this.prismaService.nGOClient.findFirst({
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

  async registerClient(data: NGOCreateOAuth2ClientDTO) {
    const dateNow = Date.now();
    const [secret, hash] = await generateSecret(64);
    const client = await this.prismaService.nGOClient.create({
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
            name: scope as NGOScopeEnum,
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
    data: NGOUpdateOAuth2ClientDTO,
    rotateSecret: boolean,
  ) {
    const dateNow = Date.now();
    const [secret, hash] = rotateSecret
      ? await generateSecret(64)
      : [data.client_secret, undefined];
    const client = await this.prismaService.nGOClient.update({
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
            name: scope as NGOScopeEnum,
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
  ): Promise<NGOClientWithScope> {
    return (await validateClientWithScopesImpl(
      clientId,
      clientSecret,
      scope,
      this.validateClient.bind(this),
    )) as NGOClientWithScope;
  }

  async signIn(
    data: OAuth2PasswordDto,
    client: NGOClientWithScope,
    scope: NGOScopeEnum[],
  ) {
    const ngo: NGOWithScope = await this.validateNgo(
      data.username,
      data.password,
    );
    if (!ngo) {
      throw new ForbiddenException('Access Denied');
    }
    const tokens = await this.getTokens(ngo, client, scope);
    await this.ngoService.updateRefreshToken(ngo.id, tokens.refreshToken);
    return tokens;
  }

  async generateTokensFromRefreshToken(
    token: string,
    client: NGOClientWithScope,
  ) {
    return this.refreshTokens(token, client);
  }

  async logout(ngoId: number) {
    return this.ngoService.updateRefreshToken(ngoId, null);
  }

  async getTokens(
    ngo: NGOWithScope,
    client: NGOClientWithScope,
    scopes: NGOScopeEnum[],
  ) {
    validateScopes(
      scopes,
      ngo.scope.map((scope) => scope.name),
    );
    const payload = {
      email: ngo.email,
      scope: scopes,
      sub: ngo.id,
      iat: Math.floor(Date.now() / 1000),
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('NGO_JWT_ACCESS_SECRET'),
        expiresIn: convertBigIntToInt(client.accessTokenLifetime),
      }),
      this.jwtService.signAsync(
        {
          sub: payload.sub,
          scope: payload.scope,
        },
        {
          secret: this.configService.get<string>('NGO_JWT_REFRESH_SECRET'),
          expiresIn: convertBigIntToInt(client.accessTokenLifetime),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string, client: NGOClientWithScope) {
    const { sub: ngoId } = await this.jwtService.verifyAsync<{
      sub: number;
    }>(refreshToken, {
      secret: this.configService.get<string>('NGO_JWT_REFRESH_SECRET'),
    });
    const { scope } = this.jwtService.decode<{ scope: NGOScopeEnum[] }>(
      refreshToken,
    );
    const ngoPaginationObject = await this.ngoService.findFilteredNgos({
      filterId: ngoId,
    });
    const ngo = ngoPaginationObject.ngos[0];
    if (!ngo || !ngo.refreshToken) {
      throw new ForbiddenException('Access Denied');
    }
    const refreshTokenMatches = await argon2.verify(
      ngo.refreshToken,
      refreshToken,
    );
    if (!refreshTokenMatches) {
      throw new ForbiddenException('Access Denied');
    }
    const tokens = await this.getTokens(ngo, client, scope);
    await this.ngoService.updateRefreshToken(ngo.id, tokens.refreshToken);
    return tokens;
  }

  private async validateNgo(
    mail: string,
    pass: string,
  ): Promise<NGOWithScope | null> {
    const ngoPaginationObject = await this.ngoService.findFilteredNgos({
      filterMail: mail,
    });
    const ngo = ngoPaginationObject.ngos[0];
    if (!ngo || !(await argon2.verify(ngo.password, pass + ngo.salt))) {
      return null;
    }
    return ngo;
  }
}
