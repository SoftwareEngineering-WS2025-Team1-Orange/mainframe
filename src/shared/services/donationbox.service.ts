import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { RegisterDonationBoxDto } from '@/api-donator/donationbox/dto';
import {
  calculateWorkingTimeInSeconds,
  getFirstConnectedLog,
} from '@/utils/logContainerStatus.helper';
import { EarningService } from './earning.service';
import {
  SolarStatusCodes,
  SolarStatusMessages,
} from './types/SolarStatusMessages';
import { StandardContainerNames } from './types/StandardContainerNames';

@Injectable()
export class DonationboxService {
  constructor(
    private prismaService: PrismaService,
    private earningService: EarningService,
  ) {}

  async registerDonationBox(
    donatorId: number,
    donationBox: RegisterDonationBoxDto,
  ) {
    const [existingDonator, existingDonationBox] = await Promise.all([
      this.prismaService.donator.findFirst({
        where: { donationBox: { some: { cuid: donationBox.cuid } } },
      }),
      this.prismaService.donationBox.findFirst({
        where: { cuid: donationBox.cuid },
      }),
    ]);

    if (existingDonator) {
      throw new BadRequestException(
        'DonationBox already registered to a donator.',
      );
    }
    if (!existingDonationBox) {
      throw new BadRequestException('DonationBox does not exist.');
    }

    await this.prismaService.donationBox.update({
      where: { cuid: donationBox.cuid },
      data: { donatorId, name: donationBox.name },
    });
  }

  private async getDonationboxStatus(donationBoxId: number) {
    const status = await this.prismaService.containerStatus.findFirst({
      select: {
        statusMsg: true,
      },
      where: {
        container: {
          name: StandardContainerNames.MAIN,
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
      where: {
        container: {
          name: StandardContainerNames.SOLAR_PLUGIN,
          donationBoxId,
        },
        statusCode: {
          in: [
            SolarStatusCodes.OK,
            SolarStatusCodes.ERROR,
            SolarStatusCodes.PENDING,
          ],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        statusCode: true as const,
        statusMsg: true,
      },
    });
    if (!status) {
      return SolarStatusMessages.UNINITIALIZED;
    }

    const { statusCode } = status;

    if (statusCode === (SolarStatusCodes.OK as number)) {
      return SolarStatusMessages[SolarStatusCodes.OK];
    }
    if (statusCode === (SolarStatusCodes.ERROR as number)) {
      return SolarStatusMessages[SolarStatusCodes.ERROR];
    }
    if (statusCode === (SolarStatusCodes.PENDING as number)) {
      return SolarStatusMessages[SolarStatusCodes.PENDING];
    }
    return SolarStatusMessages.UNKNOWN;
  }

  // Updates working time, currently for 14 days
  async updateAverageWorkingTime(donationBoxIds: number[]): Promise<boolean> {
    const numberOfDays = 14;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999); // End of yesterday

    const daysBefore = new Date();
    daysBefore.setDate(yesterday.getDate() - numberOfDays);
    daysBefore.setHours(0, 0, 0, 0);

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
          !donationBox.averageWorkingTimePerDayInSecondsLastUpdateAt ||
          donationBox.averageWorkingTimePerDayInSeconds == null ||
          donationBox.averageWorkingTimePerDayInSecondsLastUpdateAt <= yesterday
        ) {
          const firstConnectedLog = await getFirstConnectedLog(
            donationBox.id,
            this.prismaService,
          );

          const startDate =
            firstConnectedLog && firstConnectedLog.createdAt > daysBefore
              ? new Date(firstConnectedLog.createdAt.setHours(0, 0, 0, 0))
              : daysBefore;

          const logs = await this.prismaService.containerStatus.findMany({
            where: {
              container: {
                name: StandardContainerNames.MAIN,
                donationBoxId: donationBox.id,
              },
              createdAt: {
                gte: startDate,
                lte: yesterday,
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          });

          const totalWorkingTimeInSeconds = calculateWorkingTimeInSeconds(
            logs,
            yesterday,
          );
          const daysInPeriod = Math.ceil(
            (yesterday.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
          );

          await this.prismaService.donationBox.update({
            where: {
              id: donationBox.id,
            },
            data: {
              averageWorkingTimePerDayInSeconds: Math.round(
                totalWorkingTimeInSeconds / daysInPeriod,
              ),
              averageWorkingTimePerDayInSecondsLastUpdateAt: new Date(
                Date.now(),
              ),
            },
          });
          return true;
        }
        return false;
      }),
    );
    return updates.some(Boolean);
  }

  // Updates average income per day, currently for 14 days
  async updateAverageIncome(donationBoxIds: number[]): Promise<boolean> {
    const numberOfDays = 14;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999); // End of yesterday

    const daysBefore = new Date();
    daysBefore.setDate(yesterday.getDate() - numberOfDays);
    daysBefore.setHours(0, 0, 0, 0);

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
          !donationBox.averageIncomePerDayInCentLastUpdateAt ||
          donationBox.averageIncomePerDayInCent == null ||
          donationBox.averageIncomePerDayInCentLastUpdateAt <= yesterday
        ) {
          await this.earningService.updateEarnings([donationBox.id], true);
          const firstConnectedLog = await getFirstConnectedLog(
            donationBox.id,
            this.prismaService,
          );
          const startDate =
            firstConnectedLog && firstConnectedLog.createdAt > daysBefore
              ? new Date(firstConnectedLog.createdAt.setHours(0, 0, 0, 0))
              : daysBefore;

          const earnings = await this.prismaService.earning.findMany({
            where: {
              donationBoxId: donationBox.id,
              payoutTimestamp: {
                gte: startDate,
                lte: yesterday,
              },
            },
            select: {
              amountInCent: true,
            },
          });

          const totalIncome = earnings.reduce(
            (sum, earning) => sum + earning.amountInCent,
            0,
          );
          const daysInPeriod = Math.ceil(
            (yesterday.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
          );

          await this.prismaService.donationBox.update({
            where: {
              id: donationBox.id,
            },
            data: {
              averageIncomePerDayInCent: Math.round(totalIncome / daysInPeriod),
              averageIncomePerDayInCentLastUpdateAt: new Date(Date.now()),
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
    const [updatedWorkingTime, updatedIncome] = await Promise.all([
      this.updateAverageWorkingTime(
        donationBoxes.map((donationBox) => donationBox.id),
      ),
      this.updateAverageIncome(
        donationBoxes.map((donationBox) => donationBox.id),
      ),
    ]);
    if (updatedWorkingTime || updatedIncome) {
      donationBoxes = await this.prismaService.donationBox.findMany({
        where: {
          donatorId,
        },
        orderBy: {
          id: 'asc',
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
