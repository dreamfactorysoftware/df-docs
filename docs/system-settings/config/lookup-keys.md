---
sidebar_position: 4
title: Lookup Keys
id: lookup-keys
description: "Store configuration values and secrets once in DreamFactory, use them in service settings with {name}, and read them from scripts. Covers private lookups, the four lookup levels, and the System API."
keywords: [lookup keys, private lookups, secrets, global lookup keys, scripting, platform.session, service configuration]
difficulty: "beginner"
---

# Lookup Keys

A lookup key is a named value stored in DreamFactory. Use lookups to keep configuration and secrets, such as API keys, client secrets and database passwords, out of your service definitions and scripts.

## Levels and precedence

A lookup can be defined at four levels. When the same name exists at more than one level, the most specific one wins:

| Level | Where to set it | Applies to |
| ----- | --------------- | ---------- |
| User | **Users** > edit user > Lookup Keys | Requests made by that user |
| Role | **Roles** > edit role > Lookup Keys | Requests made with that role |
| App | System API only (see below) | Requests made with that app's API key |
| System | **Config** > **Global Lookup Keys** | Every request |

User beats role, role beats app, app beats system.

## Private lookups

Check **Private** to store a secret. A private lookup:

- is encrypted at rest with your `APP_KEY`
- is returned masked (`**********`) by the admin UI and the System API, so nobody can read it back
- can still be used in service configuration and read by server-side scripts

Keep `APP_KEY` safe and identical on every node. Private lookups cannot be decrypted with a different key.

## Using lookups in service configuration

Put the lookup name in curly braces in a service configuration field. DreamFactory substitutes the value when the service handles a request:

- Username: `{db_user}`
- Password: `{db_pass}`

This works for public and private lookups. See [Identity Passthrough to the Database](../../Security/identity-passthrough.md) for a full example using per-user private lookups.

## Using lookups in scripts

Scripts receive the current lookups in the platform session:

| Lookup type | Node.js | PHP |
| ----------- | ------- | --- |
| Public | `platform.session.lookup.NAME` | `$platform['session']['lookup']['NAME']` |
| Private | `platform.session.lookup_secret.NAME` | `$platform['session']['lookup_secret']['NAME']` |

This includes calls made with only an API key and no user session.

```javascript
// Node.js scripted service
var clientId = platform.session.lookup.MY_CLIENT_ID;
var secret   = platform.session.lookup_secret.MY_CLIENT_SECRET;
```

```php
// PHP scripted service
$secret = $platform['session']['lookup_secret']['MY_CLIENT_SECRET'] ?? null;
```

Treat a private lookup like any other secret inside the script. Do not return it in a response or write it to the log.

## Managing lookups with the System API

Create global lookups:

```bash
curl -X POST "https://your-df-host/api/v2/system/lookup" \
  -H "X-DreamFactory-Session-Token: <admin token>" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": [
      {"name": "MY_CLIENT_ID", "value": "abc123"},
      {"name": "MY_CLIENT_SECRET", "value": "s3cr3t", "private": true}
    ]
  }'
```

List them. Private values come back masked:

```bash
curl "https://your-df-host/api/v2/system/lookup?fields=id,name,value,private" \
  -H "X-DreamFactory-Session-Token: <admin token>"
```

```json
{
  "resource": [
    {"id": 6, "name": "MY_CLIENT_SECRET", "value": "**********", "private": true},
    {"id": 7, "name": "MY_CLIENT_ID", "value": "abc123", "private": false}
  ]
}
```

App, role and user lookups are related records on the app, role or user. For example, to add a private lookup to app 5:

```bash
curl -X PATCH "https://your-df-host/api/v2/system/app/5?related=lookup_by_app_id" \
  -H "X-DreamFactory-Session-Token: <admin token>" \
  -H "Content-Type: application/json" \
  -d '{"lookup_by_app_id": [{"name": "MY_CLIENT_SECRET", "value": "s3cr3t", "private": true}]}'
```

Roles and users work the same way with `lookup_by_role_id` and `lookup_by_user_id`. `/api/v2/system/lookup` only manages global lookups.

To change a global value, `PATCH /api/v2/system/lookup/{id}` with `{"value": "..."}`. To remove it, `DELETE /api/v2/system/lookup/{id}`.
