import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ConsumerModule } from './consumer.module';
import { getRmqOptions, QUEUES } from '@app/shared';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ConsumerModule,
    getRmqOptions(QUEUES.MESSAGES),
  );
  await app.listen();
}
bootstrap();
