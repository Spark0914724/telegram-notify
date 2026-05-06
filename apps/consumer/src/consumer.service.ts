import { Injectable, Logger } from '@nestjs/common';
import { MessageDto, QUEUES, RmqPublisherService } from '@app/shared';

@Injectable()
export class ConsumerService {
  private readonly logger = new Logger(ConsumerService.name);

  constructor(private readonly rmqPublisherService: RmqPublisherService) {}

  async processMessage(data: MessageDto): Promise<void> {
    this.logger.log(
      `Processing message [${data.messageId}] type="${data.eventType}" payload=${JSON.stringify(data.payload)}`,
    );

    // Business logic goes here (e.g. save to DB, trigger other events)
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.log(`Successfully processed [${data.messageId}]`);

    // Forward to Telegram Notifier via notifications queue
    await this.rmqPublisherService.publishWithRetry(QUEUES.NOTIFICATIONS, data);
    this.logger.log(`Forwarded [${data.messageId}] to notifications queue`);
  }
}
