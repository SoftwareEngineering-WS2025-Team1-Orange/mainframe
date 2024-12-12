import { HttpException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Donator } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { StatusCodes } from 'http-status-codes';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDonatorDto } from './dto';

@Injectable()
export class DonatorService {
  constructor(private prismaService: PrismaService) {}

  async findDonatorById(id: number): Promise<Donator> {
    const donator = await this.prismaService.donator.findFirst({
      where: {
        id,
      },
    });

    if (!donator) {
      throw new HttpException('Donator not found', StatusCodes.NOT_FOUND);
    }

    return donator;
  }

  async createDonator(donator: CreateDonatorDto): Promise<Donator> {
    const salt = randomBytes(16).toString('hex');
    const donatorWithHash = {
      ...donator,
      password: await argon2.hash(donator.password + salt),
    };

    const newDonator = await this.prismaService.donator.create({
      data: {
        ...donatorWithHash,
        salt,
      },
    });

    return newDonator;
  }
}
