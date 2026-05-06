import { Transport, RmqOptions } from '@nestjs/microservices';

export const getRmqOptions = (queue: string): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672'],
    queue,
    queueOptions: {
      durable: true,
      arguments: {
        // When a message is nack'd without requeue, RabbitMQ
        // forwards it to this exchange automatically
        'x-dead-letter-exchange': 'messages_dlx',
        'x-dead-letter-routing-key': 'messages_dead',
      },
    },
    noAck: false,
  },
});
