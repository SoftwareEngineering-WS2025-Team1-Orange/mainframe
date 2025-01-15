import { DonationBox, Earning, MoneroMiningPayout } from '@prisma/client';

export type EarningWithPartialRelations = Earning & {
  moneroMiningPayout?: Pick<MoneroMiningPayout, 'timestamp' | 'periodStart'>;
  donationBox?: Pick<DonationBox, 'id' | 'name' | 'cuid'>;
};
