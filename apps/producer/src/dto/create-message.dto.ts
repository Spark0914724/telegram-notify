export class CreateMessageDto {
  eventType: string;
  payload: Record<string, unknown>;
}
