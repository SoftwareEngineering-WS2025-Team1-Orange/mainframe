import { ContainerStatus } from '@prisma/client';

export function calculateWorkingTime(
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
  return totalWorkingTime / 1000;
}
