import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccessTokenStrategy } from '@/shared/auth/strategy/accessToken.strategy';
import { RefreshTokenStrategy } from '@/shared/auth/strategy/refreshToken.strategy';
import { AuthController } from '@/api-ngo/auth/auth.controller';
import { AuthService } from '@/api-ngo/auth/auth.service';
import { NgoService } from '@/shared/services/ngo.service';
import { ProjectService } from '@/shared/services/project.service';

@Module({
  imports: [JwtModule.register({}), PassportModule],
  controllers: [AuthController],
  providers: [
    AccessTokenStrategy,
    RefreshTokenStrategy,
    AuthService,
    NgoService,
    ProjectService,
  ],
})
export class AuthModule {}
