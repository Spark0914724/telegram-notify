import { Logger } from '@nestjs/common';

export interface RetryOptions {
  retries?: number;       // max attempts (default: 3)
  delay?: number;         // base delay in ms (default: 1000)
  label?: string;         // context label for logs
}

/**
 * Retries an async operation with exponential backoff.
 * Attempt 1 fails → wait 1s
 * Attempt 2 fails → wait 2s
 * Attempt 3 fails → throw
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
  logger?: Logger,
): Promise<T> {
  const { retries = 3, delay = 1000, label = 'operation' } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isLastAttempt = attempt === retries;

      if (logger) {
        logger.warn(
          `[${label}] Attempt ${attempt}/${retries} failed: ${error.message}`,
        );
      }

      if (isLastAttempt) {
        if (logger) {
          logger.error(`[${label}] All ${retries} attempts failed. Giving up.`);
        }
        throw error;
      }

      // exponential backoff: delay * attempt (1s, 2s, 3s, ...)
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
}
