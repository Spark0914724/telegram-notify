import { Injectable } from '@nestjs/common';

@Injectable()
export class IdempotencyService {
  private readonly seen = new Set<string>();

  isProcessed(id: string): boolean {
    return this.seen.has(id);
  }

  markProcessed(id: string): void {
    this.seen.add(id);
  }
}
