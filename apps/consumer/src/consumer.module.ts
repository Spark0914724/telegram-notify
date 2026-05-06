import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsumerController } from './consumer.controller';
import { ConsumerService } from './consumer.service';
import { IdempotencyService } from './idempotency/idempotency.service';
import { RmqPublisherModule } from '@app/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RmqPublisherModule,
  ],
  controllers: [ConsumerController],
  providers: [ConsumerService, IdempotencyService],
})
export class ConsumerModule {}
