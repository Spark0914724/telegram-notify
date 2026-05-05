import { Body, Controller, Post } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class ProducerController {
  constructor(private readonly producerService: ProducerService) {}

  @Post('send')
  async send(@Body() body: CreateMessageDto) {
    return this.producerService.sendMessage(body);
  }
}
