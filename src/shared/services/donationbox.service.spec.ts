import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { DonationboxService } from './donationbox.service';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { RegisterDonationBoxDto } from '@/api-donator/donationbox/dto';
import { donationboxes } from '@/shared/services/database.spec';
import { EarningService } from '@/shared/services/earning.service';

describe('DonationboxService', () => {
  let donationboxService: DonationboxService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationboxService,
        {
          provide: PrismaService,
          useValue: {
            donationBox: {
              update: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
            containerStatus: {
              findFirst: jest.fn(),
              findMany: jest.fn((_el) => []),
            },
            earning: {
              findMany: jest.fn((_el) => []),
            },
            donator: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: EarningService,
          useValue: {
            updateEarnings: jest.fn(),
          },
        },
      ],
    }).compile();

    donationboxService = module.get<DonationboxService>(DonationboxService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('registerDonationBox', () => {
    it('should successfully register a donation box', async () => {
      const donatorId = 1;

      const donationBox: RegisterDonationBoxDto = {
        cuid: 'vkebp3z3acle03b72w72t503',
        name: 'Donation Box 1',
      };

      const updateSpy = jest
        .spyOn(prismaService.donationBox, 'update')
        .mockResolvedValue(null);

      jest.spyOn(prismaService.donator, 'findFirst').mockResolvedValue(null);

      jest
        .spyOn(prismaService.donationBox, 'findFirst')
        .mockResolvedValue(donationboxes[0]);

      await donationboxService.registerDonationBox(donatorId, donationBox);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { cuid: donationboxes[0].cuid },
        data: {
          donatorId,
          name: donationboxes[0].name,
        },
      });
    });

    it('should throw an error if the donation box is not found', async () => {
      const donatorId = 1;
      const donationBox: RegisterDonationBoxDto = {
        cuid: 'vkebp3z3acle03b72w72t503',
        name: 'Donation Box 1',
      };

      jest.spyOn(prismaService.donationBox, 'update').mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('error', {
          code: 'P2025',
          meta: {},
          clientVersion: '2.20.0',
        }),
      );

      await expect(
        donationboxService.registerDonationBox(donatorId, donationBox),
      ).rejects.toThrow(Error);
    });
  });

  describe('findDonationboxesByDonatorId', () => {
    it('should return donation boxes for the specified donator ID for no containerStatus and no earnings', async () => {
      const donatorId = 1;

      const findMaySpy = jest
        .spyOn(prismaService.donationBox, 'findMany')
        .mockResolvedValue(donationboxes);

      const result =
        await donationboxService.findDonationboxesByDonatorId(donatorId);

      expect(result).toEqual(donationboxes);
      expect(findMaySpy).toHaveBeenCalledWith({
        where: { donatorId },
      });
    });

    it('should return an empty array if no donation boxes are found', async () => {
      const donatorId = 1;

      const findManySpy = jest
        .spyOn(prismaService.donationBox, 'findMany')
        .mockResolvedValue([]);

      const result =
        await donationboxService.findDonationboxesByDonatorId(donatorId);

      expect(result).toEqual([]);
      expect(findManySpy).toHaveBeenCalledWith({
        where: { donatorId },
      });
    });
  });
});
