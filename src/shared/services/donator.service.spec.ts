import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { DonatorService } from './donator.service';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { donation, donator, earning } from '@/shared/services/database.spec';
import { Pagination } from '@/utils/pagination/pagination.helper';

describe('DonatorService', () => {
  let donatorService: DonatorService;
  let prismaService: PrismaService;

  const expectedDonator = {
    donators: [donator[0]],
    pagination: new Pagination(1, 1, 10, 1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonatorService,
        {
          provide: PrismaService,
          useValue: {
            donator: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
              findMany: jest.fn(),
              aggregate: jest.fn(),
            },
            earning: {
              aggregate: jest.fn(),
            },
            donation: {
              aggregate: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    donatorService = module.get<DonatorService>(DonatorService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('findDonatorByIdWithBalance', () => {
    it('should return donator with balance', async () => {
      const balance = 500;
      const findDonatorByIdSpy = jest
        .spyOn(donatorService, 'findDonatorById')
        .mockResolvedValue(donator[0]);

      const calculateDonatorBalanceSpy = jest
        .spyOn(donatorService, 'calculateDonatorBalance')
        .mockResolvedValue(earning[0].amount - donation[0].amount);

      const result = await donatorService.findDonatorByIdWithBalance(1);

      expect(result).toEqual({ balance, ...donator[0] });
      expect(findDonatorByIdSpy).toHaveBeenCalledWith(1);
      expect(calculateDonatorBalanceSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('findDonatorById', () => {
    it('should return the donator if found', async () => {
      const firstFindSpy = jest
        .spyOn(prismaService.donator, 'findFirst')
        .mockResolvedValue(donator[0]);

      const result = await donatorService.findDonatorById(1);

      expect(result).toEqual(donator[0]);
      expect(firstFindSpy).toHaveBeenCalled();
    });

    it('should throw NotFoundException if donator not found', async () => {
      jest.spyOn(prismaService.donator, 'findFirst').mockResolvedValue(null);

      await expect(donatorService.findDonatorById(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findFilteredDonator', () => {
    it('should return donators that were selected by the filter', async () => {
      const filters = {
        filterId: 1,
        filterDonatorId: 1,
        filterDonatorFirstName: 'John',
        filterDonatorLastName: 'Doe',
      };

      const countSpy = jest
        .spyOn(prismaService.donator, 'count')
        .mockResolvedValue(1);

      // Spy of PrismaService.donation.findMany
      const findManySpy = jest
        .spyOn(prismaService.donator, 'findMany')
        .mockResolvedValue([donator[0]]);

      const result = await donatorService.findFilteredDonator(filters);

      expect(result).toBeDefined();
      expect(result).toEqual(expectedDonator);
      expect(findManySpy).toHaveBeenCalled();
      expect(countSpy).toHaveBeenCalled();
    });
  });

  describe('updateDonator', () => {
    it('should update the donator', async () => {
      const id = 1;
      const updateSpy = jest
        .spyOn(prismaService.donator, 'update')
        .mockResolvedValue({
          ...donator[0],
          firstName: 'John1',
          lastName: 'Doe1',
          scope: [],
        } as never);

      const updateDto = {
        firstName: 'John1',
        lastName: 'Doe1',
      };

      const result = await donatorService.updateDonator(id, updateDto);

      expect(result).toEqual({
        ...donator[0],
        firstName: 'John1',
        lastName: 'Doe1',
        scope: [],
      });
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id, deletedAt: null },
        include: {
          scope: true,
        },
        data: updateDto,
      });
    });

    it('should throw NotFoundException if donator not found', async () => {
      jest.spyOn(prismaService.donator, 'update').mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('error', {
          code: 'P2025',
          meta: {},
          clientVersion: '2.20.0',
        }),
      );

      await expect(donatorService.updateDonator(1, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateRefreshToken', () => {
    it('should hash the refresh token and update', async () => {
      const id = 1;
      const refreshToken = 'test-refresh-token';
      const hashedRefreshToken = await argon2.hash(refreshToken);

      jest.spyOn(argon2, 'hash').mockResolvedValue(hashedRefreshToken);
      const updateSpy = jest
        .spyOn(prismaService.donator, 'update')
        .mockResolvedValue({ id } as never);

      await donatorService.updateRefreshToken(id, refreshToken);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id, deletedAt: null },
        data: { refreshToken: hashedRefreshToken },
      });
    });

    it('should set refreshToken to null if null is provided', async () => {
      const id = 1;

      const updateSpy = jest
        .spyOn(prismaService.donator, 'update')
        .mockResolvedValue({ id } as never);

      await donatorService.updateRefreshToken(id, null);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id, deletedAt: null },
        data: { refreshToken: null },
      });
    });
  });

  describe('createDonator', () => {
    it('should hash the password, add default roles, and create a donator', async () => {
      const createDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@doe.com',
        password: 'MySecretPassw0rd!',
      };

      const salt = randomBytes(16).toString('hex');
      const hashedPassword = await argon2.hash(createDto.password + salt);

      jest.spyOn(argon2, 'hash').mockResolvedValue(hashedPassword);
      jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn<any, any>(donatorService, 'createSalt')
        .mockReturnValue(salt);

      const createSpy = jest
        .spyOn(prismaService.donator, 'create')
        .mockResolvedValue(donator[0]);

      const result = await donatorService.createDonator(createDto);

      expect(result).toEqual(donator[0]);
      expect(createSpy).toHaveBeenCalledWith({
        data: {
          ...createDto,
          password: hashedPassword,
          salt,
          scope: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            connect: expect.any(Array),
          },
        },
      });
    });
  });

  describe('deleteDonator', () => {
    it('should soft delete the donator if balance is zero', async () => {
      const calculateDonatorBalanceSpy = jest
        .spyOn(donatorService, 'calculateDonatorBalance')
        .mockResolvedValue(0);

      const updateSpy = jest
        .spyOn(prismaService.donator, 'update')
        .mockResolvedValue(donator[0]);

      await donatorService.deleteDonator(1);

      expect(updateSpy).toHaveBeenCalledWith({
        where: {
          id: 1,
          deletedAt: null,
          donationBox: { none: {} },
        },
        data: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          deletedAt: expect.any(Date),
          refreshToken: null,
          firstName: 'Deleted-1',
          lastName: 'Deleted-1',
          email: 'Deleted-1',
        },
        include: {
          scope: true,
        },
      });
      expect(calculateDonatorBalanceSpy).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException if donator has remaining balance', async () => {
      const calculateDonatorBalanceSpy = jest
        .spyOn(donatorService, 'calculateDonatorBalance')
        .mockResolvedValue(earning[0].amount - donation[0].amount);

      await expect(donatorService.deleteDonator(1)).rejects.toThrow(
        BadRequestException,
      );
      expect(calculateDonatorBalanceSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('calculateDonatorBalance', () => {
    it('should calculate balance correctly', async () => {
      const earnings = { _sum: { amount: 600 } };
      const donations = { _sum: { amount: 500 } };

      const earningAggSpy = jest
        .spyOn(prismaService.earning, 'aggregate')
        .mockResolvedValue(earnings as never);
      const donationAggSpy = jest
        .spyOn(prismaService.donation, 'aggregate')
        .mockResolvedValue(donations as never);

      const result = await donatorService.calculateDonatorBalance(1);

      expect(result).toEqual(100);
      expect(earningAggSpy).toHaveBeenCalledWith({
        _sum: {
          amount: true,
        },
        where: {
          donationBox: {
            donatorId: 1,
          },
        },
      });
      expect(donationAggSpy).toHaveBeenCalledWith({
        _sum: {
          amount: true,
        },
        where: {
          donatorId: 1,
        },
      });
    });
  });
});
