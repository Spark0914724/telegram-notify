import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ProducerModule } from '../src/producer.module';
import { RmqPublisherService } from '@app/shared';

describe('Producer (e2e)', () => {
  let app: INestApplication;
  let rmqPublisherService: jest.Mocked<RmqPublisherService>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProducerModule],
    })
      .overrideProvider(RmqPublisherService)
      .useValue({
        publishWithRetry: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    rmqPublisherService = moduleFixture.get(RmqPublisherService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /messages/send', () => {
    it('should return 201 with messageId on valid payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/messages/send')
        .send({ eventType: 'user.created', payload: { userId: '123' } });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.messageId).toBeDefined();
      // UUID v4 format
      expect(res.body.messageId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should call publishWithRetry with correct queue and message', async () => {
      await request(app.getHttpServer())
        .post('/messages/send')
        .send({ eventType: 'order.placed', payload: { orderId: '456' } });

      expect(rmqPublisherService.publishWithRetry).toHaveBeenCalledTimes(1);

      const [queue, message] = rmqPublisherService.publishWithRetry.mock.calls[0];
      expect(queue).toBe('messages_queue');
      expect(message.eventType).toBe('order.placed');
      expect(message.payload).toEqual({ orderId: '456' });
      expect(message.messageId).toBeDefined();
      expect(message.timestamp).toBeDefined();
    });

    it('should generate a unique messageId for each request', async () => {
      const res1 = await request(app.getHttpServer())
        .post('/messages/send')
        .send({ eventType: 'test', payload: {} });

      const res2 = await request(app.getHttpServer())
        .post('/messages/send')
        .send({ eventType: 'test', payload: {} });

      expect(res1.body.messageId).not.toBe(res2.body.messageId);
    });

    it('should return 500 if publishWithRetry throws', async () => {
      rmqPublisherService.publishWithRetry.mockRejectedValueOnce(
        new Error('RabbitMQ unavailable'),
      );

      const res = await request(app.getHttpServer())
        .post('/messages/send')
        .send({ eventType: 'test', payload: {} });

      expect(res.status).toBe(500);
    });
  });
});
