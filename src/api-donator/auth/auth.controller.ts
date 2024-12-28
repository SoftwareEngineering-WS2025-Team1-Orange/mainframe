import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  Version,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '@/api-donator/auth/auth.service';
import { OAuth2Dto, OAuth2PasswordDto } from '@/shared/auth/dto/auth.dto';
import { AccessTokenGuard } from '@/shared/auth/accessToken.guard';
import { prefix } from '@/api-ngo/prefix';
import { handleOAuthFlow } from '@/utils/auth.helper';

@Controller(`${prefix}/auth`)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Version('1')
  @Post('token')
  async signin(
    @Body()
    data: OAuth2Dto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return handleOAuthFlow(
      data,
      req,
      res,
      (login_data: OAuth2PasswordDto) => this.authService.signIn(login_data),
      (token: string) => this.authService.generateTokensFromRefreshToken(token),
    );
  }

  @Version('1')
  @Post('logout')
  @UseGuards(AccessTokenGuard)
  logout(@Req() req: Request) {
    const donator = req.user as { sub: number };
    this.authService.logout(donator.sub).catch((error) => {
      throw error;
    });
  }
}
