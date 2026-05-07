import { Body, Controller, Post } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MessageDto, QUEUES, RmqPublisherService } from '@app/shared';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class ProducerController {
  constructor(private readonly publisher: RmqPublisherService) {}

  @Post('send')
  async send(@Body() body: CreateMessageDto) {
    const msg: MessageDto = {
      messageId: uuidv4(),
      eventType: body.eventType,
      payload: body.payload,
      timestamp: new Date().toISOString(),
    };

    await this.publisher.publishWithRetry(QUEUES.MESSAGES, msg);
    return { success: true, messageId: msg.messageId };
  }
}
