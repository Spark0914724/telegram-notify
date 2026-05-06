import { Controller, Logger } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { TelegramNotifierService } from './telegram-notifier.service';
import { MessageDto, QUEUES } from '@app/shared';

@Controller()
export class TelegramNotifierController {
  private readonly logger = new Logger(TelegramNotifierController.name);

  constructor(
    private readonly telegramNotifierService: TelegramNotifierService,
  ) {}

  @MessagePattern(QUEUES.NOTIFICATIONS)
  async handleNotification(
    @Payload() data: MessageDto,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.telegramNotifierService.sendNotification(data);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `Notification failed [${data.messageId}]: ${error.message}`,
        error.stack,
      );
      // nack without requeue → goes to DLQ
      channel.nack(originalMsg, false, false);
    }
  }
}
