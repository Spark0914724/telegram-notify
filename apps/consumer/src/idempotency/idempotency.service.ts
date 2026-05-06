import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly processed = new Set<string>();

  isProcessed(messageId: string): boolean {
    return this.processed.has(messageId);
  }

  markProcessed(messageId: string): void {
    this.processed.add(messageId);
    this.logger.debug(`Marked as processed: ${messageId}`);
  }
}