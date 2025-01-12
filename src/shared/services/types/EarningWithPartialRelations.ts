import { DonationBox, Earning, Payout } from '@prisma/client';

export type EarningWithPartialRelations = Earning & {
  payout?: Pick<Payout, 'periodStart' | 'periodEnd'>;
  donationBox?: Pick<DonationBox, 'id' | 'name' | 'cuid'>;
};
