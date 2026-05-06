import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProducerController } from './producer.controller';
import { RmqPublisherModule } from './rmq-publisher/rmq-publisher.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RmqPublisherModule,
  ],
  controllers: [ProducerController],
})
export class ProducerModule {}
