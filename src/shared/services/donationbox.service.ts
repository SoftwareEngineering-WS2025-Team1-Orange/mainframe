import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { RegisterDonationBoxDto } from '@/api-donator/donationbox/dto';

@Injectable()
export class DonationboxService {
  constructor(private prismaService: PrismaService) {}

  async registerDonationBox(
    donatorId: number,
    donationBox: RegisterDonationBoxDto,
  ) {
    await this.prismaService.donationBox.update({
      where: {
        CUID: donationBox.cuid,
      },
      data: {
        last_status: 'AVAILABLE',
        donatorId,
        name: donationBox.name,
      },
    });
  }

  async findDonationboxesByDonatorId(donatorId: number) {
    return this.prismaService.donationBox.findMany({
      where: {
        donatorId,
      },
    });
  }
}
