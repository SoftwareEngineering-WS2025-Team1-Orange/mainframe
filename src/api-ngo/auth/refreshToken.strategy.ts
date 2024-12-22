import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@/api-ngo/auth/auth.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-ngo',
) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    const refreshToken: string = configService.get('JWT_REFRESH_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: refreshToken,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: object) {
    const refreshToken = req.headers
      .get('Authorization')
      .replace('Bearer', '')
      .trim();
    return { ...payload, refreshToken };
  }
}
