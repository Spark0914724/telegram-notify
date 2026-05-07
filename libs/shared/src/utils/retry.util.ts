import { Logger } from '@nestjs/common';

export interface RetryOptions {
  retries?: number;
  delay?: number;
  label?: string;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  logger?: Logger,
): Promise<T> {
  const { retries = 3, delay = 1000, label = 'operation' } = options;
  let lastError: Error;

  for (let i = 1; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      logger?.warn(`[${label}] attempt ${i}/${retries} failed: ${lastError.message}`);

      if (i === retries) {
        logger?.error(`[${label}] giving up after ${retries} attempts`);
        throw lastError;
      }

      await new Promise((r) => setTimeout(r, delay * i));
    }
  }

  throw lastError!;
}
