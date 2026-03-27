# Real-Time Employee Chat & Announcements Platform

A serverless, Slack-like messaging platform for organizations built entirely on AWS. Employees can send direct messages, communicate in department channels, and receive company-wide announcements from HR — all in real time with no servers to manage.

## Architecture

- **API Gateway WebSocket API** — manages persistent connections for real-time messaging
- **AWS Lambda** — 5 functions handle connect, disconnect, message routing, announcements, and post-confirmation
- **Amazon DynamoDB** — stores active connections (TTL: 24hrs) and message history (last 50 per channel)
- **Amazon SNS** — fan-out for HR broadcast announcements
- **Amazon SES** — email delivery for company-wide announcements
- **Amazon Cognito** — JWT-based authentication; token validated at $connect
- **Amazon S3 + CloudFront** — static frontend hosting with HTTPS

## Lambda Functions

| Function | Purpose |
|---|---|
| `connect_lambda.py` | Validates Cognito JWT, stores connectionId in DynamoDB |
| `disconnet_lambda.py` | Removes connection record on disconnect |
| `send_messages.py` | Routes messages to target channel/DM recipients |
| `broadcast-annou_lambda.py` | Pushes HR announcements to all active WebSocket connections |
| `chat-announe_publish_lambda.py` | Publishes announcement to SNS (triggers email + WebSocket broadcast) |
| `post_confirmation_lambda.py` | Cognito post-confirmation trigger for user setup |

## Key Features

- Real-time messaging via WebSocket (no polling)
- Department channels and direct messaging
- HR broadcast system with SNS fan-out to email (SES) and live connections simultaneously
- Priority flags on announcements (normal / urgent) with frontend styling changes
- Offline message delivery — history loaded from DynamoDB on reconnect
- Auto-reconnect with exponential backoff if WebSocket drops
- All traffic over WSS (TLS); frontend served over HTTPS

## Security

- Cognito JWT validated at `$connect` — unauthenticated connections rejected with 401
- IAM roles scoped per Lambda (least-privilege)
- S3 bucket private; content served only via CloudFront

## Tech Stack

`AWS Lambda` `API Gateway WebSocket` `DynamoDB` `SNS` `SES` `Cognito` `S3` `CloudFront` `Python` `JavaScript`
