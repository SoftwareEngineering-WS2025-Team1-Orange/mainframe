export interface Rule<P, F> {
  condition: (previous: P, future: F) => Promise<boolean> | boolean;
  onFailure: Error;
}
