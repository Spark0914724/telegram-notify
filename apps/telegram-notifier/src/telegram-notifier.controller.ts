import { Controller, Logger } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { MessageDto, QUEUES } from '@app/shared';
import { TelegramNotifierService } from './telegram-notifier.service';

@Controller()
export class TelegramNotifierController {
  private readonly logger = new Logger(TelegramNotifierController.name);

  constructor(private readonly telegram: TelegramNotifierService) {}

  @MessagePattern(QUEUES.NOTIFICATIONS)
  async handleNotification(@Payload() data: MessageDto, @Ctx() ctx: RmqContext) {
    const channel = ctx.getChannelRef();
    const msg = ctx.getMessage();

    try {
      await this.telegram.sendNotification(data);
      channel.ack(msg);
    } catch (err) {
      this.logger.error(`failed to notify [${data.messageId}]: ${err.message}`);
      channel.nack(msg, false, false);
    }
  }
}
