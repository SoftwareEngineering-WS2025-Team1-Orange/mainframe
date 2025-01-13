import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccessTokenStrategy } from '@/api-ngo/auth/strategy/accessToken.strategy';
import { AuthController } from '@/api-ngo/auth/auth.controller';
import { AuthService } from '@/api-ngo/auth/auth.service';
import { NgoService } from '@/shared/services/ngo.service';
import { ProjectService } from '@/shared/services/project.service';
import { DonationService } from '@/shared/services/donation.service';
import { DonatorService } from '@/shared/services/donator.service';

@Module({
  imports: [JwtModule.register({}), PassportModule],
  controllers: [AuthController],
  providers: [
    AccessTokenStrategy,
    AuthService,
    NgoService,
    ProjectService,
    DonationService,
    DonatorService,
  ],
})
export class AuthModule {}
