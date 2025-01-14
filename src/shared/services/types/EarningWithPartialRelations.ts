import { DonationBox, Earning, MoneroMiningPayout } from '@prisma/client';

export type EarningWithPartialRelations = Earning & {
  moneroMiningPayout?: Pick<
    MoneroMiningPayout,
    'timestamp' | 'lastPayoutTimestamp'
  >;
  donationBox?: Pick<DonationBox, 'id' | 'name' | 'cuid'>;
};
