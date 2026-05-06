import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TelegramNotifierService } from './telegram-notifier.service';
import { MessageDto } from '@app/shared';

// Mock node-telegram-bot-api
const mockSendMessage = jest.fn().mockResolvedValue({});

jest.mock('node-telegram-bot-api', () => {
  return jest.fn().mockImplementation(() => ({
    sendMessage: mockSendMessage,
  }));
});

describe('TelegramNotifierService', () => {
  let service: TelegramNotifierService;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const config: Record<string, string> = {
        TELEGRAM_BOT_TOKEN: 'test-bot-token',
        TELEGRAM_CHAT_ID: '123456789',
      };
      return config[key];
    }),
  };

  const mockMessage: MessageDto = {
    messageId: 'test-uuid-123',
    eventType: 'user.created',
    payload: { userId: '1', email: 'test@example.com' },
    timestamp: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramNotifierService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TelegramNotifierService>(TelegramNotifierService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize bot with token on module init', () => {
    expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('TELEGRAM_BOT_TOKEN');
    expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('TELEGRAM_CHAT_ID');
  });

  describe('sendNotification()', () => {
    it('should send formatted message to correct chat', async () => {
      await service.sendNotification(mockMessage);

      expect(mockSendMessage).toHaveBeenCalledWith(
        '123456789',
        expect.stringContaining('user.created'),
        { parse_mode: 'HTML' },
      );
    });

    it('should include messageId in the notification', async () => {
      await service.sendNotification(mockMessage);

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('test-uuid-123'),
        expect.any(Object),
      );
    });

    it('should include timestamp in the notification', async () => {
      await service.sendNotification(mockMessage);

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('2026-01-01T00:00:00.000Z'),
        expect.any(Object),
      );
    });

    it('should include payload in the notification', async () => {
      await service.sendNotification(mockMessage);

      const calledWith = mockSendMessage.mock.calls[0][1] as string;
      expect(calledWith).toContain('test@example.com');
    });

    it('should throw and log error if sendMessage fails', async () => {
      mockSendMessage.mockRejectedValueOnce(new Error('Telegram API error'));

      await expect(service.sendNotification(mockMessage)).rejects.toThrow(
        'Telegram API error',
      );
    });
  });
});
