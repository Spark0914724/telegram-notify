import { Test, TestingModule } from '@nestjs/testing';
import { ConsumerController } from './consumer.controller';
import { ConsumerService } from './consumer.service';
import { IdempotencyService } from './idempotency/idempotency.service';
import { RmqContext } from '@nestjs/microservices';
import { MessageDto } from '@app/shared';

describe('ConsumerController', () => {
  let controller: ConsumerController;
  let consumerService: jest.Mocked<ConsumerService>;
  let idempotencyService: jest.Mocked<IdempotencyService>;

  // Mock RmqContext
  const mockChannel = {
    ack: jest.fn(),
    nack: jest.fn(),
  };
  const mockOriginalMsg = {};
  const mockContext = {
    getChannelRef: () => mockChannel,
    getMessage: () => mockOriginalMsg,
  } as unknown as RmqContext;

  const mockMessage: MessageDto = {
    messageId: 'test-uuid-123',
    eventType: 'user.created',
    payload: { userId: '1' },
    timestamp: new Date().toISOString(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsumerController],
      providers: [
        {
          provide: ConsumerService,
          useValue: { processMessage: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: IdempotencyService,
          useValue: {
            isProcessed: jest.fn().mockReturnValue(false),
            markProcessed: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ConsumerController>(ConsumerController);
    consumerService = module.get(ConsumerService);
    idempotencyService = module.get(IdempotencyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleMessage()', () => {
    it('should process message and ack on success', async () => {
      await controller.handleMessage(mockMessage, mockContext);

      expect(consumerService.processMessage).toHaveBeenCalledWith(mockMessage);
      expect(idempotencyService.markProcessed).toHaveBeenCalledWith('test-uuid-123');
      expect(mockChannel.ack).toHaveBeenCalledWith(mockOriginalMsg);
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('should ack and skip duplicate messages', async () => {
      idempotencyService.isProcessed.mockReturnValue(true);

      await controller.handleMessage(mockMessage, mockContext);

      expect(consumerService.processMessage).not.toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalledWith(mockOriginalMsg);
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('should nack without requeue on processing error', async () => {
      consumerService.processMessage.mockRejectedValueOnce(
        new Error('Processing failed'),
      );

      await controller.handleMessage(mockMessage, mockContext);

      expect(mockChannel.nack).toHaveBeenCalledWith(mockOriginalMsg, false, false);
      expect(mockChannel.ack).not.toHaveBeenCalled();
      expect(idempotencyService.markProcessed).not.toHaveBeenCalled();
    });

    it('should not mark as processed if processing fails', async () => {
      consumerService.processMessage.mockRejectedValueOnce(new Error('Error'));

      await controller.handleMessage(mockMessage, mockContext);

      expect(idempotencyService.markProcessed).not.toHaveBeenCalled();
    });
  });
});
