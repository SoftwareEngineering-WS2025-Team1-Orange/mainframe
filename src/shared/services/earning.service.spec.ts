import { Test, TestingModule } from '@nestjs/testing';
import { EarningService } from './earning.service';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { EarningFilter } from '@/shared/filters/earning.filter.interface';
import { SortType } from '@/utils/sort_filter.helper';
import { earning } from '@/shared/services/database.spec';

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
        { payout: false, donationBox: false },
        true,
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
      const findManySpy = jest
        .spyOn(prismaService.earning, 'findMany')
        .mockResolvedValue([earning[0]]);

      const result =
        await earningService.findFilteredEarningsWithPartialRelations(
          filters,
          { payout: true, donationBox: true },
          true,
        );

      expect(result).toEqual(expectedEarningFiltered);
      expect(countSpy1).toHaveBeenCalled();
      expect(countSpy2).toHaveBeenCalled();
      expect(findManySpy).toHaveBeenCalledWith({
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
          payout: { select: { periodStart: true, periodEnd: true } },
          donationBox: { select: { id: true, name: true, cuid: true } },
        },
        orderBy: { amount: SortType.ASC },
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
      const findManySpy = jest
        .spyOn(prismaService.earning, 'findMany')
        .mockResolvedValue(earning);

      const result =
        await earningService.findFilteredEarningsWithPartialRelations(
          filters,
          { payout: false, donationBox: false },
          true,
        );

      expect(result).toEqual(expectedEarningNoFiltered);
      expect(countSpy1).toHaveBeenCalled();
      expect(countSpy2).toHaveBeenCalled();
      expect(findManySpy).toHaveBeenCalledWith({
        where: {
          AND: [{}, {}, {}, {}, {}, {}, {}],
        },
        ...expectedEarningNoFiltered.pagination.constructPaginationQueryObject(),
        include: {
          payout: undefined,
          donationBox: undefined,
        },
        orderBy: { createdAt: SortType.DESC },
      });
    });
  });

  describe('getSortField', () => {
    it('should return "createdAt" by default', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(earningService.getSortField()).toBe('createdAt');
    });

    it('should return "amount" when sortFor is "amount"', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(earningService.getSortField('amount')).toBe('amount');
    });

    it('should return "createdAt" for unknown sortFor values', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(earningService.getSortField('unknown')).toBe('createdAt');
    });
  });
});
