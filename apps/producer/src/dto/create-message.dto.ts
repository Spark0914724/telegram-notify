import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ example: 'user.created', description: 'Type of the event' })
  eventType: string;

  @ApiProperty({
    example: { userId: '123', email: 'user@example.com' },
    description: 'Arbitrary event payload',
  })
  payload: Record<string, unknown>;
}
