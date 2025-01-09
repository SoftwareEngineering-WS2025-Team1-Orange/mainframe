import { Injectable, NotFoundException } from '@nestjs/common';
import { Earning, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { getSortType, SortType } from '@/utils/sort_filter.helper';
import { EarningFilter } from '@/shared/filters/earning.filter.interface';
import { MiningPoolApiClient } from '@/clients/miningpool-api/miningpool-api.client';
import { MiningPoolApiRewardDto } from '@/clients/miningpool-api/miningpool-api.dto';

@Injectable()
export class EarningService {
  constructor(
    private prismaService: PrismaService,
    private miningPoolApiClient: MiningPoolApiClient,
  ) {}

  private async getLastEarning(donationboxId: number): Promise<Earning | null> {
    const lastReward = await this.prismaService.earning.findFirst({
      where: {
        donationBoxId: donationboxId,
      },
      orderBy: { timestamp: 'desc' },
    });
    return lastReward ?? null;
  }

  private async updateEarnings(
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
            1000 * 60 * 5;

        if (shouldUpdate) {
          const lastEarning = await this.getLastEarning(donationBoxId);
          const lastRewardDate = lastEarning?.timestamp ?? new Date(0);
          const earnings: MiningPoolApiRewardDto[] =
            await this.miningPoolApiClient.getMiningRewards(
              donationBoxId,
              lastRewardDate,
            );

          const sortedEarnings = [...earnings].sort((a, b) => a.ts - b.ts);

          if (sortedEarnings.length > 0) {
            await this.prismaService.earning.createMany({
              data: sortedEarnings.map((reward, index) => ({
                blockHeight: reward.height,
                donationBoxId,
                timestamp: new Date(reward.ts * 1000),
                lastEarningTimeStamp:
                  index === 0
                    ? (lastEarning?.timestamp ?? new Date(reward.ts * 1000))
                    : new Date(sortedEarnings[index - 1].ts * 1000),
                amount: reward.amt,
              })),
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
          ? { amount: { gte: filters.filterAmountFrom } }
          : {},
        filters.filterAmountTo
          ? { amount: { lte: filters.filterAmountTo } }
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
        return 'timestamp';
      case 'amount':
        return 'amount';
      default:
        return 'timestamp';
    }
  }
}
