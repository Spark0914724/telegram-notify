import { Injectable, Logger } from '@nestjs/common';
import { MessageDto, QUEUES, RmqPublisherService } from '@app/shared';

@Injectable()
export class ConsumerService {
  private readonly logger = new Logger(ConsumerService.name);

  constructor(private readonly publisher: RmqPublisherService) {}

  async processMessage(data: MessageDto): Promise<void> {
    this.logger.log(`processing [${data.messageId}] type=${data.eventType}`);

    // TODO: add your business logic here

    await this.publisher.publishWithRetry(QUEUES.NOTIFICATIONS, data);
  }
}
