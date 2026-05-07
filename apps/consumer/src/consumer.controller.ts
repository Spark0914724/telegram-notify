import { Controller, Logger } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { MessageDto, QUEUES } from '@app/shared';
import { ConsumerService } from './consumer.service';
import { IdempotencyService } from './idempotency/idempotency.service';

@Controller()
export class ConsumerController {
  private readonly logger = new Logger(ConsumerController.name);

  constructor(
    private readonly consumerService: ConsumerService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @MessagePattern(QUEUES.MESSAGES)
  async handleMessage(@Payload() data: MessageDto, @Ctx() ctx: RmqContext) {
    const channel = ctx.getChannelRef();
    const msg = ctx.getMessage();

    if (this.idempotency.isProcessed(data.messageId)) {
      this.logger.warn(`duplicate skipped [${data.messageId}]`);
      channel.ack(msg);
      return;
    }

    try {
      await this.consumerService.processMessage(data);
      this.idempotency.markProcessed(data.messageId);
      channel.ack(msg);
    } catch (err) {
      this.logger.error(`failed [${data.messageId}]: ${err.message}`);
      channel.nack(msg, false, false);
    }
  }
}
