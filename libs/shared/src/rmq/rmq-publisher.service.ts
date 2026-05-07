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
  private channelWrapper: ChannelWrapper;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.getOrThrow<string>('RABBITMQ_URL');

    this.connection = amqp.connect([url]);

    this.channelWrapper = this.connection.createChannel({ json: true });

    this.logger.log('RabbitMQ publisher connection established');
  }

  async onModuleDestroy() {
    await this.channelWrapper.close();
    await this.connection.close();
  }

  async publish(queue: string, data: MessageDto): Promise<void> {
    // NestJS @MessagePattern expects { pattern, data } format
    const message = { pattern: queue, data };

    await this.channelWrapper.sendToQueue(queue, message, {
      persistent: true,
      messageId: data.messageId,
      contentType: 'application/json',
    });
    this.logger.log(`Message published [${data.messageId}] to queue "${queue}"`);
  }

  async publishWithRetry(
    queue: string,
    data: MessageDto,
    retries = 3,
  ): Promise<void> {
    await withRetry(
      () => this.publish(queue, data),
      { retries, delay: 1000, label: `publish:${data.messageId}` },
      this.logger,
    );
  }
}
