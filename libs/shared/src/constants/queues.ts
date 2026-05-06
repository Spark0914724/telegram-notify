export const QUEUES = {
  MESSAGES: 'messages_queue',
  NOTIFICATIONS: 'notifications_queue',
};

export const DLQ = {
  EXCHANGE: 'messages_dlx',
  ROUTING_KEY: 'messages_dead',
  QUEUE: 'messages_dead_queue',
};
