export class IntegratedKeyGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntegratedKeyGenerationError';
  }
}
