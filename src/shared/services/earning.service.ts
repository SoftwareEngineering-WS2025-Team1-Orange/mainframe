import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Earning,
  MoneroMiningPayout,
  Prisma,
  PayoutTypeEnum,
} from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { getSortType, SortType } from '@/utils/sort_filter.helper';
import {
  EarningFilter,
  EarningIncludePartialRelations,
} from '@/shared/filters/earning.filter.interface';
import { EarningWithPartialRelations } from './types/EarningWithPartialRelations';
import { MiningPoolApiClient } from '@/clients/miningpool-api/miningpool-api.client';
import { MiningPoolApiPayoutDto } from '@/clients/miningpool-api/miningpool-api.dto';
import { convertPiconeroToCent } from '@/utils/converter_helper';
import { calculateWorkingTime } from '@/utils/log.helper';

@Injectable()
export class EarningService {
  constructor(
    private prismaService: PrismaService,
    private miningPoolApiClient: MiningPoolApiClient,
  ) {}

  private async getLastMoneroPayout(
    donationboxId: number,
  ): Promise<MoneroMiningPayout | null> {
    const lastPayout = await this.prismaService.moneroMiningPayout.findFirst({
      where: {
        earning: {
          donationBoxId: donationboxId,
        },
      },
      orderBy: { timestamp: 'desc' },
    });
    return lastPayout ?? null;
  }

  private async getWorkingTimePerNewPayout(
    donationBoxId: number,
    sortedPayouts: MiningPoolApiPayoutDto[],
    lastPayoutDate: Date | null,
  ) {
    return Promise.all(
      sortedPayouts.map(async (payout, index) => {
        const periodStart = await this.getPeriodStart(
          payout,
          lastPayoutDate,
          index,
          sortedPayouts,
          donationBoxId,
        );

        const logs = await this.prismaService.containerStatus.findMany({
          where: {
            container: {
              name: 'db-main',
              donationBoxId,
            },
            createdAt: {
              gte: periodStart,
              lte: new Date(payout.ts * 1000),
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        });
        const totalWorkingTime = calculateWorkingTime(
          logs,
          new Date(payout.ts * 1000),
        );
        return { totalWorkingTime, index };
      }),
    );
  }

  private getPeriodStart = async (
    payout: MiningPoolApiPayoutDto,
    lastPayoutDate: Date | null,
    index: number,
    sortedPayouts: MiningPoolApiPayoutDto[],
    donationBoxId: number,
  ) => {
    if (index === 0) {
      if (lastPayoutDate) {
        return lastPayoutDate;
      } // For first payout the "lastPayoutDate" is null, so we try to get the first "Working" log, where the container was first started
      const lastLog = await this.prismaService.containerStatus.findFirst({
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 1,
        where: {
          container: {
            name: 'db-main',
            donationBoxId,
          },
          statusMsg: 'Working',
        },
      });
      if (
        lastLog?.createdAt &&
        lastLog.createdAt < new Date(payout.ts * 1000)
      ) {
        return lastLog.createdAt;
      }
      return new Date(payout.ts * 1000);
    }
    return new Date(sortedPayouts[index - 1].ts * 1000);
  };

  private async updateEarningsWithMoneroPayouts(
    donationBoxIds: number[],
    forceEarningsUpdate: boolean = false,
  ) {
    const updatePromises = donationBoxIds.map(async (donationBoxId) => {
      try {
        const donationBox =
          await this.prismaService.donationBox.findUniqueOrThrow({
            where: { id: donationBoxId },
          });

        const shouldUpdate =
          forceEarningsUpdate ||
          !donationBox.earningsLastSuccessfullUpdateAt ||
          !donationBox.earningsLastUpdateSuccessfull ||
          Date.now() - donationBox.earningsLastSuccessfullUpdateAt.getTime() >
            1000 * 60 * 10;

        if (shouldUpdate) {
          const lastPayout = await this.getLastMoneroPayout(donationBoxId);
          const lastPayoutDate = lastPayout?.timestamp ?? null;

          const payouts: MiningPoolApiPayoutDto[] =
            await this.miningPoolApiClient.getMiningPayouts(
              donationBoxId,
              lastPayoutDate,
            );

          const sortedPayouts = [...payouts].sort((a, b) => a.ts - b.ts);

          const workingTimePerPayout = await this.getWorkingTimePerNewPayout(
            donationBoxId,
            sortedPayouts,
            lastPayoutDate,
          );
          if (sortedPayouts.length > 0) {
            await this.prismaService.$transaction(async (prisma) => {
              const promises = sortedPayouts.map(async (payout, index) => {
                const periodStart = await this.getPeriodStart(
                  payout,
                  lastPayoutDate,
                  index,
                  sortedPayouts,
                  donationBoxId,
                );
                return prisma.earning.create({
                  data: {
                    donationBoxId,
                    amountInCent: convertPiconeroToCent(payout.amount),
                    payoutType: PayoutTypeEnum.MONERO_MINING,
                    payoutTimestamp: new Date(payout.ts * 1000),
                    workingTime: workingTimePerPayout[index].totalWorkingTime,
                    moneroMiningPayout: {
                      create: {
                        amountInPiconero: payout.amount,
                        timestamp: new Date(payout.ts * 1000),
                        periodStart,
                        txnHash: payout.txnHash,
                        txnKey: payout.txnKey,
                      },
                    },
                  },
                });
              });
              return Promise.all(promises);
            });
          }
        }
        await this.prismaService.donationBox.update({
          where: { id: donationBoxId },
          data: {
            earningsLastSuccessfullUpdateAt: new Date(Date.now()),
            earningsLastUpdateSuccessfull: true,
          },
        });
      } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
          throw new NotFoundException(
            `DonationBox not found. ${donationBoxId}`,
          );
        } else {
          await this.prismaService.donationBox.update({
            where: { id: donationBoxId },
            data: {
              earningsLastUpdateSuccessfull: false,
            },
          });
        }
      }
    });
    await Promise.all(updatePromises);
  }

  public async updateEarnings(
    donationBoxIds: number[],
    forceEarningsUpdate: boolean = false,
  ) {
    return this.updateEarningsWithMoneroPayouts(
      donationBoxIds,
      forceEarningsUpdate,
    );
  }

  public async updateEarningsForDonator(
    donatorId: number,
    forceEarningsUpdate: boolean = false,
  ) {
    const donationBoxIds = await this.prismaService.donationBox.findMany({
      where: { donatorId },
      select: { id: true },
    });
    return this.updateEarnings(
      donationBoxIds.map((box) => box.id),
      forceEarningsUpdate,
    );
  }

  async findFilteredEarnings(
    filters: EarningFilter,
    paginate: boolean = true,
    forceEarningsUpdate: boolean = false,
  ): Promise<{ earnings: Earning[]; pagination: Pagination }> {
    return this.findFilteredEarningsWithPartialRelations(
      filters,
      { moneroMiningPayout: false, donationBox: false },
      paginate,
      forceEarningsUpdate,
    );
  }

  async findFilteredEarningsWithPartialRelations(
    filters: EarningFilter,
    includePartialRelations: EarningIncludePartialRelations,
    paginate: boolean = true,
    forceEarningsUpdate: boolean = false,
  ): Promise<{
    earnings: EarningWithPartialRelations[];
    pagination: Pagination;
  }> {
    const donationBoxIds = await this.prismaService.donationBox.findMany({
      where: {
        donatorId: filters.filterDonatorId ?? undefined,
        id: filters.filterDonationboxId ?? undefined,
      },
      select: {
        id: true,
      },
    });
    await this.updateEarnings(
      donationBoxIds.map((box) => box.id),
      forceEarningsUpdate,
    );
    const whereInputObject: Prisma.EarningWhereInput = {
      AND: [
        filters.filterId != null ? { id: filters.filterId } : {},
        filters.filterDonatorId != null
          ? { donationBox: { donatorId: filters.filterDonatorId } }
          : {},
        filters.filterDonationboxId != null
          ? { donationBoxId: filters.filterDonationboxId }
          : {},
        filters.filterCreatedFrom
          ? { createdAt: { gte: filters.filterCreatedFrom } }
          : {},
        filters.filterCreatedTo
          ? { createdAt: { lte: filters.filterCreatedTo } }
          : {},
        filters.filterAmountFrom
          ? { amountInCent: { gte: filters.filterAmountFrom } }
          : {},
        filters.filterAmountTo
          ? { amountInCent: { lte: filters.filterAmountTo } }
          : {},
      ],
    };

    const numTotalResults = await this.prismaService.earning.count();
    const numFilteredResults = await this.prismaService.earning.count({
      where: {
        ...whereInputObject,
      },
    });
    const pagination = new Pagination(
      numTotalResults,
      numFilteredResults,
      paginate ? filters.paginationPageSize : numFilteredResults,
      paginate ? filters.paginationPage : 1,
    );
    const earnings = await this.prismaService.earning.findMany({
      where: {
        ...whereInputObject,
      },
      ...(paginate ? pagination.constructPaginationQueryObject() : {}),
      include: {
        moneroMiningPayout: includePartialRelations.moneroMiningPayout
          ? {
              select: {
                timestamp: true,
                periodStart: true,
              },
            }
          : undefined,
        donationBox: includePartialRelations.donationBox
          ? {
              select: {
                id: true,
                name: true,
                cuid: true,
              },
            }
          : undefined,
      },
      orderBy: {
        [this.getSortField(filters.sortFor)]: getSortType(
          filters.sortType,
          SortType.DESC,
        ),
      },
    });
    return { earnings, pagination };
  }

  private getSortField(sortFor?: string): string {
    switch (sortFor) {
      case 'created_at':
        return 'createdAt';
      case 'amount':
        return 'amountInCent';
      case 'payoutTimestamp':
      default:
        return 'payoutTimestamp';
    }
  }
}
