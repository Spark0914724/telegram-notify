import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { MessageDto, QUEUES, RmqPublisherService } from '@app/shared';
import { CreateMessageDto } from './dto/create-message.dto';

@ApiTags('messages')
@Controller('messages')
export class ProducerController {
  constructor(private readonly rmqPublisherService: RmqPublisherService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a message to the RabbitMQ queue' })
  @ApiBody({ type: CreateMessageDto })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 500, description: 'Failed to publish message' })
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
