import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RmqPublisherService } from './rmq-publisher.service';

// Mock amqp-connection-manager
const mockSendToQueue = jest.fn().mockResolvedValue(undefined);
const mockClose = jest.fn().mockResolvedValue(undefined);
const mockCreateChannel = jest.fn().mockReturnValue({
  sendToQueue: mockSendToQueue,
  close: mockClose,
});
const mockConnectionClose = jest.fn().mockResolvedValue(undefined);
const mockConnect = jest.fn().mockReturnValue({
  createChannel: mockCreateChannel,
  close: mockConnectionClose,
});

jest.mock('amqp-connection-manager', () => ({
  connect: (...args: unknown[]) => mockConnect(...args),
}));

describe('RmqPublisherService', () => {
  let service: RmqPublisherService;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const config: Record<string, string> = {
        RABBITMQ_URL: 'amqp://localhost:5672',
        RABBITMQ_QUEUE_MESSAGES: 'messages_queue',
        RABBITMQ_QUEUE_NOTIFICATIONS: 'notifications_queue',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RmqPublisherService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RmqPublisherService>(RmqPublisherService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should connect to RabbitMQ on init', () => {
    expect(mockConnect).toHaveBeenCalledWith(['amqp://localhost:5672']);
    expect(mockCreateChannel).toHaveBeenCalled();
  });

  describe('publish()', () => {
    it('should send message to queue with correct options', async () => {
      const msg = {
        messageId: 'test-uuid',
        eventType: 'user.created',
        payload: { userId: '1' },
        timestamp: new Date().toISOString(),
      };

      await service.publish('messages_queue', msg);

      expect(mockSendToQueue).toHaveBeenCalledWith(
        'messages_queue',
        msg,
        expect.objectContaining({
          persistent: true,
          messageId: 'test-uuid',
          contentType: 'application/json',
        }),
      );
    });

    it('should throw if sendToQueue fails', async () => {
      mockSendToQueue.mockRejectedValueOnce(new Error('Connection lost'));

      const msg = {
        messageId: 'test-uuid',
        eventType: 'test',
        payload: {},
        timestamp: new Date().toISOString(),
      };

      await expect(service.publish('messages_queue', msg)).rejects.toThrow(
        'Connection lost',
      );
    });
  });

  describe('publishWithRetry()', () => {
    it('should succeed on first attempt', async () => {
      const msg = {
        messageId: 'retry-uuid',
        eventType: 'test',
        payload: {},
        timestamp: new Date().toISOString(),
      };

      await service.publishWithRetry('messages_queue', msg, 3);

      expect(mockSendToQueue).toHaveBeenCalledTimes(1);
    });

    it('should retry and succeed on second attempt', async () => {
      mockSendToQueue
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce(undefined);

      const msg = {
        messageId: 'retry-uuid',
        eventType: 'test',
        payload: {},
        timestamp: new Date().toISOString(),
      };

      await service.publishWithRetry('messages_queue', msg, 3);

      expect(mockSendToQueue).toHaveBeenCalledTimes(2);
    });

    it('should throw after all retries exhausted', async () => {
      mockSendToQueue.mockRejectedValue(new Error('Persistent error'));

      const msg = {
        messageId: 'retry-uuid',
        eventType: 'test',
        payload: {},
        timestamp: new Date().toISOString(),
      };

      await expect(
        service.publishWithRetry('messages_queue', msg, 2),
      ).rejects.toThrow('Persistent error');

      expect(mockSendToQueue).toHaveBeenCalledTimes(2);
    });
  });

  describe('onModuleDestroy()', () => {
    it('should close channel and connection', async () => {
      await service.onModuleDestroy();
      expect(mockClose).toHaveBeenCalled();
      expect(mockConnectionClose).toHaveBeenCalled();
    });
  });
});
