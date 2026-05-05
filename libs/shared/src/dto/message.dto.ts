export class MessageDto {
  messageId: string;
  eventType: string;
  payload: Record<string, unknown>;
  timestamp: string;
}
