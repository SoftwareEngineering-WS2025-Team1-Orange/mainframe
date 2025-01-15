import { Test, TestingModule } from '@nestjs/testing';
import { EarningService } from './earning.service';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { EarningFilter } from '@/shared/filters/earning.filter.interface';
import { SortType } from '@/utils/sort_filter.helper';
import { donationboxes, earning } from '@/shared/services/database.spec';
import { MiningPoolApiClient } from '@/clients/miningpool-api/miningpool-api.client';

describe('EarningService', () => {
  let earningService: EarningService;
  let prismaService: PrismaService;

  const expectedEarning = {
    earnings: [earning[0]],
    pagination: new Pagination(1, 1, 10, 1),
  };

  const expectedEarningFiltered = {
    earnings: [earning[0]],
    pagination: new Pagination(2, 1, 10, 1),
  };

  const expectedEarningNoFiltered = {
    earnings: earning,
    pagination: new Pagination(2, 1, 10, 1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EarningService,
        {
          provide: PrismaService,
          useValue: {
            earning: {
              count: jest.fn(),
              findMany: jest.fn(),
            },
            donationBox: {
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: MiningPoolApiClient,
          useValue: {
            getMiningPoolStats: jest.fn(),
          },
        },
      ],
    }).compile();

    earningService = module.get<EarningService>(EarningService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('findFilteredEarnings', () => {
    it('should delegate to findFilteredEarningsWithPartialRelations', async () => {
      const filters: EarningFilter = {
        filterId: 1,
        paginationPage: 1,
        paginationPageSize: 10,
      };

      const findFilteredEarningsWithPartialRelationsSpy = jest
        .spyOn(earningService, 'findFilteredEarningsWithPartialRelations')
        .mockResolvedValue(expectedEarning);

      const result = await earningService.findFilteredEarnings(filters, true);

      expect(findFilteredEarningsWithPartialRelationsSpy).toHaveBeenCalledWith(
        filters,
        { moneroMiningPayout: false, donationBox: false },
        true,
        false,
      );
      expect(result).toEqual(expectedEarning);
    });
  });

  describe('findFilteredEarningsWithPartialRelations', () => {
    it('should return filtered earnings and pagination info', async () => {
      const filters: EarningFilter = {
        filterId: 1,
        filterCreatedFrom: new Date('2024-01-13'),
        paginationPage: 1,
        paginationPageSize: 10,
        sortFor: 'amount',
        sortType: SortType.ASC,
      };

      const countSpy1 = jest
        .spyOn(prismaService.earning, 'count')
        .mockResolvedValueOnce(2); // Total count
      const countSpy2 = jest
        .spyOn(prismaService.earning, 'count')
        .mockResolvedValueOnce(1); // Filtered count
      const findManySpy1 = jest
        .spyOn(prismaService.donationBox, 'findMany')
        .mockResolvedValue([donationboxes[0]]);
      const findManySpy2 = jest
        .spyOn(prismaService.earning, 'findMany')
        .mockResolvedValue([earning[0]]);

      const result =
        await earningService.findFilteredEarningsWithPartialRelations(
          filters,
          { moneroMiningPayout: true, donationBox: true },
          true,
        );

      expect(result).toEqual(expectedEarningFiltered);
      expect(countSpy1).toHaveBeenCalled();
      expect(countSpy2).toHaveBeenCalled();
      expect(findManySpy1).toHaveBeenCalledWith({
        where: {
          donatorId: undefined,
          id: undefined,
        },
        select: {
          id: true,
        },
      });
      expect(findManySpy2).toHaveBeenCalledWith({
        where: {
          AND: [
            { id: 1 },
            {},
            {},
            { createdAt: { gte: new Date('2024-01-13') } },
            {},
            {},
            {},
          ],
        },
        ...expectedEarningFiltered.pagination.constructPaginationQueryObject(),
        include: {
          moneroMiningPayout: {
            select: { periodStart: true, timestamp: true },
          },
          donationBox: { select: { id: true, name: true, cuid: true } },
        },
        orderBy: { amountInCent: SortType.ASC },
      });
    });

    it('should handle cases with no filters', async () => {
      const filters: EarningFilter = {
        paginationPage: 1,
        paginationPageSize: 10,
      };

      const countSpy1 = jest
        .spyOn(prismaService.earning, 'count')
        .mockResolvedValueOnce(2); // Total count
      const countSpy2 = jest
        .spyOn(prismaService.earning, 'count')
        .mockResolvedValueOnce(1); // Filtered count
      const findManySpy1 = jest
        .spyOn(prismaService.donationBox, 'findMany')
        .mockResolvedValue([donationboxes[0]]);
      const findManySpy2 = jest
        .spyOn(prismaService.earning, 'findMany')
        .mockResolvedValue(earning);

      const result =
        await earningService.findFilteredEarningsWithPartialRelations(
          filters,
          { moneroMiningPayout: false, donationBox: false },
          true,
        );

      expect(result).toEqual(expectedEarningNoFiltered);
      expect(countSpy1).toHaveBeenCalled();
      expect(countSpy2).toHaveBeenCalled();
      expect(findManySpy1).toHaveBeenCalledWith({
        where: {
          donatorId: undefined,
          id: undefined,
        },
        select: {
          id: true,
        },
      });
      expect(findManySpy2).toHaveBeenCalledWith({
        where: {
          AND: [{}, {}, {}, {}, {}, {}, {}],
        },
        ...expectedEarningNoFiltered.pagination.constructPaginationQueryObject(),
        include: {
          moneroMiningPayout: undefined,
          donationBox: undefined,
        },
        orderBy: { payoutTimestamp: SortType.DESC },
      });
    });
  });

  describe('getSortField', () => {
    it('should return "payoutTimestamp" by default', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(earningService.getSortField()).toBe('payoutTimestamp');
    });

    it('should return "amountInCent" when sortFor is "amountInCent"', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(earningService.getSortField('amount')).toBe('amountInCent');
    });

    it('should return "payoutTimestamp" for unknown sortFor values', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(earningService.getSortField('unknown')).toBe('payoutTimestamp');
    });
  });
});
