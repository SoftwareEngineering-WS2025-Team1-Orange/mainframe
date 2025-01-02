import { ForbiddenException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NgoService } from '@/shared/services/ngo.service';
import { NGOWithScope } from '@/api-ngo/auth/types';
import { OAuth2PasswordDto } from '@/shared/auth/dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private ngoService: NgoService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signIn(data: OAuth2PasswordDto) {
    const ngo: NGOWithScope = await this.validateNgo(
      data.username,
      data.password,
    );
    if (!ngo) {
      throw new ForbiddenException('Access Denied');
    }
    const tokens = await this.getTokens(ngo);
    await this.ngoService.updateRefreshToken(ngo.id, tokens.refreshToken);
    return tokens;
  }

  async generateTokensFromRefreshToken(token: string) {
    return this.refreshTokens(token);
  }

  async logout(ngoId: number) {
    return this.ngoService.updateRefreshToken(ngoId, null);
  }

  async getTokens(ngo: NGOWithScope) {
    const payload = {
      email: ngo.email,
      scope: ngo.scope.map((scope) => scope.name),
      sub: ngo.id,
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
    const { sub: ngoId } = await this.jwtService.verifyAsync<{
      sub: number;
    }>(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
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
    const tokens = await this.getTokens(ngo);
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
