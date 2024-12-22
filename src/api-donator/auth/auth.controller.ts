import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';
import { AuthService } from '@/api-donator/auth/auth.service';
import { AuthDto } from '@/api-donator/auth/dto/auth.dto';
import { AccessTokenGuard } from '@/api-donator/auth/accessToken.guard';

@Controller('api-donator/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Version('1')
  @Post('token')
  signin(@Body() data: AuthDto) {
    return this.authService.signIn(data);
  }

  @Version('1')
  @Post('logout')
  @UseGuards(AccessTokenGuard)
  logout(@Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.authService.logout(req.user.sub).catch(() => {});
  }
}
