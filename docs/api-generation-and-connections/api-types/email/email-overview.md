---
sidebar_position: 1
title: Email Overview
id: email-overview
description: "Supported email services in DreamFactory - SMTP, transactional email providers, and email API configuration"
keywords: [email, SMTP, email API, transactional email, SendGrid, Mailgun, email service]
difficulty: "beginner"
---

# Email Services Overview

DreamFactory provides email services for sending transactional emails through your APIs. Connect SMTP servers or cloud email providers to enable email functionality in your applications without exposing credentials to clients.

---

## Supported Email Services

| Service | Type | Use Case | Documentation |
| ------- | ---- | -------- | ------------- |
| **SMTP** | Protocol | Any SMTP server | [SMTP Guide](./smtp) |
| **Mailgun** | API | Transactional email | Commercial license |
| **SendGrid** | API | Transactional email | Commercial license |
| **Amazon SES** | API | AWS email service | Commercial license |
| **Mandrill** | API | Mailchimp transactional | Commercial license |
| **SparkPost** | API | High-volume email | Commercial license |
| **Local** | File | Development/testing | Built-in |

:::info[Licensing]
SMTP is included in DreamFactory OSS. Cloud email provider connectors (Mailgun, SendGrid, SES, etc.) require a commercial license.
:::

---

## Email Use Cases

### Transactional Email

Send automated emails triggered by application events:

- **User registration**: Welcome emails, email verification
- **Password reset**: Secure reset links
- **Order confirmations**: E-commerce receipts
- **Notifications**: Alerts, reminders, updates
- **Reports**: Scheduled report delivery

### API-Driven Email

Send emails directly through the DreamFactory API:

```bash
curl -X POST "https://example.com/api/v2/email" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{"email": "user@example.com", "name": "John Doe"}],
    "subject": "Your Order Confirmation",
    "body_html": "<h1>Thank you for your order!</h1>",
    "body_text": "Thank you for your order!"
  }'
```

---

## Choosing an Email Service

### SMTP vs API Providers

| Factor | SMTP | API Providers |
| ------ | ---- | ------------- |
| Setup complexity | Medium | Simple |
| Deliverability | Depends on server reputation | Optimized |
| Rate limits | Server-dependent | Plan-dependent |
| Analytics | Basic (logs) | Detailed (opens, clicks) |
| Cost | Server hosting | Per-email pricing |
| Reliability | Self-managed | Provider SLA |

### Provider Comparison

| Provider | Best For | Pricing Model |
| -------- | -------- | ------------- |
| **SMTP (self-hosted)** | Full control, existing infrastructure | Server costs only |
| **Amazon SES** | AWS infrastructure, high volume, low cost | $0.10/1,000 emails |
| **SendGrid** | Developer-friendly, good deliverability | Free tier + paid plans |
| **Mailgun** | Developers, API-first approach | Pay-as-you-go |
| **SparkPost** | Enterprise, high-volume senders | Enterprise pricing |

### Recommendations

| Scenario | Recommended Service |
| -------- | ------------------- |
| Development/testing | Local or SMTP (Mailtrap) |
| Small applications | SendGrid free tier |
| AWS infrastructure | Amazon SES |
| High deliverability needs | Mailgun, SendGrid |
| Enterprise/high-volume | SparkPost, Amazon SES |

---

## Email Service Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   API Client    │────▶│   DreamFactory   │────▶│  Email Service  │
│  (App/Script)   │◀────│   (Email API)    │     │  (SMTP/API)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
    HTTP Request             Send Email              Deliver Email
    + API Key                via configured              to inbox
                             service
```

### Key Benefits

1. **Credential protection**: SMTP/API credentials never exposed to clients
2. **Unified interface**: Same API regardless of backend provider
3. **Access control**: Role-based email permissions
4. **Audit logging**: Track all sent emails
5. **Rate limiting**: Prevent email abuse

---

## Common Configuration Options

All email services share these configuration fields:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `name` | string | Service name (used in API URL) |
| `label` | string | Display name in admin console |
| `description` | string | Service description |
| `from_name` | string | Default sender name |
| `from_email` | string | Default sender email address |
| `reply_to_name` | string | Default reply-to name |
| `reply_to_email` | string | Default reply-to address |

---

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/api/v2/{service}` | Send an email |
| `GET` | `/api/v2/{service}` | Get service configuration (admin only) |

---

## Email Request Format

### Basic Email

```json
{
  "to": [
    {"email": "recipient@example.com", "name": "Recipient Name"}
  ],
  "subject": "Email Subject",
  "body_text": "Plain text email body",
  "body_html": "<h1>HTML email body</h1>"
}
```

### Full Email Options

```json
{
  "to": [
    {"email": "recipient@example.com", "name": "Recipient"}
  ],
  "cc": [
    {"email": "cc@example.com", "name": "CC Recipient"}
  ],
  "bcc": [
    {"email": "bcc@example.com", "name": "BCC Recipient"}
  ],
  "from_name": "Sender Name",
  "from_email": "sender@example.com",
  "reply_to_name": "Reply Handler",
  "reply_to_email": "reply@example.com",
  "subject": "Email Subject",
  "body_text": "Plain text version",
  "body_html": "<html><body><h1>HTML version</h1></body></html>",
  "attachments": [
    {
      "name": "document.pdf",
      "content": "base64_encoded_content",
      "content_type": "application/pdf"
    }
  ]
}
```

### Email Fields

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `to` | array | Yes | List of recipient objects |
| `subject` | string | Yes | Email subject line |
| `body_text` | string | No* | Plain text email body |
| `body_html` | string | No* | HTML email body |
| `from_name` | string | No | Override default sender name |
| `from_email` | string | No | Override default sender email |
| `cc` | array | No | Carbon copy recipients |
| `bcc` | array | No | Blind carbon copy recipients |
| `reply_to_name` | string | No | Reply-to name |
| `reply_to_email` | string | No | Reply-to email |
| `attachments` | array | No | File attachments |

*At least one of `body_text` or `body_html` is required.

---

## Email Templates

For consistent branding, use templated emails:

### Simple Variable Replacement

Use placeholders in your email body:

```json
{
  "to": [{"email": "user@example.com"}],
  "subject": "Welcome, {first_name}!",
  "body_html": "<h1>Welcome to {company_name}</h1><p>Hello {first_name},</p>",
  "template_data": {
    "first_name": "John",
    "company_name": "Acme Corp"
  }
}
```

### Provider Templates

Some providers (SendGrid, Mailgun) support server-side templates:

```json
{
  "to": [{"email": "user@example.com"}],
  "template_id": "welcome-email-v2",
  "template_data": {
    "first_name": "John"
  }
}
```

---

## Security Best Practices

### Sender Authentication

Configure SPF, DKIM, and DMARC for your sending domain:

1. **SPF**: Authorize sending servers
2. **DKIM**: Sign emails cryptographically
3. **DMARC**: Policy for failed authentication

### Rate Limiting

Apply rate limits to prevent abuse:

| User Type | Recommended Limit |
| --------- | ----------------- |
| Regular users | 10 emails/hour |
| Power users | 100 emails/hour |
| Service accounts | Based on needs |

### Role-Based Access

Restrict email sending by role:

1. Navigate to **Roles** in admin console
2. Configure email service access
3. Limit recipients or templates if needed

---

## Common Errors

| Error Code | Message | Cause | Solution |
| ---------- | ------- | ----- | -------- |
| 400 | Bad Request | Invalid email format | Check recipient addresses |
| 401 | Unauthorized | Missing API key | Add API key header |
| 403 | Forbidden | Email sending not permitted | Check role permissions |
| 422 | Unprocessable Entity | Missing required fields | Include to, subject, body |
| 500 | Service Error | Email service failure | Check service configuration |
| 503 | Service Unavailable | SMTP/API unreachable | Check credentials and connectivity |

---

## Development and Testing

### Local Email Service

The `local` email driver saves emails to files instead of sending:

```env
MAIL_DRIVER=local
```

Emails are saved to `storage/logs/` for inspection.

### Email Testing Services

Use these services to test without sending real emails:

| Service | Description |
| ------- | ----------- |
| [Mailtrap](https://mailtrap.io) | Fake SMTP server for testing |
| [MailHog](https://github.com/mailhog/MailHog) | Self-hosted email testing |
| [Mailcatcher](https://mailcatcher.me) | Local SMTP with web UI |

---

## Next Steps

- **[SMTP](./smtp)**: Configure SMTP email service
- **[Role-Based Access Control](/api-security/rbac)**: Restrict email permissions
- **[Rate Limiting](/api-security/rate-limiting)**: Prevent email abuse
