import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { DonationboxService } from './donationbox.service';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { RegisterDonationBoxDto } from '@/api-donator/donationbox/dto';
import { donationboxes } from '@/shared/services/database.spec';

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
            },
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
        name: 'Donationbox 1',
      };

      const updateSpy = jest
        .spyOn(prismaService.donationBox, 'update')
        .mockResolvedValue(null);

      await donationboxService.registerDonationBox(donatorId, donationBox);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { cuid: donationBox.cuid },
        data: {
          donatorId,
          name: donationBox.name,
        },
      });
    });

    it('should throw an error if the donation box is not found', async () => {
      const donatorId = 1;
      const donationBox: RegisterDonationBoxDto = {
        cuid: 'cuid123',
        name: 'Charity Box',
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
    it('should return donation boxes for the specified donator ID', async () => {
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
