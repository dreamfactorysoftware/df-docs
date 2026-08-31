---
sidebar_position: 3
title: Email Registration and Password Reset
id: email-registration-and-password-reset
description: Configure DreamFactory to send user invitations, registration confirmations, and password reset emails. Covers the email service and template settings both features require.
keywords: [DreamFactory email registration, password reset email, user invite, send_invite, email template, SMTP configuration]
---

# Email Registration and Password Reset

Setting passwords by hand for every account does not scale and is not secure.
DreamFactory can instead email an invitation and let the person set their own
password. The same wiring drives password reset emails.

Neither feature works on a fresh install. Both need an email service **and** an
email template selected. Configuring the service alone is not enough.

## What you need

Three things, in order:

1. A mail transport DreamFactory can reach.
2. An Email service in DreamFactory that uses it.
3. That service **and** a template selected on the account type you care about.

## Step 1: Choose a mail transport

The recommended path is a dedicated **SMTP** service. It stores its own host,
port, credentials, and encryption, so nothing goes in `.env`. See
[SMTP](/api-generation-and-connections/api-types/email/smtp) for the fields.

A **Local Email Service** is also available. When its `Local Command` field is
empty and `MAIL_DRIVER` is `smtp`, it falls back to the Laravel mail settings in
your `.env` file:

```bash
MAIL_DRIVER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=YOUR_PASSWORD
```

SMTP is one of several delivery options. Mailgun and other providers are
available as their own service types. See
[Email Services Overview](/api-generation-and-connections/api-types/email/email-overview).

## Step 2: Create the Email service

In the admin console, open the Services list and create a service in the Email
group. Note its ID; you need it in the next step.

## Step 3: Select the service and template

This is the step most installs miss. The settings live on the service that owns
the account being invited or reset, and there is no global default.

| Account type | Where the settings live | Fields |
| --- | --- | --- |
| Non-admin users | The `user` service, **Config** tab | `invite_email_service_id`, `invite_email_template_id`, `password_email_service_id`, `password_email_template_id` |
| Admins | System-level config | The same four fields |

The two are independent. Configuring user invites does not configure admin
invites, and configuring invites does not configure password resets.

In the admin console, open the `user` service and set these on its Config tab:

- **Invite Email Service** and **Invite Email Template**
- **Password Reset Email Service** and **Password Reset Email Template**
- **Open Reg Email Service** and **Open Reg Email Template**, if you allow
  self-registration

DreamFactory ships with three templates: `User Invite Default`,
`User Registration Default`, and `Password Reset Default`. They are not applied
automatically. You must select one.

By API:

```bash
curl -X PATCH "https://<url>/api/v2/system/service/<user_service_id>" \
-H "Content-Type: application/json" \
-H "X-DreamFactory-Session-Token: <sessionToken>" \
-d '{"config":{"invite_email_service_id":12,"invite_email_template_id":1,"password_email_service_id":12,"password_email_template_id":3}}'
```

## Sending an invitation

Create the user with `send_invite=true` and omit the password. The invited
person sets their own.

```bash
curl -X POST "https://<url>/api/v2/system/user?send_invite=true" \
-H "Content-Type: application/json" \
-H "X-DreamFactory-Session-Token: <sessionToken>" \
-d '{"resource":[{"name":"Jane Doe","first_name":"Jane","last_name":"Doe","email":"jane@example.com"}]}'
```

In the admin console, check **Send email invite** when you create the account.

See [User Management](/system-settings/the-system-api/user-management) for the
full request format.

## Password reset

Once the password reset service and template are set, the reset endpoint sends
the email:

```bash
curl -X POST "https://<url>/api/v2/user/password?reset=true" \
-H "Content-Type: application/json" \
-d '{"email":"jane@example.com"}'
```

A configured instance returns `{"success": true}`. Admins use
`/api/v2/system/password` and read the system-level settings instead.

## Troubleshooting

Both features fail loudly with HTTP 500 rather than failing silently. The
message tells you which of the two settings is missing.

| Message | Cause |
| --- | --- |
| `No email service configured for user invite.` | Invite Email Service is not set |
| `No default email template for user invite.` | Invite Email Template is not set |
| `No data found in default email template for user invite.` | The selected invite template no longer exists |
| `No security question found or email confirmation available for this user. Please contact your administrator.` | Password Reset Email Service is not set, and the user has no security question |
| `No data found in default email template for password reset.` | Password Reset Email Template is not set |

If the settings look right but mail still does not arrive, the problem is the
transport, not DreamFactory. Test the Email service on its own with
`POST /api/v2/<email_service_name>` before looking further.

Fixing this for users and finding that admins still cannot reset is expected.
Set the same four fields at the system level as well.

## Next Steps

- **[SMTP](/api-generation-and-connections/api-types/email/smtp)**: Configure an SMTP email service
- **[Email Services Overview](/api-generation-and-connections/api-types/email/email-overview)**: Compare providers and delivery options
- **[User Management](/system-settings/the-system-api/user-management)**: Create, update, and delete users through the API
