import {
  Category,
  Container,
  ContainerStatus,
  Donation,
  DonationBox,
  Donator,
  Earning,
  NGO,
  Project,
} from '@prisma/client';

export const container: Container[] = [
  {
    id: 1,
    name: 'db-main',
    donationBoxId: 1,
    createdAt: new Date(1_736_798_702),
    updatedAt: new Date(1_736_798_702),
  },
];

export const containerStatus: ContainerStatus[] = [
  {
    id: 1,
    containerId: 1,
    statusCode: 1,
    statusMsg: 'Working',
    createdAt: new Date(1_736_798_702),
    updatedAt: new Date(1_736_798_702),
  },
];

export const donation: Donation[] = [
  {
    id: 1,
    donatorId: 1,
    amount: 100,
    createdAt: new Date(1_736_798_702),
    updatedAt: new Date(1_736_798_702),
    projectId: 1,
    ngoId: 1,
  },
];

export const donator: Donator[] = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@doe.com',
    // "MySecretPassw0rd!"
    password:
      '$argon2id$v=19$m=65536,t=3,p=4$fVbIESBlw6ttlFAHIwgAVQ$eWb1jGPQRFINFBPH/F8CUkGRBgIhKgUpS6lQYbrpuG8',
    salt: 'c49632f256a8767fc963dec9aac3381e',
    refreshToken: null,
    createdAt: new Date(1_736_798_702),
    updatedAt: new Date(1_736_798_702),
    deletedAt: null,
  },
];

export const ngo: NGO[] = [
  {
    id: 1,
    name: 'NGO 1',
    email: 'john@doe.com',
    contact: 'Test Contact',
    website_url: 'https://www.test.com',
    description: 'Test Description',
    banner_uri: 'https://www.test.com',
    address: 'Test Address',
    // "MySecretPassw0rd!"
    password:
      '$argon2id$v=19$m=65536,t=3,p=4$fVbIESBlw6ttlFAHIwgAVQ$eWb1jGPQRFINFBPH/F8CUkGRBgIhKgUpS6lQYbrpuG8',
    salt: 'c49632f256a8767fc963dec9aac3381e',
    refreshToken: null,
    createdAt: new Date(1_736_798_702),
    updatedAt: new Date(1_736_798_702),
    deletedAt: null,
  },
];

export const project: Project[] = [
  {
    id: 1,
    name: 'Project 1',
    ngoId: 1,
    description: 'Test Description',
    banner_uri: 'https://www.test.com',
    fundraising_goal: 1000,
    fundraising_current: 500,
    fundraising_closed: false,
    archived: false,
    target_date: new Date(1_737_798_702),
    category: Category.Education,
    progress: 50,
    createdAt: new Date(1_736_798_702),
    updatedAt: new Date(1_736_798_702),
  },
];

export const earning: Earning[] = [
  {
    id: 1,
    amount: 600,
    activeTimeInPeriod: 100,
    createdAt: new Date(1_736_798_702),
    updatedAt: new Date(1_736_798_702),
    payoutId: 1,
    donationBoxId: 1,
  },
  {
    id: 2,
    amount: 700,
    activeTimeInPeriod: 800,
    createdAt: new Date(1_736_858_211),
    updatedAt: new Date(1_736_858_211),
    payoutId: 1,
    donationBoxId: 1,
  },
];

export const donationboxes: DonationBox[] = [
  {
    id: 1,
    cuid: 'vkebp3z3acle03b72w72t503',
    name: 'Donation Box 1',
    lastSolarStatus: {},
    createdAt: new Date(1_736_798_702),
    updatedAt: new Date(1_736_798_702),
    donatorId: 1,
  },
  {
    id: 2,
    cuid: 'vl2xpsyu7az5j554a59qh2h3',
    name: 'Donation Box 2',
    lastSolarStatus: {},
    createdAt: new Date(1_736_798_702),
    updatedAt: new Date(1_736_798_702),
    donatorId: 1,
  },
];

describe('Test Database', () => {
  it('should have all the necessary data', () => {
    expect(container).toBeDefined();
    expect(containerStatus).toBeDefined();
    expect(donation).toBeDefined();
    expect(donator).toBeDefined();
    expect(ngo).toBeDefined();
    expect(project).toBeDefined();
    expect(earning).toBeDefined();
    expect(donationboxes).toBeDefined();
  });
});
