import { Transport, RmqOptions } from '@nestjs/microservices';

// export const getRmqOptions = (queue: string): RmqOptions => ({
//   transport: Transport.RMQ,
//   options: {
//     urls: [process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672'],
//     queue,
//     queueOptions: {
//       durable: true,
//     },
//     noAck: false,
//   },
// });

export const getRmqOptions = (queue: string) => ({
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL],
    queue,
    queueOptions: { durable: true },
    noAck: false,
  },
});

