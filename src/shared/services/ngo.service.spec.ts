import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { StatusCodes } from 'http-status-codes';
import { NGOScopeEnum, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { donator, ngo, project } from '@/shared/services/database.spec';
import { Pagination } from '@/utils/pagination/pagination.helper';
import { NgoService } from './ngo.service';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { ProjectService } from '@/shared/services/project.service';

describe('NgoService', () => {
  let ngoService: NgoService;
  let prismaService: jest.Mocked<PrismaService>;
  let projectService: jest.Mocked<ProjectService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NgoService,
        {
          provide: PrismaService,
          useValue: {
            nGO: {
              findFirst: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              count: jest.fn(),
            },
            donator: {
              findFirstOrThrow: jest.fn(),
            },
          },
        },
        {
          provide: ProjectService,
          useValue: {
            findFilteredProjects: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: 'MINIO_CONNECTION',
          useValue: {
            bucketExists: jest.fn(),
            makeBucket: jest.fn(),
            setBucketPolicy: jest.fn(),
            putObject: jest.fn(),
            removeObject: jest.fn(),
          },
        },
      ],
    }).compile();

    ngoService = module.get<NgoService>(NgoService);
    prismaService = module.get(PrismaService);
    projectService = module.get(ProjectService);
  });

  describe('findNgoByIdWithProjectFilter', () => {
    it('should return an NGO with all projects when no project filter is provided', async () => {
      const findFirstSpy = jest
        .spyOn(prismaService.nGO, 'findFirst')
        .mockResolvedValue({
          ...ngo[0],
          scope: [
            {
              name: NGOScopeEnum.WRITE_NGO,
              id: 1,
              nGOClientId: '1',
            },
          ],
        } as never);

      const result = await ngoService.findNgoByIdWithProjectFilter(1);
      expect(findFirstSpy).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
        include: { scope: true },
      });
      expect(result).toEqual({
        ...ngo[0],
        scope: [NGOScopeEnum.WRITE_NGO],
      });
    });

    it('should throw a NotFoundException when the NGO is not found', async () => {
      const findFirstSpy = jest
        .spyOn(prismaService.nGO, 'findFirst')
        .mockResolvedValue(null);

      await expect(ngoService.findNgoByIdWithProjectFilter(1)).rejects.toThrow(
        new HttpException('NGO not found', StatusCodes.NOT_FOUND),
      );
      expect(findFirstSpy).toHaveBeenCalled();
    });

    it('should return an NGO with projects when a project filter is provided', async () => {
      const mockNgo = {
        ...ngo[0],
        scope: [
          {
            name: NGOScopeEnum.WRITE_NGO,
            id: 1,
            nGOClientId: '1',
          },
        ],
      };

      const mockProjects = {
        projects: project,
        pagination: new Pagination(1, 1, 10, 1),
      };

      const filter = {
        filterName: 'Project 1',
        paginationPage: 1,
        paginationPageSize: 10,
        sortFor: 'name',
        sortType: 'asc',
      };

      const findFirstSpy = jest
        .spyOn(prismaService.nGO, 'findFirst')
        .mockResolvedValue(mockNgo);

      const findFilteredProjectsSpy = jest
        .spyOn(projectService, 'findFilteredProjects')
        .mockResolvedValue(mockProjects);

      const result = await ngoService.findNgoByIdWithProjectFilter(1, filter);

      expect(result).toEqual({
        ...mockNgo,
        scope: ['WRITE_NGO'],
        projects: mockProjects,
      });

      expect(findFirstSpy).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
        include: { scope: true },
      });

      expect(findFilteredProjectsSpy).toHaveBeenCalledWith({
        ...filter,
        filterNgoId: 1,
      });
    });
  });

  describe('createNgo', () => {
    it('should create a new NGO and return it', async () => {
      const mockNgo = {
        id: 1,
        name: 'NGO 1',
        email: 'john@doe.com',
        contact: 'Test Contact',
        website_url: 'https://www.test.com',
        description: 'Test Description',
        banner_uri: 'https://www.test.com',
        address: 'Test Address',
        password: 'MySecretPassw0rd!',
        salt: 'c49632f256a8767fc963dec9aac3381e',
      };

      const salt = randomBytes(16).toString('hex');
      const hashedPassword = await argon2.hash(mockNgo.password + salt);

      jest.spyOn(argon2, 'hash').mockResolvedValue(hashedPassword);
      jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn<any, any>(ngoService, 'createSalt')
        .mockReturnValue(salt);

      const createSpy = jest
        .spyOn(prismaService.nGO, 'create')
        .mockResolvedValue(ngo[0]);

      const result = await ngoService.createNgo(mockNgo);

      expect(result).toEqual({
        ...ngo[0],
        scope: Object.values(NGOScopeEnum),
      });

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          ...mockNgo,
          password: hashedPassword,
          salt,
          scope: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            connect: expect.any(Array),
          },
        },
      });
    });

    it('should throw an InternalServerErrorException if NGO creation fails', async () => {
      const mockNgo = {
        id: 1,
        name: 'NGO 1',
        email: 'john@doe.com',
        contact: 'Test Contact',
        website_url: 'https://www.test.com',
        description: 'Test Description',
        banner_uri: 'https://www.test.com',
        address: 'Test Address',
        password: 'MySecretPassw0rd!',
        salt: 'c49632f256a8767fc963dec9aac3381e',
      };

      const createSpy = jest
        .spyOn(prismaService.nGO, 'create')
        .mockRejectedValue(ngo[0]);

      await expect(ngoService.createNgo(mockNgo)).rejects.toThrow(
        BadRequestException,
      );
      expect(createSpy).toHaveBeenCalled();
    });
  });

  describe('findFilteredNgos', () => {
    it('should return filtered NGOs with pagination', async () => {
      const mockFilters = {
        filterName: 'NGO 1',
        paginationPageSize: 10,
        paginationPage: 1,
        sortFor: 'name',
        sortType: 'asc',
      };

      const mockPaginatedNgos = {
        ngos: [
          {
            ...ngo[0],
            scope: [
              {
                name: NGOScopeEnum.WRITE_NGO,
                id: 1,
                nGOClientId: '1',
              },
            ],
          },
        ],
        pagination: new Pagination(1, 1, 10, 1),
      };

      const countSpy = jest
        .spyOn(prismaService.nGO, 'count')
        .mockResolvedValue(1);

      const findManySpy = jest
        .spyOn(prismaService.nGO, 'findMany')
        .mockResolvedValue([
          {
            ...ngo[0],
            scope: [
              {
                name: NGOScopeEnum.WRITE_NGO,
                id: 1,
                nGOClientId: '1',
              },
            ],
          },
        ] as never);

      const result = await ngoService.findFilteredNgos(mockFilters);

      expect(result).toEqual(mockPaginatedNgos);
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object) as never,
          orderBy: { name: 'asc' },
        }),
      );
      expect(countSpy).toHaveBeenCalled();
      expect(findManySpy).toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      const countSpy = jest
        .spyOn(prismaService.nGO, 'count')
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);

      const findManySpy = jest
        .spyOn(prismaService.nGO, 'findMany')
        .mockResolvedValue([]);

      const result = await ngoService.findFilteredNgos({});

      expect(result.ngos).toEqual([]);
      expect(result.pagination.filteredResults).toBe(0);
      expect(countSpy).toHaveBeenCalled();
      expect(findManySpy).toHaveBeenCalled();
    });
  });

  describe('findFilteredNgosWithFavourite', () => {
    it('should return NGOs with favorite flag for a donator', async () => {
      const mockFilters = {
        filterName: 'NGO 1',
        paginationPageSize: 10,
        paginationPage: 1,
        sortFor: 'name',
        sortType: 'asc',
      };

      const mockPaginatedNgos = {
        ngos: [
          {
            ...ngo[0],
            scope: [
              {
                name: NGOScopeEnum.WRITE_NGO,
                id: 1,
                nGOClientId: '1',
              },
            ],
          },
        ],
        pagination: new Pagination(1, 1, 10, 1),
      };

      jest
        .spyOn(ngoService, 'findFilteredNgos')
        .mockResolvedValue(mockPaginatedNgos);

      const findManySpy = jest
        .spyOn(prismaService.nGO, 'findMany')
        .mockResolvedValue([ngo[0]]);

      const result = await ngoService.findFilteredNgosWithFavourite(
        mockFilters,
        1,
      );

      expect(result).toEqual({
        ngos: [{ ...mockPaginatedNgos.ngos[0], is_favorite: true }],
        pagination: mockPaginatedNgos.pagination,
      });
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object) as never,
        }),
      );
    });
  });

  describe('updateNgo', () => {
    it('should update the ngo', async () => {
      const id = 1;
      const updateSpy = jest
        .spyOn(prismaService.nGO, 'update')
        .mockResolvedValue({
          ...ngo[0],
          name: 'NGO 3',
          email: 'john@doe1.com',
          scope: [],
        } as never);

      const updateDto = {
        name: 'NGO 3',
        email: 'john@doe1.com',
      };

      const result = await ngoService.updateNgo(id, updateDto);

      expect(result).toEqual({
        ...ngo[0],
        name: 'NGO 3',
        email: 'john@doe1.com',
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

    it('should throw NotFoundException if ngo not found', async () => {
      jest.spyOn(prismaService.nGO, 'update').mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('error', {
          code: 'P2025',
          meta: {},
          clientVersion: '2.20.0',
        }),
      );

      await expect(ngoService.updateNgo(1, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteNgo', () => {
    it('should soft delete the ngo if all projects are archived', async () => {
      const mockNgo = {
        ...ngo[0],
        scope: [
          {
            name: NGOScopeEnum.WRITE_NGO,
            id: 1,
            nGOClientId: '1',
          },
        ],
      };
      const updateSpy = jest
        .spyOn(prismaService.nGO, 'update')
        .mockResolvedValue(mockNgo);

      await ngoService.deleteNgo(1);

      expect(updateSpy).toHaveBeenCalledWith({
        where: {
          id: 1,
          deletedAt: null,
          projects: {
            every: {
              archived: true,
            },
          },
        },
        data: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          deletedAt: expect.any(Date),
          refreshToken: null,
        },
        include: {
          scope: true,
        },
      });
    });

    it('should throw BadRequestException if not all projects are archived', async () => {
      const updateSpy = jest
        .spyOn(prismaService.nGO, 'update')
        .mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('error', {
            code: 'P2025',
            meta: {},
            clientVersion: '2.20.0',
          }),
        );

      await expect(ngoService.deleteNgo(1)).rejects.toThrow(NotFoundException);
      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('favoriteNgo', () => {
    it('should add an NGO to the users favourites', async () => {
      jest
        .spyOn(prismaService.donator, 'findFirstOrThrow')
        .mockResolvedValue(donator[0]);

      const result = await ngoService.favoriteNgo(1, 1, true);
      expect(result).toEqual({ is_favorite: true });
    });

    it('should throw a NotFoundException if the user does not exist', async () => {
      jest.spyOn(prismaService.donator, 'findFirstOrThrow').mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('error', {
          code: 'P2025',
          meta: {},
          clientVersion: '2.20.0',
        }),
      );
      await expect(ngoService.favoriteNgo(1, 1, true)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
