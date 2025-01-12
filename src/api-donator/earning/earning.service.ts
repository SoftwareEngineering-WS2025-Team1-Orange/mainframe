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
import { EarningFilter } from '@/shared/filters/earning.filter.interface';
import { MiningPoolApiClient } from '@/clients/miningpool-api/miningpool-api.client';
import { MiningPoolApiPayoutDto } from '@/clients/miningpool-api/miningpool-api.dto';
import { convertPiconeroToCent } from '@/utils/converter_helper';

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
          const lastPayoutDate = lastPayout?.timestamp ?? new Date(0);

          const payouts: MiningPoolApiPayoutDto[] =
            await this.miningPoolApiClient.getMiningPayouts(
              donationBoxId,
              lastPayoutDate,
            );

          const sortedPayouts = [...payouts].sort((a, b) => a.ts - b.ts);
          if (sortedPayouts.length > 0) {
            await this.prismaService.$transaction(
              sortedPayouts.map((payout, index) =>
                this.prismaService.earning.create({
                  data: {
                    donationBoxId,
                    amountInCent: convertPiconeroToCent(payout.amount),
                    payoutType: PayoutTypeEnum.MONERO_MINING,
                    payoutTimestamp: new Date(payout.ts * 1000),
                    moneroMiningPayout: {
                      create: {
                        amountInPiconero: payout.amount,
                        timestamp: new Date(payout.ts * 1000),
                        lastPayoutTimestamp:
                          index === 0
                            ? new Date(payout.ts * 1000)
                            : new Date(sortedPayouts[index - 1].ts * 1000),
                        txnHash: payout.txnHash,
                        txnKey: payout.txnKey,
                      },
                    },
                  },
                }),
              ),
            );
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
        donationBox: {
          select: {
            id: true,
            name: true,
            cuid: true,
            earningsLastSuccessfullUpdateAt: true,
            earningsLastUpdateSuccessfull: true,
          },
        },
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
      case 'created_at': // Filter for timestamp
        return 'payoutTimestamp';
      case 'amount':
        return 'amount';
      default:
        return 'payoutTimestamp';
    }
  }
}
