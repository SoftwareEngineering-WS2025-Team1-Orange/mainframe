import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt } from 'passport-jwt';
import { AuthService } from '@/api-ngo/auth/auth.service';
import { JWTNGOPayload } from '@/api-ngo/auth/types';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-donator',
) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    const accessToken: string = configService.get('JWT_ACCESS_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: accessToken,
    });
  }

  validate(payload: JWTNGOPayload) {
    return payload;
  }
}
