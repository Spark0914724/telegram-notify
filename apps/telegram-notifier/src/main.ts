import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { TelegramNotifierModule } from './telegram-notifier.module';
import { getRmqOptions, QUEUES } from '@app/shared';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    TelegramNotifierModule,
    getRmqOptions(QUEUES.NOTIFICATIONS),
  );
  await app.listen();
}
bootstrap();
