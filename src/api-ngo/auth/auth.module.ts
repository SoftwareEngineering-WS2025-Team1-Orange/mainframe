import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AccessTokenStrategy } from '@/api-ngo/auth/accessToken.strategy';
import { RefreshTokenStrategy } from '@/api-ngo/auth/refreshToken.strategy';
import { AuthController } from '@/api-ngo/auth/auth.controller';
import { AuthService } from '@/api-ngo/auth/auth.service';
import { NgoService } from '@/ngo/ngo.service';

@Module({
  imports: [JwtModule.register({}), ConfigModule],
  controllers: [AuthController],
  providers: [
    AccessTokenStrategy,
    RefreshTokenStrategy,
    AuthService,
    NgoService,
  ],
})
export class AuthModule {}
