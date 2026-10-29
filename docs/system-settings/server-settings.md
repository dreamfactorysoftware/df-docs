---
sidebar_position: 1
title: Server Settings
id: server-settings
description: Change the DreamFactory log level at runtime without editing .env. Covers the system/server_setting API, precedence over .env, config:cache behavior, and the audit log entry.
keywords: [DreamFactory server settings, log level, APP_LOG_LEVEL, runtime override, config:cache, system API]
---

# Server Settings

Server settings let an administrator change selected settings at runtime, from the admin UI (**System Settings > Config > Server Settings**) or the system API, without editing `.env` or restarting.

Only an allow-listed set of settings can be changed. Today that is:

| Setting | Allowed values | `.env` default |
|---------|----------------|----------------|
| `log_level` | `debug`, `info`, `notice`, `warning`, `error`, `critical`, `alert`, `emergency` | `APP_LOG_LEVEL` |

Secrets and database settings (`APP_KEY`, `DB_*`, and so on) are never overridable. They stay in `.env`.

## Precedence

An override stored by DreamFactory wins over the `.env` value. Removing the override puts the `.env` value back in effect.

| `.env` (`APP_LOG_LEVEL`) | Override | Effective level |
|--------------------------|----------|-----------------|
| `info` | none | `info` |
| `info` | `debug` | `debug` |
| `info` | removed | `info` |

Setting `log_level` changes the four stock log channels that follow `APP_LOG_LEVEL`: `single`, `daily`, `syslog` and `errorlog`. The `stack` channel picks the new level up through them. Channels with their own level, such as `slack` and `stderr`, are not changed.

## `config:cache`

Overrides are applied on every boot, on top of the configuration loaded from `.env` or from the cache file. They are never written into the cache file, so you do not need to run `php artisan config:clear` after changing or removing one. Running `php artisan config:cache` or `php artisan optimize` does not bake an override into the cache.

Stored overrides are kept in the DreamFactory cache for 60 seconds, so a request does not query the database for them. A change takes effect immediately on the node that served it. Other nodes pick it up as follows:

- Each node has its own cache (the `file` or `array` driver): within 60 seconds.
- Nodes share a cache (`redis`, `memcached` or `database`): on their next request.

Queue and scheduler workers are long-running processes and pick up a change when they are restarted.

## API

Access is role-based, like any other system resource:

- Full administrators have access.
- Restricted administrators have access through the **Config** tab. Any other role needs `server_setting/*` on the `system` service. Restricted administrators created before this setting existed keep their Config tab but do not have `server_setting/*` until it is added to their role.
- Every other caller gets `403`. A missing, expired or invalid session token is rejected before the role is checked.

List settings:

```bash
curl -s https://df.example.com/api/v2/system/server_setting \
  -H "X-DreamFactory-Session-Token: <token>"
```

```json
{
  "resource": [
    {
      "name": "log_level",
      "label": "Log level",
      "value": "warning",
      "env_value": "warning",
      "source": "env",
      "allowed_values": ["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"]
    }
  ]
}
```

`source` is `env` when the `.env` value is in effect and `override` when a stored override is. `value` is the effective value and `env_value` is the `.env` one.

Override the log level:

```bash
curl -s -X PATCH https://df.example.com/api/v2/system/server_setting/log_level \
  -H "X-DreamFactory-Session-Token: <token>" \
  -H "Content-Type: application/json" \
  -d '{"value":"debug"}'
```

```json
{
  "name": "log_level",
  "label": "Log level",
  "value": "debug",
  "env_value": "warning",
  "source": "override",
  "allowed_values": ["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"]
}
```

An unknown setting name returns `404`. An invalid value returns `400` and names the setting.

Remove the override and go back to the `.env` value:

```bash
curl -s -X DELETE https://df.example.com/api/v2/system/server_setting/log_level \
  -H "X-DreamFactory-Session-Token: <token>"
```

The response is the same row with `"source": "env"`.

A caller whose role does not include `server_setting/*` gets:

```json
{
  "error": {
    "code": 403,
    "context": null,
    "message": "Access Forbidden. GET access to component 'server_setting' of service 'system' is not allowed by this user's role.",
    "status_code": 403
  }
}
```

## Admin UI

The Server Settings page shows each setting with a badge for where the value comes from: `.env` or `override`. Pick a value and select **Save**, or select **Reset to .env value** to remove the override. System Info shows the new level after a save.

## Audit log

Each successful change or reset writes a `notice` entry to `storage/logs/dreamfactory.log`. The entry is written to its own log channel at a fixed level, so it is recorded whatever log level is in effect, including the stock `warning`. It records the setting, the old and new values, and the user id:

```
[2026-10-28 12:00:00] production.NOTICE: Server setting changed {"setting":"log_level","from":"warning","to":"debug","user_id":1}
```

The setting's row also keeps who changed it last and when. Requests that are rejected, such as an invalid value, are not logged, and neither is a reset or save that leaves the value unchanged. Values are never secrets, because only allow-listed settings can be changed.
