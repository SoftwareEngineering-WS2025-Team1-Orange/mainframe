import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Param,
  ParseBoolPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { NGOScopeEnum } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '@/api-ngo/auth/auth.service';
import {
  DeleteOAuth2ClientDto,
  OAuth2ClientResponseDto,
  OAuth2Dto,
  OAuth2PasswordDto,
} from '@/shared/auth/dto/auth.dto';
import { NGOAccessTokenGuard } from '@/api-ngo/auth/accessToken.guard';
import { prefix } from '@/api-ngo/prefix';
import { handleOAuthFlow } from '@/utils/auth.helper';
import {
  NGOCreateOAuth2ClientDTO,
  NGOUpdateOAuth2ClientDTO,
} from '@/api-ngo/auth/dto/auth.dto';

@Controller(`${prefix}/auth`)
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  @Version('1')
  @Post('client')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: OAuth2ClientResponseDto })
  async register(@Body() data: NGOCreateOAuth2ClientDTO) {
    return this.authService.registerClient(data);
  }

  @Version('1')
  @Put('client/:client_id')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: OAuth2ClientResponseDto })
  async update(
    @Param('client_id') clientId: string,
    @Body() data: NGOUpdateOAuth2ClientDTO,
    @Query('rotate_secret', new ParseBoolPipe()) rotateSecret: boolean,
  ) {
    await this.authService.validateClient(clientId, data.client_secret);
    return this.authService.updateClient(clientId, data, rotateSecret);
  }

  @Version('1')
  @Delete('client/:client_id')
  async delete(
    @Param('client_id') clientId: string,
    @Body() data: DeleteOAuth2ClientDto,
  ) {
    await this.authService.validateClient(clientId, data.client_secret);
    return this.authService.deleteClient(clientId);
  }

  @Version('1')
  @Post('token')
  async signin(
    @Body()
    data: OAuth2Dto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const client = await this.authService.validateClientWithScopes(
      data.client_id,
      data.client_secret,
      data.scope,
    );
    return handleOAuthFlow(
      data,
      req,
      res,
      this.jwtService,
      (login_data: OAuth2PasswordDto) =>
        this.authService.signIn(
          login_data,
          client,
          data.scope as NGOScopeEnum[],
        ),
      (token: string) =>
        this.authService.generateTokensFromRefreshToken(token, client),
    );
  }

  @Version('1')
  @Post('logout')
  @UseGuards(NGOAccessTokenGuard)
  logout(@Req() req: Request) {
    const ngo = req.user as { sub: number };
    this.authService.logout(ngo.sub).catch((error) => {
      throw error;
    });
  }
}
