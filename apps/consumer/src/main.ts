import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConsumerModule } from './consumer.module';
import { QUEUES } from '@app/shared';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ConsumerModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672'],
        queue: QUEUES.MESSAGES,
        queueOptions: {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': 'messages_dlx',
            'x-dead-letter-routing-key': 'messages_dead',
          },
        },
        noAck: false,
      },
    },
  );
  await app.listen();
}
bootstrap();
