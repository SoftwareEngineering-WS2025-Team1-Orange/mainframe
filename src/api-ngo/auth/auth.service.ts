import { ForbiddenException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NgoService } from '@/ngo/ngo.service';
import { NGOWithPermissions } from '@/api-ngo/auth/types';
import { AuthDto } from '@/api-ngo/auth/dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private ngoService: NgoService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signIn(data: AuthDto) {
    const ngo = await this.validateNGO(data.username, data.password);
    const tokens = await this.getTokens(ngo);
    await this.ngoService.updateRefreshToken(ngo.id, tokens.refreshToken);
    return tokens;
  }

  async logout(donatorId: number) {
    return this.ngoService.updateRefreshToken(donatorId, null);
  }

  async getTokens(ngo: NGOWithPermissions) {
    const payload = {
      name: ngo.name,
      permissions: ngo.permissions.map((role) => role.name),
      sub: ngo.id,
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

  async refreshTokens(ngoId: number, refreshToken: string) {
    const ngoPaginationObject = await this.ngoService.findFilteredNgos(ngoId);
    const ngo = ngoPaginationObject.ngos[0];
    if (!ngo || !ngo) {
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

  async validateNGO(
    ngoName: string,
    pass: string,
  ): Promise<NGOWithPermissions | null> {
    const ngoPaginationObject = await this.ngoService.findFilteredNgos(
      null,
      ngoName,
    );
    const ngo = ngoPaginationObject.ngos[0];
    if (!ngo || !(await argon2.verify(pass + ngo.salt, ngo.password))) {
      return null;
    }
    return ngo;
  }
}
