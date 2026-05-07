# nestjs-microservices

Microservice setup using NestJS, RabbitMQ and Telegram Bot API.

## How it works

```
POST /messages/send
        │
        ▼
    Producer
        │
        ▼
  messages_queue (RabbitMQ)
        │
        ▼
    Consumer ──────────────► notifications_queue
                                      │
                                      ▼
                              Telegram Notifier
                                      │
                                      ▼
                               Telegram Bot
```

Failed messages on `messages_queue` go to `messages_dlx` (dead letter exchange).

## Stack

- NestJS 11
- RabbitMQ (amqp-connection-manager)
- Telegram Bot API (node-telegram-bot-api)
- Docker / Docker Compose

## Setup

### 1. Clone

```bash
git clone <repo-url>
cd nestjs-microservices
```

### 2. Configure

```bash
cp .env.example .env
```

Fill in `.env`:

```env
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_QUEUE_MESSAGES=messages_queue
RABBITMQ_QUEUE_NOTIFICATIONS=notifications_queue
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id

# if Telegram is blocked in your region
# TELEGRAM_PROXY_URL=http://user:pass@host:port
```

To get your `TELEGRAM_BOT_TOKEN` — talk to [@BotFather](https://t.me/BotFather) on Telegram.

To get your `TELEGRAM_CHAT_ID` — send any message to your bot, then open:
```
https://api.telegram.org/bot<TOKEN>/getUpdates
```
Look for `chat.id` in the response.

### 3. Run

```bash
docker-compose up --build
```

## Services

| Service | URL |
|---|---|
| Producer API | http://localhost:3000 |
| RabbitMQ UI | http://localhost:15672 (guest/guest) |

## API

### POST /messages/send

```json
{
  "eventType": "user.created",
  "payload": { "userId": "123" }
}
```

Response:

```json
{
  "success": true,
  "messageId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Local dev (without Docker)

Start RabbitMQ:

```bash
docker-compose up rabbitmq -d
```

Update `RABBITMQ_URL` in `.env` to use `localhost`:

```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

Run each service:

```bash
npm run start:dev producer
npm run start:dev consumer
npm run start:dev telegram-notifier
```

## Tests

```bash
npm run test        # unit tests
npm run test:cov    # with coverage
npm run test:e2e    # e2e
```
