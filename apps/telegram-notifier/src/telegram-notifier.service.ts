import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { MessageDto } from '@app/shared';

@Injectable()
export class TelegramNotifierService implements OnModuleInit {
  private readonly logger = new Logger(TelegramNotifierService.name);
  private bot: TelegramBot;
  private chatId: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const token = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = this.configService.getOrThrow<string>('TELEGRAM_CHAT_ID');
    this.bot = new TelegramBot(token);
    this.logger.log('Telegram bot initialized');
  }

  async sendNotification(data: MessageDto): Promise<void> {
    const text = this.formatMessage(data);

    try {
      await this.bot.sendMessage(this.chatId, text, { parse_mode: 'HTML' });
      this.logger.log(`Telegram notification sent [${data.messageId}]`);
    } catch (error) {
      this.logger.error(
        `Failed to send Telegram notification [${data.messageId}]: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private formatMessage(data: MessageDto): string {
    return (
      `📨 <b>New Event</b>\n` +
      `🔖 <b>Type:</b> ${data.eventType}\n` +
      `🆔 <b>ID:</b> <code>${data.messageId}</code>\n` +
      `🕐 <b>Time:</b> ${data.timestamp}\n\n` +
      `📦 <b>Payload:</b>\n<pre>${JSON.stringify(data.payload, null, 2)}</pre>`
    );
  }
}
