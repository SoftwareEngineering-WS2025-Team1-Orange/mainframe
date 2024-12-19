export function formatMessage<T>(event: string, data: T) {
  return JSON.stringify({
    event,
    data,
  });
}

export function formatError(event: string, code: number, message: string) {
  return JSON.stringify({
    event,
    code,
    data: { message },
  });
}
