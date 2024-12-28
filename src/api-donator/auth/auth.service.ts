import { ForbiddenException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DonatorService } from '@/shared/services/donator.service';
import { DonatorWithScope } from '@/api-donator/auth/types';
import { OAuth2PasswordDto } from '@/shared/auth/dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private donatorService: DonatorService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signIn(data: OAuth2PasswordDto) {
    const donator: DonatorWithScope = await this.validateDonator(
      data.username,
      data.password,
    );
    if (!donator) {
      throw new ForbiddenException('Access Denied');
    }
    const tokens = await this.getTokens(donator);
    await this.donatorService.updateRefreshToken(
      donator.id,
      tokens.refreshToken,
    );
    return tokens;
  }

  async generateTokensFromRefreshToken(token: string) {
    return this.refreshTokens(token);
  }

  async logout(donatorId: number) {
    return this.donatorService.updateRefreshToken(donatorId, null);
  }

  async getTokens(donator: DonatorWithScope) {
    const payload = {
      email: donator.email,
      scope: donator.scope.map((scope) => scope.name),
      sub: donator.id,
      iat: Math.floor(Date.now() / 1000),
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '5m',
      }),
      this.jwtService.signAsync(
        {
          sub: payload.sub,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    const { sub: donatorId } = await this.jwtService.verifyAsync<{
      sub: number;
    }>(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
    const donatorPaginationObject =
      await this.donatorService.findFilteredDonator(donatorId);
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
    const tokens = await this.getTokens(donator);
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
      await this.donatorService.findFilteredDonator(null, mail);
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
