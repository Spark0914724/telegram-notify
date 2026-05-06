import { Controller, Logger } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { ConsumerService } from './consumer.service';
import { IdempotencyService } from './idempotency/idempotency.service';
import { MessageDto, QUEUES } from '@app/shared';

@Controller()
export class ConsumerController {
  private readonly logger = new Logger(ConsumerController.name);

  constructor(
    private readonly consumerService: ConsumerService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  @MessagePattern(QUEUES.MESSAGES)
  async handleMessage(
    @Payload() data: MessageDto,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    // Skip duplicate messages
    if (this.idempotencyService.isProcessed(data.messageId)) {
      this.logger.warn(`Duplicate message skipped [${data.messageId}]`);
      channel.ack(originalMsg);
      return;
    }

    try {
      await this.consumerService.processMessage(data);
      this.idempotencyService.markProcessed(data.messageId);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `Failed to process [${data.messageId}]: ${error.message}`,
        error.stack,
      );
      // nack without requeue → routes to Dead Letter Queue
      channel.nack(originalMsg, false, false);
    }
  }
}
