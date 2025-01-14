import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { RegisterDonationBoxDto } from '@/api-donator/donationbox/dto';
import { calculateWorkingTime } from '@/utils/log.helper';

@Injectable()
export class DonationboxService {
  constructor(private prismaService: PrismaService) {}

  async registerDonationBox(
    donatorId: number,
    donationBox: RegisterDonationBoxDto,
  ) {
    await this.prismaService.donationBox.update({
      where: {
        cuid: donationBox.cuid,
      },
      data: {
        donatorId,
        name: donationBox.name,
      },
    });
  }

  private async getDonationboxStatus(donationBoxId: number) {
    const status = await this.prismaService.containerStatus.findFirst({
      select: {
        statusMsg: true,
      },
      where: {
        container: {
          name: 'db-main',
          donationBoxId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return status?.statusMsg ?? 'Disconnected';
  }

  private async getSolarStatusForDonationBox(
    donationBoxId: number,
  ): Promise<string> {
    const status = await this.prismaService.containerStatus.findFirst({
      take: 1,
      where: {
        container: {
          name: 'pluginContainer',
          donationBoxId,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        statusCode: true,
        statusMsg: true,
      },
    });
    if (!status) {
      return 'ERROR';
    }
    if (status?.statusCode === 0) {
      if (status?.statusMsg === 'RUNNING') {
        return 'Connected';
      }

      return 'ERROR';
    }
    if (status?.statusCode === 400) {
      return 'ERROR';
    }
    if (status?.statusCode === 401) {
      return 'UNAUTHORIZED';
    }
    return 'UNKNOWN_STATUS';
  }

  async updateSevenDaysAverageWorkingTime(
    donationBoxIds: number[],
  ): Promise<boolean> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999); // End of yesterday

    const sevenDaysBefore = new Date(yesterday);
    sevenDaysBefore.setDate(yesterday.getDate() - 7);
    sevenDaysBefore.setHours(0, 0, 0, 0); // Start of 7 days before

    const donationBoxes = await this.prismaService.donationBox.findMany({
      where: {
        id: {
          in: donationBoxIds,
        },
      },
    });

    const updates = await Promise.all(
      donationBoxes.map(async (donationBox) => {
        if (
          !donationBox.averageWorkingTimeLastSevenDaysLastUpdateAt ||
          !donationBox.averageWorkingTimeLastSevenDays ||
          donationBox.averageWorkingTimeLastSevenDaysLastUpdateAt <= yesterday
        ) {
          const logs = await this.prismaService.containerStatus.findMany({
            where: {
              container: {
                name: 'db-main',
                donationBoxId: donationBox.id,
              },
              createdAt: {
                gte: sevenDaysBefore,
                lte: yesterday,
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          });

          const totalWorkingTime = calculateWorkingTime(logs, yesterday);

          await this.prismaService.donationBox.update({
            where: {
              id: donationBox.id,
            },
            data: {
              averageWorkingTimeLastSevenDays: totalWorkingTime,
              averageWorkingTimeLastSevenDaysLastUpdateAt: new Date(Date.now()),
            },
          });

          return true;
        }
        return false;
      }),
    );

    return updates.some(Boolean);
  }

  async findDonationboxesWithStatusesByDonatorId(donatorId: number) {
    const donationBoxes = await this.findDonationboxesByDonatorId(donatorId);
    const donationBoxesWithStatuses = await Promise.all(
      donationBoxes.map(async (donationBox) => {
        const status = await this.getDonationboxStatus(donationBox.id);
        const solarStatus: string = await this.getSolarStatusForDonationBox(
          donationBox.id,
        );
        return {
          ...donationBox,
          status,
          solarStatus,
        };
      }),
    );
    return donationBoxesWithStatuses;
  }

  async findDonationboxesByDonatorId(donatorId: number) {
    let donationBoxes = await this.prismaService.donationBox.findMany({
      where: {
        donatorId,
      },
    });
    const updated = await this.updateSevenDaysAverageWorkingTime(
      donationBoxes.map((donationBox) => donationBox.id),
    );
    if (updated) {
      donationBoxes = await this.prismaService.donationBox.findMany({
        where: {
          donatorId,
        },
      });
    }
    return donationBoxes.map((box) => ({
      ...box,
      lastSolarData:
        typeof box.lastSolarData === 'string'
          ? (JSON.parse(box.lastSolarData) as Record<string, unknown>)
          : box.lastSolarData,
    }));
  }
}
