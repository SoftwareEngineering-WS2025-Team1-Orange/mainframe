export enum SolarStatusCodes {
  OK = 100,
  ERROR = 101,
  PENDING = 102,
}

export const SolarStatusMessages = {
  [SolarStatusCodes.OK]: 'Ok',
  [SolarStatusCodes.ERROR]: 'Error',
  [SolarStatusCodes.PENDING]: 'Pending',
  UNINITIALIZED: 'Uninitialized',
  UNKNOWN: 'Unknown',
};
