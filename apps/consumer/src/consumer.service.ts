import { Injectable, Logger } from '@nestjs/common';
import { MessageDto } from '@app/shared';

@Injectable()
export class ConsumerService {
  private readonly logger = new Logger(ConsumerService.name);

  async processMessage(data: MessageDto): Promise<void> {
    // Business logic goes here
    // e.g. save to DB, trigger other events, etc.
    this.logger.log(
      `Processing message [${data.messageId}] type="${data.eventType}" payload=${JSON.stringify(data.payload)}`,
    );

    // Simulate async work
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.log(`Successfully processed [${data.messageId}]`);
  }
}
