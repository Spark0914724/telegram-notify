import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RmqPublisherService } from './rmq-publisher/rmq-publisher.service';
import { QUEUES, MessageDto } from '@app/shared';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ProducerService {
  constructor(private readonly rmqPublisherService: RmqPublisherService) {}

  async sendMessage(dto: CreateMessageDto): Promise<{ success: boolean; messageId: string }> {
    const message: MessageDto = {
      messageId: uuidv4(),
      eventType: dto.eventType,
      payload: dto.payload,
      timestamp: new Date().toISOString(),
    };

    await this.rmqPublisherService.publishWithRetry(QUEUES.MESSAGES, message);

    return { success: true, messageId: message.messageId };
  }
}
