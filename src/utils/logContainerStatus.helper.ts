import { ContainerStatus } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { StandardContainerNames } from '@/shared/services/types/StandardContainerNames';

export function calculateWorkingTimeInSeconds(
  logs: ContainerStatus[],
  newestDateIfLastLogIsWorking: Date = new Date(Date.now()),
) {
  let totalWorkingTime = 0;
  let workingStartTime: Date | null = null;
  logs.forEach((currentLog) => {
    if (currentLog.statusMsg === 'Working') {
      if (!workingStartTime) {
        workingStartTime = currentLog.createdAt;
      }
    } else if (workingStartTime) {
      totalWorkingTime +=
        currentLog.createdAt.getTime() - workingStartTime.getTime();
      workingStartTime = null;
    }
  });
  // Handle case where last log was "Working"
  if (workingStartTime && logs.length > 0) {
    totalWorkingTime +=
      newestDateIfLastLogIsWorking.getTime() -
      logs[logs.length - 1].createdAt.getTime();
  }
  return Math.round(totalWorkingTime / 1000);
}

export async function getFirstConnectedLog(
  donationBoxId: number,
  prismaService: PrismaService,
) {
  return prismaService.containerStatus.findFirst({
    where: {
      container: {
        name: StandardContainerNames.MAIN,
        donationBoxId,
      },
      statusMsg: 'Connected',
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}
