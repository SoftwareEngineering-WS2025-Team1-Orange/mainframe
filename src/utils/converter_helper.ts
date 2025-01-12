export function convertPiconeroToCent(amount: number): number {
  return Math.floor(amount * 19_000 * 10 ** -12);
}

export function convertCentToPiconero(amount: number): number {
  return Math.floor((amount * 10 ** 12) / 19_000);
}
