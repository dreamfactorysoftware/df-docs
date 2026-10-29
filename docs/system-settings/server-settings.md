---
sidebar_position: 1
title: Server Settings
id: server-settings
description: Change the DreamFactory log level at runtime without editing .env. Covers the system/server_setting API, precedence over .env, config:cache behavior, and the audit log entry.
keywords: [DreamFactory server settings, log level, APP_LOG_LEVEL, runtime override, config:cache, system API]
---

# Server Settings

Server settings let a system administrator change selected settings at runtime, from the admin UI (**System Settings > Config > Server Settings**) or the system API, without editing `.env` or restarting.

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

Setting `log_level` changes every log channel that follows `APP_LOG_LEVEL` (such as `single`, `daily`, `syslog` and `errorlog`). Channels with their own level, such as `slack` and `stderr`, are not changed.

## `config:cache`

Overrides are applied on every boot, on top of the configuration loaded from `.env` or from the cache file. They are never written into the cache file, so you do not need to run `php artisan config:clear` after changing or removing one. Running `php artisan config:cache` or `php artisan optimize` does not bake an override into the cache.

Each request reads the stored overrides, so a change takes effect on the next request on every node. Queue and scheduler workers are long-running processes and pick up a change when they are restarted.

## API

All requests need a sys admin session. Any other caller gets `401`.

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

A caller that is not a sys admin gets:

```json
{
  "error": {
    "code": 401,
    "context": null,
    "message": "You are not authorized to perform this action.",
    "status_code": 401
  }
}
```

## Admin UI

The Server Settings page shows each setting with a badge for where the value comes from: `.env` or `override`. Pick a value and select **Save**, or select **Reset to .env value** to remove the override. System Info shows the new level after a save.

## Audit log

Each change writes a `notice` entry to the DreamFactory log before the new value applies. It records the setting, the old and new values, and the user id:

```
[2026-10-28 12:00:00] production.NOTICE: Server setting changed {"setting":"log_level","from":"warning","to":"debug","user_id":1}
```

The setting's row also keeps who changed it last and when. The entry is only written while the log level is `notice` or lower, so a level of `error` or higher drops it. Values are never secrets, because only allow-listed settings can be changed.
