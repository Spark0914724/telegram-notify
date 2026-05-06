# NestJS Microservices — RabbitMQ + Telegram

A microservice architecture built with NestJS, RabbitMQ, and Telegram Bot API.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                               │
│                  POST /messages/send                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│           Producer (HTTP :3000)         │
│  - Accepts HTTP requests                │
│  - Generates UUID messageId             │
│  - Publishes to messages_queue          │
│  - Swagger UI at /api                   │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│              RabbitMQ :5672             │
│  - messages_queue                       │
│  - notifications_queue                  │
│  - messages_dlx (dead letter exchange)  │
│  - Management UI at :15672              │
└──────────┬──────────────────────────────┘
           │                    │
           ▼                    ▼
┌──────────────────┐  ┌─────────────────────────┐
│    Consumer      │  │   Telegram Notifier      │
│                  │  │                          │
│ - Receives from  │  │ - Receives from          │
│   messages_queue │  │   notifications_queue    │
│ - Idempotency    │  │ - Sends Telegram message │
│   check (Set)    │  │   via Bot API            │
│ - Forwards to    │  │ - ack / nack to DLQ      │
│   notifications  │  └─────────────────────────┘
│   _queue         │
└──────────────────┘
```

## Project Structure

```
nestjs-microservices/
├── apps/
│   ├── producer/               # HTTP service — POST /messages/send
│   ├── consumer/               # RabbitMQ consumer — messages_queue
│   └── telegram-notifier/      # RabbitMQ consumer — notifications_queue
├── libs/
│   └── shared/                 # Shared DTOs, constants, RmqPublisherService
├── docker-compose.yml
├── .env.example
└── README.md
```

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js 20+](https://nodejs.org/) (for local development)
- A Telegram Bot token — create one via [@BotFather](https://t.me/BotFather)
- Your Telegram Chat ID — get it via [@userinfobot](https://t.me/userinfobot)

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd nestjs-microservices
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_QUEUE_MESSAGES=messages_queue
RABBITMQ_QUEUE_NOTIFICATIONS=notifications_queue
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### 3. Run with Docker

```bash
docker-compose up --build
```

To run in the background:

```bash
docker-compose up --build -d
```

To stop:

```bash
docker-compose down
```

## Services

| Service | URL | Description |
|---|---|---|
| Producer API | http://localhost:3000 | HTTP endpoint to send messages |
| Swagger UI | http://localhost:3000/api | Interactive API documentation |
| RabbitMQ Management | http://localhost:15672 | Monitor queues (guest / guest) |

## API Reference

### POST /messages/send

Publishes a message to the RabbitMQ queue.

**Request body:**
```json
{
  "eventType": "user.created",
  "payload": {
    "userId": "123",
    "email": "user@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Local Development (without Docker)

### 1. Install dependencies

```bash
npm install
```

### 2. Start RabbitMQ only via Docker

```bash
docker-compose up rabbitmq -d
```

### 3. Update `.env` for local connection

```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

### 4. Start each service in separate terminals

```bash
# Terminal 1
npm run start:dev producer

# Terminal 2
npm run start:dev consumer

# Terminal 3
npm run start:dev telegram-notifier
```

## Running Tests

### Unit tests

```bash
npm run test
```

### Unit tests with coverage

```bash
npm run test:cov
```

### e2e tests

```bash
npm run test:e2e
```

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `RABBITMQ_URL` | RabbitMQ connection URL | `amqp://guest:guest@rabbitmq:5672` |
| `RABBITMQ_QUEUE_MESSAGES` | Main messages queue name | `messages_queue` |
| `RABBITMQ_QUEUE_NOTIFICATIONS` | Notifications queue name | `notifications_queue` |
| `TELEGRAM_BOT_TOKEN` | Token from @BotFather | `123456:ABC-DEF...` |
| `TELEGRAM_CHAT_ID` | Target chat or user ID | `123456789` |

## Message Flow

1. Client sends `POST /messages/send` to the Producer
2. Producer generates a UUID, attaches timestamp, publishes to `messages_queue`
3. Consumer receives the message, checks idempotency, processes it
4. Consumer forwards the message to `notifications_queue`
5. Telegram Notifier receives from `notifications_queue` and sends a Telegram message
6. On any failure, messages are routed to the Dead Letter Queue (`messages_dlx`)
