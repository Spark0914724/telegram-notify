import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProducerController } from './producer.controller';
import { RmqPublisherModule } from '@app/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RmqPublisherModule,
  ],
  controllers: [ProducerController],
})
export class ProducerModule {}
