import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { MessageDto } from '../dto/message.dto';
import { withRetry } from '../utils/retry.util';

@Injectable()
export class RmqPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RmqPublisherService.name);
  private connection: amqp.AmqpConnectionManager;
  private channel: ChannelWrapper;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.getOrThrow<string>('RABBITMQ_URL');
    this.connection = amqp.connect([url]);
    this.channel = this.connection.createChannel({ json: true });
    this.logger.log('connected to RabbitMQ');
  }

  async onModuleDestroy() {
    await this.channel.close();
    await this.connection.close();
  }

  async publish(queue: string, data: MessageDto): Promise<void> {
    await this.channel.sendToQueue(
      queue,
      { pattern: queue, data },
      { persistent: true, messageId: data.messageId },
    );
    this.logger.log(`published [${data.messageId}] → ${queue}`);
  }

  async publishWithRetry(queue: string, data: MessageDto, retries = 3): Promise<void> {
    await withRetry(
      () => this.publish(queue, data),
      { retries, delay: 1000, label: data.messageId },
      this.logger,
    );
  }
}
