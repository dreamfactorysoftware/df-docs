---
sidebar_position: 2
title: SMTP
id: smtp
description: "Configure SMTP email service in DreamFactory for sending transactional emails through any SMTP server"
keywords: [SMTP, email, email API, transactional email, mail server, email configuration]
difficulty: "intermediate"
---

# SMTP

SMTP (Simple Mail Transfer Protocol) is the standard protocol for sending emails. DreamFactory's SMTP connector allows you to send emails through any SMTP server, including Gmail, Microsoft 365, Amazon SES, or your own mail server.

---

## Use Cases

- **Transactional emails**: Order confirmations, password resets, notifications
- **User communications**: Welcome emails, account updates
- **Automated reports**: Scheduled email delivery
- **Integration**: Connect existing SMTP infrastructure to your API

---

## Prerequisites

You need access to an SMTP server:

| Provider | SMTP Server | Port | Security |
| -------- | ----------- | ---- | -------- |
| Gmail | smtp.gmail.com | 587 | TLS |
| Microsoft 365 | smtp.office365.com | 587 | TLS |
| Amazon SES | email-smtp.`{region}`.amazonaws.com | 587 | TLS |
| Yahoo | smtp.mail.yahoo.com | 587 | TLS |
| Self-hosted | Your server | 25/465/587 | Varies |

:::note[Gmail/Google Workspace]
Gmail requires an "App Password" when 2-factor authentication is enabled. Regular passwords will not work. Create an App Password at https://myaccount.google.com/apppasswords
:::

---

## Creating an SMTP Email Service

### Step 1: Navigate to API Generation

Log in to your DreamFactory instance and select **API Generation & Connections**. Set API Type to **Email**.

### Step 2: Create New Service

Click the plus button and select **SMTP Email Service**.

### Step 3: Configure Service Details

| Field | Description | Example |
| ----- | ----------- | ------- |
| Name | Service name (used in API URL) | `email` |
| Label | Display name | `SMTP Email` |
| Description | Service description | `Transactional email service` |

### Step 4: Configure SMTP Settings

| Field | Required | Description |
| ----- | -------- | ----------- |
| Host | Yes | SMTP server hostname |
| Port | Yes | SMTP port (25, 465, or 587) |
| Encryption | No | `tls`, `ssl`, or none |
| Username | Yes* | SMTP authentication username |
| Password | Yes* | SMTP authentication password |

*Required for authenticated SMTP servers (most providers).

### Step 5: Configure Sender Defaults

| Field | Description |
| ----- | ----------- |
| Default From Name | Sender name for emails |
| Default From Email | Sender email address |
| Default Reply-To Name | Reply-to name |
| Default Reply-To Email | Reply-to email address |

### Step 6: Save and Test

Save the service, then send a test email using the API Docs.

---

## Configuration Options

### Required Settings

| Field | Type | Description |
| ----- | ---- | ----------- |
| `host` | string | SMTP server hostname |

### Optional Settings

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `port` | integer | `587` | SMTP port |
| `encryption` | string | - | Encryption type (`tls` or `ssl`). Leave empty to disable. |
| `username` | string | - | SMTP authentication username |
| `password` | string | - | SMTP authentication password |

### Provider-Specific Configuration

**Gmail:**
```
Host: smtp.gmail.com
Port: 587
Encryption: tls
Username: your_email@gmail.com
Password: your_app_password
```

**Microsoft 365:**
```
Host: smtp.office365.com
Port: 587
Encryption: tls
Username: your_email@domain.com
Password: your_password
```

**Amazon SES:**
```
Host: email-smtp.us-east-1.amazonaws.com
Port: 587
Encryption: tls
Username: SMTP_USERNAME (from SES console)
Password: SMTP_PASSWORD (from SES console)
```

---

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/api/v2/{service}` | Send an email |

---

## API Examples

### Send a Basic Email

```bash
curl -X POST "https://example.com/api/v2/email" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [
      {"email": "recipient@example.com", "name": "John Doe"}
    ],
    "subject": "Test Email",
    "body_text": "This is a test email sent via DreamFactory."
  }'
```

**Response:**
```json
{
  "count": 1
}
```

### Send HTML Email

```bash
curl -X POST "https://example.com/api/v2/email" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [
      {"email": "recipient@example.com", "name": "John Doe"}
    ],
    "subject": "Your Order Confirmation",
    "body_html": "<html><body><h1>Order Confirmed</h1><p>Thank you for your order #12345.</p></body></html>",
    "body_text": "Order Confirmed\n\nThank you for your order #12345."
  }'
```

### Send to Multiple Recipients

```bash
curl -X POST "https://example.com/api/v2/email" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [
      {"email": "user1@example.com", "name": "User One"},
      {"email": "user2@example.com", "name": "User Two"}
    ],
    "cc": [
      {"email": "manager@example.com", "name": "Manager"}
    ],
    "bcc": [
      {"email": "archive@example.com"}
    ],
    "subject": "Team Update",
    "body_text": "Here is the weekly team update..."
  }'
```

### Send with Custom Sender

```bash
curl -X POST "https://example.com/api/v2/email" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [
      {"email": "customer@example.com"}
    ],
    "from_name": "Support Team",
    "from_email": "support@mycompany.com",
    "reply_to_email": "support@mycompany.com",
    "subject": "Re: Your Support Request",
    "body_text": "Thank you for contacting support..."
  }'
```

### Send with Attachments

```bash
curl -X POST "https://example.com/api/v2/email" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [
      {"email": "recipient@example.com"}
    ],
    "subject": "Invoice Attached",
    "body_text": "Please find your invoice attached.",
    "attachments": [
      {
        "name": "invoice-2026-001.pdf",
        "content": "JVBERi0xLjQKJeLjz9MKMSAwIG9i...",
        "content_type": "application/pdf"
      }
    ]
  }'
```

The `content` field must be Base64-encoded. Encode a file:

```bash
base64 invoice.pdf | tr -d '\n'
```

---

## Email Templates with Variables

Include dynamic content using placeholders:

```bash
curl -X POST "https://example.com/api/v2/email" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [
      {"email": "user@example.com"}
    ],
    "subject": "Welcome, {first_name}!",
    "body_html": "<h1>Welcome to {company_name}</h1><p>Hello {first_name},</p><p>Your account is ready.</p>",
    "body_text": "Welcome to {company_name}\n\nHello {first_name},\n\nYour account is ready.",
    "template_data": {
      "first_name": "John",
      "company_name": "Acme Corp"
    }
  }'
```

---

## SMTP Port and Encryption

| Port | Encryption | Description |
| ---- | ---------- | ----------- |
| 25 | None | Unencrypted (not recommended) |
| 465 | SSL | Implicit TLS (legacy) |
| 587 | TLS | STARTTLS (recommended) |

### Encryption Types

- **TLS (STARTTLS)**: Starts unencrypted, upgrades to encrypted. Use port 587.
- **SSL**: Encrypted from the start. Use port 465.
- **None**: Unencrypted. Only use for local development.

---

## Authentication Methods

### Username/Password

Most common method. Use your email credentials or app-specific password.

### OAuth2 (Microsoft 365)

For Microsoft 365 with modern authentication, you may need to configure OAuth2 instead of basic authentication.

### AWS SES Credentials

For Amazon SES, generate SMTP credentials in the SES console (different from IAM credentials).

---

## Common Errors

| Error Code | Message | Cause | Solution |
| ---------- | ------- | ----- | -------- |
| 400 | Bad Request | Invalid email format | Check recipient addresses |
| 401 | Unauthorized | Missing API key | Add DreamFactory API key |
| 500 | Authentication failed | Wrong SMTP credentials | Verify username/password |
| 500 | Connection refused | Wrong host/port | Check SMTP server settings |
| 500 | Connection timed out | Firewall blocking | Allow outbound SMTP ports |
| 500 | Certificate error | TLS issue | Check encryption setting |

### Troubleshooting

**Authentication Failed:**
1. Verify username and password are correct
2. For Gmail: Use an App Password, not your regular password
3. Check if account has 2FA enabled (requires app password)
4. Verify the account allows SMTP access

**Connection Refused:**
1. Verify the SMTP host is correct
2. Check the port matches the encryption type
3. Ensure firewall allows outbound connections on the port

**TLS/SSL Errors:**
1. Match encryption setting with port (587 = TLS, 465 = SSL)
2. Check server certificate validity
3. Try `tls` instead of `ssl` or vice versa

### Test SMTP Connection

From the command line:

```bash
# Test TLS connection (port 587)
openssl s_client -starttls smtp -connect smtp.gmail.com:587

# Test SSL connection (port 465)
openssl s_client -connect smtp.gmail.com:465
```

---

## Rate Limits

SMTP providers enforce sending limits:

| Provider | Limit |
| -------- | ----- |
| Gmail (free) | 500/day |
| Google Workspace | 2,000/day |
| Microsoft 365 | 10,000/day |
| Amazon SES | Based on account |

### Handling Rate Limits

1. **Monitor usage** to stay within limits
2. **Queue emails** for gradual sending
3. **Use dedicated email service** for high volume

---

## Security Best Practices

### Credential Security

- Store SMTP passwords in DreamFactory, never in client code
- Use app-specific passwords when available
- Rotate credentials periodically

### Sender Authentication

Configure these DNS records for better deliverability:

1. **SPF**: Authorize your SMTP server to send for your domain
2. **DKIM**: Sign emails cryptographically
3. **DMARC**: Policy for handling authentication failures

### Access Control

Configure role-based access:

1. Limit which roles can send email
2. Restrict sender addresses if needed
3. Apply rate limiting per role

---

## PHP Mail Configuration

For DreamFactory installations using PHP's mail configuration, set these in `.env`:

```env
MAIL_DRIVER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME=DreamFactory
```

---

## Next Steps

- **[Email Overview](./email-overview)**: Compare email service options
- **[Role-Based Access Control](/api-security/rbac)**: Restrict email permissions
- **[Rate Limiting](/api-security/rate-limiting)**: Prevent email abuse
