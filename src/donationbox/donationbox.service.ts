import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtDonationBoxDto } from '@/donationbox/dto/jwt.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DonationboxService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {}

  async verifyToken(jwtDto: JwtDonationBoxDto) {
    const { token } = jwtDto;
    try {
      // Verify JWT token
      await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch {
      return null;
    }

    // Check if donation box is active
    const donationbox = await this.prismaService.donationBox.findFirst({
      where: {
        CUID: token,
      },
    });

    const status = ['UNAVAILABLE', 'UNINITIALIZED'];
    if (!donationbox || status.includes(donationbox.last_status)) {
      return null;
    }

    return token;
  }
}
