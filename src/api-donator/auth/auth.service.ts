import { ForbiddenException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DonatorService } from '@/donator/donator.service';
import { DonatorWithPermissions } from '@/api-donator/auth/types';
import { AuthDto } from '@/api-donator/auth/dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private donatorService: DonatorService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signIn(data: AuthDto) {
    const donator = await this.validateDonator(data.username, data.password);
    const tokens = await this.getTokens(donator);
    await this.donatorService.updateRefreshToken(
      donator.id,
      tokens.refreshToken,
    );
    return tokens;
  }

  async logout(donatorId: number) {
    return this.donatorService.updateRefreshToken(donatorId, null);
  }

  async getTokens(donator: DonatorWithPermissions) {
    const payload = {
      email: donator.email,
      permissions: donator.permissions.map((role) => role.name),
      sub: donator.id,
      iat: Date.now(),
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

  async refreshTokens(donatorId: number, refreshToken: string) {
    const donatorPaginationObject =
      await this.donatorService.findFilteredDonator(donatorId);
    const donator = donatorPaginationObject.donators[0];
    if (!donator || !donator) {
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
  ): Promise<DonatorWithPermissions | null> {
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
