import { IsString, IsUUID, IsObject } from 'class-validator';

export class MessageDto {
  @IsUUID()
  messageId: string;

  @IsString()
  eventType: string;

  @IsObject()
  payload: Record<string, unknown>;

  timestamp: string;
}