import { Body, Controller, Post } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MessageDto, QUEUES } from '@app/shared';
import { RmqPublisherService } from './rmq-publisher/rmq-publisher.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class ProducerController {
  constructor(private readonly rmqPublisherService: RmqPublisherService) {}

  @Post('send')
  async send(@Body() body: CreateMessageDto) {
    const msg: MessageDto = {
      messageId: uuidv4(),
      eventType: body.eventType,
      payload: body.payload,
      timestamp: new Date().toISOString(),
    };
    await this.rmqPublisherService.publishWithRetry(QUEUES.MESSAGES, msg);
    return { success: true, messageId: msg.messageId };
  }
}
