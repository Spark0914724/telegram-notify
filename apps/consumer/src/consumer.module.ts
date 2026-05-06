import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsumerController } from './consumer.controller';
import { ConsumerService } from './consumer.service';
import { IdempotencyService } from './idempotency/idempotency.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [ConsumerController],
  providers: [ConsumerService, IdempotencyService],
})
export class ConsumerModule {}
