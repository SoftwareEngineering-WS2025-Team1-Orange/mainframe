import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DonationService } from './donation.service';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { DonatorService } from '@/shared/services/donator.service';
import { donation, earning } from '@/shared/services/database.spec';
import { Pagination } from '@/utils/pagination/pagination.helper';

describe('DonationService', () => {
  let donationService: DonationService;
  let prismaService: PrismaService;

  const expectedDonation = {
    donations: [donation[0]],
    pagination: new Pagination(1, 1, 10, 1),
  };

  const calculateDonatorBalanceSpy = jest.fn(
    async () => earning[0].amount - donation[0].amount,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationService,
        {
          provide: PrismaService,
          useValue: {
            donation: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            nGO: {
              findFirstOrThrow: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: DonatorService,
          useValue: {
            calculateDonatorBalance: jest.fn(async () =>
              calculateDonatorBalanceSpy(),
            ),
          },
        },
      ],
    }).compile();
    donationService = module.get<DonationService>(DonationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(donationService).toBeDefined();
  });

  describe('findFilteredDonations', () => {
    it('should return donations without partial relations', async () => {
      const filters = {
        filterId: 1,
        filterDonatorId: 1,
        filterDonatorFirstName: 'John',
        filterDonatorLastName: 'Doe',
      };
      const paginate = true;

      const findFilteredDonationsSpy = jest
        .spyOn(donationService, 'findFilteredDonationsWithPartialRelations')
        .mockResolvedValue(expectedDonation);

      const result = await donationService.findFilteredDonations(
        filters,
        paginate,
      );

      expect(result).toBeDefined();
      expect(result).toEqual(expectedDonation);
      expect(findFilteredDonationsSpy).toHaveBeenCalledWith(
        filters,
        { donator: false, ngo: false, project: false },
        paginate,
      );
    });
  });

  describe('findFilteredDonations', () => {
    it('should return donations that were selected by the filter', async () => {
      const filters = {
        filterId: 1,
        filterDonatorId: 1,
        filterDonatorFirstName: 'John',
        filterDonatorLastName: 'Doe',
      };
      const paginate = true;

      const countSpy = jest
        .spyOn(prismaService.donation, 'count')
        .mockResolvedValue(1);

      // Spy of PrismaService.donation.findMany
      const findManySpy = jest
        .spyOn(prismaService.donation, 'findMany')
        .mockResolvedValue([donation[0]]);

      const result = await donationService.findFilteredDonations(
        filters,
        paginate,
      );

      expect(result).toBeDefined();
      expect(result).toEqual(expectedDonation);
      expect(findManySpy).toHaveBeenCalled();
      expect(countSpy).toHaveBeenCalled();
    });
  });

  describe('createDonationToProject', () => {
    it('should return donations that were selected by the filter', async () => {
      const donatorId = 1;
      const projectId = 1;
      const amount = 500;

      const findFirstOrThrownSpy = jest
        .spyOn(prismaService.nGO, 'findFirstOrThrow')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        .mockResolvedValue(1);

      const transactionSpy = jest
        .spyOn(prismaService, '$transaction')
        .mockResolvedValue([donation[0], amount]);

      const findFilteredDonationsWithPartialRelationsSpy = jest
        .spyOn(donationService, 'findFilteredDonationsWithPartialRelations')
        .mockResolvedValue(expectedDonation);

      const result = await donationService.createDonationToProject(
        donatorId,
        projectId,
        amount,
      );

      expect(result).toBeDefined();
      expect(result).toEqual({ ...donation[0], newBalance: amount });
      expect(findFirstOrThrownSpy).toHaveBeenCalled();
      expect(transactionSpy).toHaveBeenCalled();
      expect(calculateDonatorBalanceSpy).toHaveBeenCalled();
      expect(findFilteredDonationsWithPartialRelationsSpy).toHaveBeenCalledWith(
        { filterId: donatorId },
        { donator: false, ngo: true, project: true },
      );
    });
  });

  describe('createDonationToNgo', () => {
    it('should return donations that were selected by the filter', async () => {
      const donatorId = 1;
      const ngoId = 1;
      const amount = 500;

      const transactionSpy = jest
        .spyOn(prismaService, '$transaction')
        .mockResolvedValue([donation[0], amount]);

      const findFilteredDonationsWithPartialRelationsSpy = jest
        .spyOn(donationService, 'findFilteredDonationsWithPartialRelations')
        .mockResolvedValue(expectedDonation);

      const result = await donationService.createDonationToNgo(
        donatorId,
        ngoId,
        amount,
      );

      expect(result).toBeDefined();
      expect(result).toEqual({ ...donation[0], newBalance: amount });
      expect(transactionSpy).toHaveBeenCalled();
      expect(findFilteredDonationsWithPartialRelationsSpy).toHaveBeenCalledWith(
        { filterId: donatorId },
        { donator: false, ngo: true, project: true },
      );
    });

    it('should throw if balance less then 0', async () => {
      const donatorId = 1;
      const ngoId = 1;
      const amount = -10;

      const action = async () => {
        await donationService.createDonationToNgo(donatorId, ngoId, amount);
      };

      await expect(action).rejects.toThrow(BadRequestException);
    });

    it('should throw if balance less then 0', async () => {
      const donatorId = 1;
      const ngoId = 2;
      const amount = 10;

      // Throw erroe
      const transactionSpy = jest
        .spyOn(prismaService, '$transaction')
        .mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('error', {
            code: 'P2025',
            meta: {},
            clientVersion: '2.20.0',
          }),
        );

      const action = async () => {
        await donationService.createDonationToNgo(donatorId, ngoId, amount);
      };
      await expect(action).rejects.toThrow(NotFoundException);
      expect(transactionSpy).toHaveBeenCalled();
    });
  });
});
