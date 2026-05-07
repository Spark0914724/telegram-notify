import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { MessageDto } from '@app/shared';

@Injectable()
export class TelegramNotifierService implements OnModuleInit {
  private readonly logger = new Logger(TelegramNotifierService.name);
  private bot: TelegramBot;
  private chatId: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const token = this.config.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = this.config.getOrThrow<string>('TELEGRAM_CHAT_ID');

    const proxy = this.config.get<string>('TELEGRAM_PROXY_URL');
    const options: TelegramBot.ConstructorOptions = proxy
      ? { request: { url: '', proxy } as any }
      : {};

    this.bot = new TelegramBot(token, options);
    this.logger.log('telegram bot ready');
  }

  async sendNotification(data: MessageDto): Promise<void> {
    await this.bot.sendMessage(this.chatId, this.format(data), {
      parse_mode: 'HTML',
    });
    this.logger.log(`sent [${data.messageId}]`);
  }

  private format(data: MessageDto): string {
    return (
      `📨 <b>${data.eventType}</b>\n` +
      `<code>${data.messageId}</code>\n` +
      `${data.timestamp}\n\n` +
      `<pre>${JSON.stringify(data.payload, null, 2)}</pre>`
    );
  }
}
