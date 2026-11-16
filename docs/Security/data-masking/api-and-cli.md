---
sidebar_position: 10
title: API and CLI reference
id: api-and-cli
description: "Reference for the system/data_masking and system/security_baseline APIs and every php artisan df:masking command, with bodies, responses and errors."
keywords: [data masking, API reference, system/data_masking, system/security_baseline, df:masking, artisan, CLI, compliance baselines, error messages, REST]
difficulty: advanced
---

# API and CLI reference

Everything in **Security > Data Masking** and **Security > Compliance** is also available through two system APIs and one artisan command. This page lists every endpoint and subcommand with its request, response and errors. Error messages are quoted exactly as the server sends them.

## Quick reference

| Concept | Description |
|---|---|
| **Data Masking API** | `/api/v2/system/data_masking` |
| **Compliance API** | `/api/v2/system/security_baseline` |
| **Who can call** | Full system administrators only, with an admin session token |
| **License** | Gold |
| **Format** | JSON with snake_case keys. On `data_masking`, `PUT` is accepted as an alias of `PATCH`. |
| **Errors** | DreamFactory's standard error envelope |
| **AI and MCP sessions** | Read only: every write gets 403 |
| **Audit** | Every change, and every blocked write, is recorded in the [activity log](./activity.md) |
| **Command line** | `php artisan df:masking`, run by the operator; changes are recorded as "Command line" |

## Rules for both APIs

### Authentication

Both APIs accept only **full system administrators**: active admins with no role. Sign in with `POST /api/v2/system/admin/session` (see the [System API reference](../../api-reference/system-api.md)) and send the session token on every call:

```bash
curl "https://your-dreamfactory-instance.com/api/v2/system/data_masking" \
  -H "X-DreamFactory-Session-Token: <admin session token>"
```

An API key alone is not enough. Callers that are not full system administrators get 403 from Data Masking even when DreamFactory's role-based access lets them through, for example:

- a user or app whose role was given access to the `system` service
- a restricted admin (an admin with a role, from df-compliance)

| Status | Message |
|---|---|
| 403 | `Only a system administrator can view Data Masking settings.` |
| 403 | `Only a system administrator can change Data Masking settings.` |
| 403 | `Only a system administrator can view Compliance baselines.` |
| 403 | `Only a system administrator can change Compliance baselines.` |

A refused write is recorded in the activity log as "Blocked an attempt to change Data Masking settings by a caller that is not a system administrator" (or "Compliance baselines").

### The super admin

Changes that loosen masking need the **super admin**: the df-compliance root admin, or every full system admin when none is designated. These are raising admin access, giving a grant or extending one, setting AI sessions to "same as admins", enabling a role or widening it to all classes, and lowering the mode from On. Other admins get 403 `Only the super admin can give access.` or `Only the super admin can lower the masking mode.`

Any full system admin can tighten, start scans, decide columns (including **Not sensitive**), change mask formats, add and delete rules, and apply or stop baselines. See [Who sees real values](./access.md).

### AI and MCP sessions

A request counts as an AI session when it carries a non-empty `X-DreamFactory-Trace-Id` header (the MCP servers and AI Chat send one), or comes from an AI agent's key or AI Chat. AI sessions can read both APIs. Every other verb (`POST`, `PATCH`, `PUT`, `DELETE`), including `POST /scan` and `POST /rule/test`, gets 403 before anything runs:

| Status | Message |
|---|---|
| 403 | `AI sessions cannot change Data Masking settings.` |
| 403 | `AI sessions cannot change compliance baselines.` |

The attempt is recorded under **Blocked** in the activity log, in every mode, Off included.

:::warning[Don't forward X-DreamFactory-Trace-Id from your own scripts]
DreamFactory returns an `X-DreamFactory-Trace-Id` header on every response. An automation script or gateway that copies it into later requests is treated as an AI session, so its settings changes get 403, and its data reads are masked as an AI session's.
:::

### Errors

Errors use DreamFactory's standard envelope:

```json
{
  "error": {
    "code": 409,
    "context": null,
    "message": "Scan your databases before turning masking on.",
    "status_code": 409
  }
}
```

These errors can come from any `data_masking` endpoint:

| Status | Message | When |
|---|---|---|
| 503 | `Data Masking is not set up yet. Run: php artisan df:masking setup` | The package is installed but its tables are not. See [Install and operate](./operations.md#first-time-setup). |
| 400 | `<Verb> is not supported on system/data_masking/<path>.`, for example `Post is not supported on system/data_masking/mask.` | A method the path doesn't support |
| 404 | `Resource '<name>' not found.` | `GET` on an unknown sub-resource |

## Data Masking API

Paths below are relative to `/api/v2/system/data_masking`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | Overview: mode, scan state, counts, your access, coverage |
| `PATCH` | `/` | Set the mode |
| `GET` | `/table` | Classified tables per covered database |
| `GET` | `/column?service=&table=` | Classified columns, with evidence and a masked example |
| `PATCH` | `/column` or `/column/{id}` | Decide a column |
| `POST` | `/scan` | Start a background scan |
| `GET`, `PATCH` | `/access` | Who sees real values |
| `GET`, `PATCH` | `/mask` | Mask format per class |
| `GET`, `POST` | `/rule` | Custom detection rules |
| `DELETE` | `/rule/{id}` | Delete a custom rule |
| `POST` | `/rule/test` | Show which columns a pattern matches |
| `GET` | `/rule/builtin` | Built-in detectors per class |
| `GET` | `/activity?kind=&limit=&before=` | The activity log |

### Overview and mode

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET` | `/` | | The overview |
| `PATCH` | `/` | `{"mode": "off"}`, `{"mode": "preview"}` or `{"mode": "on"}` | The overview |

**`GET /`** returns the state of the whole feature. The example comes from the Acme Health instance with masking On:

```json
{
  "mode": "on",
  "scan": {
    "status": "idle",
    "progress": null,
    "finished_at": "2026-11-16T19:42:32Z",
    "columns": 65,
    "last_status": "done",
    "failed": [],
    "unknown": false
  },
  "counts": {
    "masked": 31,
    "review": 0,
    "clear": 34
  },
  "you": {
    "can_grant": true,
    "sees_real_values": false,
    "grant_expires_at": null
  },
  "coverage": {
    "covered": [
      { "service": "billing", "label": "Billing", "type": "mysql" },
      { "service": "db", "label": "Local SQL Database", "type": "sqlite" },
      { "service": "hr", "label": "HR", "type": "sqlsrv" },
      { "service": "patients", "label": "Patient records", "type": "pgsql" }
    ],
    "uncovered": []
  }
}
```

| Field | Description |
|---|---|
| `mode` | `off`, `preview` or `on` |
| `scan.status` | `idle` or `running` |
| `scan.progress` | 0 to 100 while a scan runs, otherwise `null` |
| `scan.finished_at` | When the latest successful scan finished (UTC), or `null` |
| `scan.columns` | Columns Data Masking has classified |
| `scan.last_status` | How the latest finished scan ended: `done`, `partial` (some databases could not be read), `failed`, or `null` (never scanned) |
| `scan.failed` | The databases the latest scan could not read: `service_id`, `service`, `label` and a `reason` that carries no data, such as `Could not connect (SQLSTATE HY000)` |
| `scan.unknown` | `true` when the scan history could not be read. The other `scan` fields then say nothing about past scans. |
| `counts` | `masked`, `review` and `clear` columns in covered databases. A column is in exactly one of them. |
| `you.can_grant` | `true` when you are the super admin |
| `you.sees_real_values` | `true` when you currently get real values |
| `you.grant_expires_at` | When your grant ends, while admin access is "selected" |
| `coverage.covered` | SQL database services Data Masking masks |
| `coverage.uncovered` | Other database services (MongoDB, Cassandra, DynamoDB and so on). They are not masked, and AI sessions are blocked from them while the mode is On. |

**`PATCH /`** sets the mode and returns the overview:

```bash
curl -X PATCH "https://your-dreamfactory-instance.com/api/v2/system/data_masking" \
  -H "X-DreamFactory-Session-Token: <admin session token>" \
  -H "Content-Type: application/json" \
  -d '{"mode": "on"}'
```

- **On** needs a completed scan that found at least one column. A scan of empty databases doesn't count.
- **Lowering from On** (to Preview or Off) needs the super admin. Raising the mode, and switching between Preview and Off, are always allowed.
- **Off before the first scan stays Off.** Normally the first scan that finds columns moves the mode to Preview; sending a mode first records your choice, and the scan leaves it alone.
- The change is recorded as `Masking set to On` (or Off, Preview). Sending the current mode records nothing in the activity log.

| Status | Message |
|---|---|
| 400 | `Invalid mode. Use 'off', 'preview' or 'on'.` |
| 403 | `Only the super admin can lower the masking mode.` |
| 409 | `Scan your databases before turning masking on.` |

### Tables

| Method | Path | Returns |
|---|---|---|
| `GET` | `/table` | One entry per covered database, with its classified tables |

```json
{
  "resource": [
    {
      "service": "patients",
      "label": "Patient records",
      "scanned_at": "2026-11-16T19:42:32Z",
      "scan_error": null,
      "scan_unknown": false,
      "tables": [
        {
          "name": "appointments",
          "rows": null,
          "columns": { "masked": 1, "review": 0, "clear": 6 },
          "strip": [
            { "column": "id", "mark": "clear", "tier": null },
            { "column": "patient_id", "mark": "clear", "tier": null },
            { "column": "appointment_date", "mark": "clear", "tier": null },
            { "column": "department", "mark": "clear", "tier": null },
            { "column": "visit_reason", "mark": "clear", "tier": null },
            { "column": "status", "mark": "clear", "tier": null },
            { "column": "callback", "mark": "identity", "tier": "identity" }
          ]
        }
      ]
    }
  ]
}
```

The example shows one database and one table.

| Field | Description |
|---|---|
| `scanned_at` | When the database was last scanned, or `null` if never. A scanned empty database has `scanned_at` set and `"tables": []`. |
| `scan_error` | Why the latest scan of this database failed (no data values), or `null` |
| `scan_unknown` | `true` when the scan history could not be read |
| `tables[].rows` | Not filled in this release (`null`) |
| `tables[].columns` | Column counts per verdict |
| `tables[].strip` | Every column in table order. `mark` is `review`, `clear`, or the tier of a masked column: `restricted`, `identity`, `quasi` or `free_text`. |

### Columns

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET` | `/column?service=&table=` | | `{"resource": [ ...columns ]}` |
| `PATCH` | `/column` | `{"id": "service.table.column", "class": "<class id>"}` or `"class": null` | The column |
| `PATCH` | `/column/{id}` | `{"class": "<class id>"}` or `{"class": null}` | The column |

**`GET /column`** lists classified columns. Both parameters are optional: without `service` you get every covered database, and `table` matches table names exactly. This is the `callback` column from the Acme Health story, after an admin chose **Keep masked**:

```json
{
  "id": "patients.appointments.callback",
  "service": "patients",
  "table": "appointments",
  "column": "callback",
  "type": "character varying(40)",
  "verdict": "masked",
  "class": "phone",
  "tier": "identity",
  "source": "admin",
  "decided_by": "Alex Rivera",
  "decided_at": "2026-11-16T19:40:44Z",
  "confidence": 45,
  "example": "PHONE_b68ec8f3",
  "format": "token",
  "evidence": {
    "total": 45,
    "threshold_mask": 70,
    "threshold_review": 40,
    "lines": [
      { "points": 0, "kind": "name", "text": "Column name \"callback\" matches no class" },
      { "points": 45, "kind": "values", "text": "205 of 256 values are formatted phone numbers" }
    ],
    "shapes": [
      ["(999) 999-9999", 80],
      ["Aa+ a+", 10],
      ["Aa+ a+ a+", 5]
    ]
  }
}
```

| Field | Description |
|---|---|
| `id` | `service.table.column` |
| `type` | The database type |
| `verdict` | `masked`, `review` (masked while On, waiting for a decision) or `clear` (not sensitive) |
| `class`, `tier` | The class id and its tier; `null` when the column is not sensitive |
| `source` | `admin` when an admin decided the column, otherwise `detected` |
| `decided_by`, `decided_at` | Who decided and when (admin decisions only) |
| `confidence` | The detection score, 0 to 100 |
| `example`, `format` | A masked example in the class's current format, and that format. Never a real value. |
| `evidence` | The score `total`, the thresholds (`threshold_mask` 70; `threshold_review` 40, or 15 for columns classified from the name only), the evidence `lines`, and the value `shapes` with the percentage of sampled values that had each shape |

**`PATCH /column`** decides a column. Send a class id to mask it, or `null` to mark it not sensitive:

```bash
curl -X PATCH "https://your-dreamfactory-instance.com/api/v2/system/data_masking/column" \
  -H "X-DreamFactory-Session-Token: <admin session token>" \
  -H "Content-Type: application/json" \
  -d '{"id": "patients.appointments.callback", "class": "phone"}'
```

- **The id.** Service names contain no dots. Table names can (schema-qualified tables: in `crm.sales.orders.email` the table is `sales.orders`), so the column is everything after the last dot.
- **Body form or path form.** `PATCH /column/patients.appointments.callback` with `{"class": "phone"}` also works, but DreamFactory's routes reject some names (non-Latin letters, `%`, quotes). The body form works for every column name, and the admin app always uses it.
- **Decisions stick.** Rescans, custom rules and baselines never change a column an admin decided.
- **Any full system admin** can decide, including marking a column not sensitive.
- The response is the column, now with `"source": "admin"`. Activity records `Marked not sensitive`, `Kept masked as Phone` or `Set class to Phone`, with the column id as target.

| Status | Message |
|---|---|
| 400 | `Send class: a class id to mask the column, or null to mark it not sensitive.` |
| 400 | `Unknown class. Use one of: national_id, tax_id, passport_number, drivers_license, card_number, card_security, bank_account, credential, special_category, email, phone, person_name, street_address, date_of_birth, ip_address, username, geo_precise, postal_code, gender, age, card_expiry, financial_personal, free_text_pii, or null.` |
| 400 | `Invalid column id '<id>'. Use service.table.column.` |
| 400 | `Send the column id (service.table.column) as id in the body, with class.` |
| 404 | `'<name>' is not a database service Data Masking covers.` |
| 404 | `Column '<id>' not found. Scan the service first.` |

The error above lists the 23 class ids. See [Classes and mask formats](./classes-and-formats.md) for what each one covers.

### Scan

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/scan` | `{}`, `{"service": "billing"}`, `{"sample": true}` | The overview, with `scan.status` `running` |

```bash
curl -X POST "https://your-dreamfactory-instance.com/api/v2/system/data_masking/scan" \
  -H "X-DreamFactory-Session-Token: <admin session token>" \
  -H "Content-Type: application/json" \
  -d '{"service": "billing"}'
```

- Without `service`, every active covered database is scanned.
- `"sample": true` also samples warehouses that bill per query (Snowflake, Databricks, Trino, Dremio, BigQuery), which are otherwise classified from column names only.
- **Idempotent.** While a scan runs, the call starts nothing new and returns the overview.
- The scan runs in the background. Poll `GET /` until `scan.status` is `idle`, then read `scan.last_status` and `scan.failed`.
- Activity records `Scan started` or `Scan started for Billing`.

| Status | Message |
|---|---|
| 400 | `Invalid service.` |
| 400 | `Service '<name>' is not active.` |
| 400 | `Invalid sample flag; use true or false.` |
| 400 | `There are no active database services to scan. Add a SQL database service first.` |
| 404 | `'<name>' is not a database service Data Masking covers.` |
| 501 | `Scanning is not available in this build of df-masking.` |

### Access

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET` | `/access` | | Admin access, grants, AI setting, roles and `version` |
| `PATCH` | `/access` | Any of `admins`, `ai`, `roles`, plus `version` | The same shape as `GET` |

**`GET /access`** on the Acme Health instance:

```json
{
  "admins": {
    "mode": "selected",
    "grants": [
      {
        "admin_id": 2,
        "name": "Jordan Lee",
        "email": "jordan.lee@acmehealth.example",
        "expires_at": "2026-11-17T03:48:00Z"
      }
    ],
    "available": [
      { "admin_id": 1, "name": "Alex Rivera", "email": "alex.rivera@acmehealth.example", "you": true },
      { "admin_id": 2, "name": "Jordan Lee", "email": "jordan.lee@acmehealth.example", "you": false }
    ]
  },
  "ai": "masked",
  "roles": [
    { "role_id": 1, "name": "support", "enabled": true, "scope": "except_restricted" }
  ],
  "version": "74e7b256ed01af346e09"
}
```

| Field | Description |
|---|---|
| `admins.mode` | `none` (the default: no admin sees real values), `selected` (admins with a live grant) or `all` |
| `admins.grants` | Live grants only. `expires_at` is `null` for a grant "until turned off". Expired grants are left out. |
| `admins.available` | Every active full system admin, with `you` marking the caller |
| `ai` | `masked` (the default) or `same_as_admins` |
| `roles` | Every role, with `enabled` (default `false`) and `scope`: `all` or `except_restricted` (the default) |
| `version` | An opaque string that changes whenever access changes, including when a grant expires |

**`PATCH /access`** changes who sees real values. Send only the parts you change:

| Field | Description |
|---|---|
| `version` | The `version` from your last `GET`. If access changed since, you get 409 and nothing changes. Optional, but send it. |
| `admins.mode` | `none`, `selected` or `all` |
| `admins.grants` | The **complete** list of grants, as `[{"admin_id": 2, "duration": "8h"}]`. A `duration` (`1h`, `8h`, `24h`, `7d` or `forever`) starts the grant from now. Without `duration`, the admin's current grant keeps its end time, and it must still be live. |
| `ai` | `masked` or `same_as_admins` |
| `roles` | `[{"role_id": 1, "enabled": true, "scope": "except_restricted"}]`. List only the roles you change; a missing `enabled` or `scope` keeps its stored value. |

For example, to give Jordan Lee real values for 8 hours:

```bash
curl -X PATCH "https://your-dreamfactory-instance.com/api/v2/system/data_masking/access" \
  -H "X-DreamFactory-Session-Token: <admin session token>" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "74e7b256ed01af346e09",
    "admins": {
      "mode": "selected",
      "grants": [{ "admin_id": 2, "duration": "8h" }]
    }
  }'
```

To let the `support` role see real values except restricted classes, send `{"version": "...", "roles": [{"role_id": 1, "enabled": true, "scope": "except_restricted"}]}`. To remove every grant, send `{"admins": {"grants": []}}`.

:::warning[admins.grants replaces the whole list]
An admin who has a grant but is missing from `admins.grants` loses it. To change one grant, send every grant you want to keep, without `duration` for those that keep their end time.
:::

- **Grants count only while `admins.mode` is `selected`.** The API doesn't switch the mode for you: send both, as in the example. (`php artisan df:masking grant` does switch it.)
- **Loosening needs the super admin**: raising `admins.mode`, a new grant or one that ends later, `same_as_admins`, enabling a role or widening it to `all`. If any part of a `PATCH` loosens, the whole request is refused. Shortening a grant, including one "until turned off", is tightening.
- **Changes apply at once** on every node that shares the cache.
- **One access change at a time.** A change that waits more than 5 seconds for another to finish gets the same 409 as a stale `version`.
- Activity records one row per change, for example `Admin access set to selected`, `Jordan Lee was given real values for 8 hours`, `Real values removed for Jordan Lee`, `AI and MCP sessions now match admins`, `support now sees real values (all except restricted)` and `support is masked again`.

| Status | Message |
|---|---|
| 400 | `Nothing to change. Send admins, ai and/or roles.` |
| 400 | `version must be the string GET access returned.` |
| 400 | `admins must be an object.` |
| 400 | `Invalid admins.mode. Use 'none', 'selected' or 'all'.` |
| 400 | `admins.grants must be a list of {admin_id, duration?}.` |
| 400 | `Each grant needs a numeric admin_id.` |
| 400 | `Admin <id> is not an active system administrator.` |
| 400 | `Admin <id> appears twice in grants.` |
| 400 | `Invalid duration for admin <id>. Use 1h, 8h, 24h, 7d or forever.` |
| 400 | `Invalid ai. Use 'masked' or 'same_as_admins'.` |
| 400 | `roles must be a list of {role_id, enabled, scope}.` |
| 400 | `Each role needs a numeric role_id.` |
| 400 | `Role <id> does not exist.` |
| 400 | `Role <id> appears twice.` |
| 400 | `Invalid enabled flag for role <id>.` |
| 400 | `Invalid scope for role <id>. Use 'all' or 'except_restricted'.` |
| 403 | `Only the super admin can give access.` |
| 409 | `Access settings changed since you loaded them. Reload and try again.` |
| 409 | `<Admin name> has no current grant to keep. Reload and try again, or send a duration to give a new grant.` |

### Mask formats

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET` | `/mask` | | `{"resource": [{"class", "tier", "format", "formats_allowed"}]}` for all 23 classes |
| `PATCH` | `/mask` | `{"resource": [{"class": "card_number", "format": "redact"}]}` | The full list |

```json
{
  "resource": [
    {
      "class": "card_number",
      "tier": "restricted",
      "format": "last4",
      "formats_allowed": ["last4", "redact", "null"]
    },
    {
      "class": "email",
      "tier": "identity",
      "format": "token",
      "formats_allowed": ["token", "initial", "redact", "null"]
    }
  ]
}
```

The example shows two of the 23 entries.

- Format ids are `redact`, `last4`, `initial`, `year`, `token`, `null` and `span`. Each class allows only the formats in its `formats_allowed`; restricted classes never allow `token`. See [Classes and mask formats](./classes-and-formats.md).
- Formats are per class and apply to every column of that class.
- Any full system admin can choose any allowed format, including a less strict one.
- Activity records `Card number now masked as redact` (kind `decision`).

| Status | Message |
|---|---|
| 400 | `Send a resource list of {class, format} items.` |
| 400 | `Unknown class '<class>'. Use one of: national_id, tax_id, …, free_text_pii.` (lists the 23 ids) |
| 400 | `<Class> can be masked as: <formats>.`, for example `Card number can be masked as: last4, redact, null.` |

### Detection rules

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET` | `/rule` | | `{"resource": [ ...rules ]}` |
| `POST` | `/rule` | `{"match": "name" \| "value", "pattern": "...", "class": "<class id>"}` | The rule, plus `scan_started` |
| `DELETE` | `/rule/{id}` | | `{"id": 11}` |
| `POST` | `/rule/test` | `{"match": "name" \| "value", "pattern": "..."}` | `{"matches": [{"id"}], "partial"}` |
| `GET` | `/rule/builtin` | | The built-in detectors per class |

See [Custom rules](./custom-rules.md) for how rules behave and a cookbook of examples.

**`GET /rule`.** Rules from the Acme Health story, one from an admin and one added by the HIPAA baseline:

```json
{
  "resource": [
    {
      "id": 11,
      "match": "value",
      "pattern": "^\\p{L}{3}\\d{9}$",
      "class": "special_category",
      "source": "admin",
      "matches": 1
    },
    {
      "id": 12,
      "match": "name",
      "pattern": "^(?:mrn|medical_?rec(?:ord)?_?(?:id|no|num|nbr|number)|med_?rec_?(?:no|num|nbr|number)|patient_?(?:no|num|nbr|number|mrn)|chart_?(?:no|num|nbr|number))$",
      "class": "special_category",
      "source": "baseline:hipaa",
      "matches": 1,
      "title": "Medical record, patient and chart numbers"
    }
  ]
}
```

| Field | Description |
|---|---|
| `match` | `name` (matches column names) or `value` (matches sampled values) |
| `source` | `admin`, or `baseline:<id>` for a rule a Compliance baseline added |
| `matches` | For a name rule: every scanned column whose name matches, including columns already masked as a stricter class or decided by an admin. For a value rule: the columns whose last scan found it matching; `0` until the scan that applies it finishes. |
| `title` | Baseline rules only: the rule's name in the baseline |

**`POST /rule`** adds a rule:

```bash
curl -X POST "https://your-dreamfactory-instance.com/api/v2/system/data_masking/rule" \
  -H "X-DreamFactory-Session-Token: <admin session token>" \
  -H "Content-Type: application/json" \
  -d '{
    "match": "value",
    "pattern": "^\\p{L}{3}\\d{9}$",
    "class": "special_category"
  }'
```

```json
{
  "id": 11,
  "match": "value",
  "pattern": "^\\p{L}{3}\\d{9}$",
  "class": "special_category",
  "source": "admin",
  "matches": 0,
  "scan_started": true
}
```

- **Patterns** are PCRE regular expressions without delimiters, at most 500 characters, trimmed, case-insensitive and Unicode-aware. They match anywhere in the text unless you anchor them with `^` and `$`. In JSON, double every backslash, as above.
- **Name rules** match column names, never table names, in every covered database. They apply at once to scanned columns; columns not scanned yet get the rule at their scan.
- **Value rules** mask a column when at least 3 of its sampled values match **and** at least half of its sampled non-null values do. Adding one starts a scan of every active covered database. `scan_started` is `true` when that scan started, or will start when the running one ends. It is `false` when nothing started, for example on an instance that was never scanned and is Off: the first scan then applies the rule.
- **Rules only add masking.** The strictest class wins, and rules never change a column an admin decided.
- **Rules can't be edited.** Delete the rule and add a new one.
- Activity records `Added a column name rule for Health & special category` or `Added a value rule for Health & special category`, and `Scan started to apply a value rule`.

| Status | Message |
|---|---|
| 400 | `Invalid match. Use 'name' or 'value'.` |
| 400 | `Choose a class for the rule.` |
| 400 | `This rule already exists.` (same `match`, `pattern` and `class`) |
| 400 | `Enter a pattern.` |
| 400 | `Patterns can be at most 500 characters.` |
| 400 | `Patterns must be valid UTF-8.` |
| 400 | `Patterns cannot contain control characters.` |
| 400 | `Not a valid pattern: <reason>.` |
| 400 | `This pattern is too complex to evaluate safely; simplify nested repetition such as (a+)+.` |

**`DELETE /rule/{id}`** deletes a rule and returns `{"id": 11}`. Columns the rule masked **stay masked**: after the next scan their evidence reads `Masked as <Class> by a detection rule that no longer matches; ...`. To unmask one, mark it not sensitive with `PATCH /column` and `"class": null`. (In the admin app, the delete dialog's **Delete and unmask N** button also marks as not sensitive the columns that nothing else would mask.) Activity records `Deleted a value rule for Health & special category`. An unknown id gets 404 `Rule '<id>' not found.`

**`POST /rule/test`** shows which columns a pattern would match, without saving anything. It needs no class and accepts the same pattern rules as `POST /rule`.

```json
{
  "matches": [{ "id": "billing.claims.member_ref" }],
  "partial": false
}
```

- **Name rules** are tested at once against scanned columns.
- **Value rules** are tested on a live sample of up to 32 rows from the start and 32 from the end of each table, with the same thresholds as a scan, within `DF_MASKING_RULE_TEST_BUDGET_MS` (3000 ms by default). `partial` is `true` when the budget ran out, a database could not be read, or a warehouse was skipped (tests never sample warehouses). A scan reads up to 256 rows per table, so its result can differ.

**`GET /rule/builtin`** lists the built-in detectors:

```json
{
  "ruleset": "dreamfactory.core",
  "version": "2026.11.1",
  "classes": [
    {
      "class": "national_id",
      "detectors": ["Dutch BSN", "French NIR", "Spanish DNI", "Swedish personnummer", "UK NI number", "US SSN"]
    },
    {
      "class": "card_number",
      "detectors": ["Card checksum (Luhn)", "Card shape"]
    }
  ]
}
```

The example shows two of the 23 classes.

### Activity

| Method | Path | Returns |
|---|---|---|
| `GET` | `/activity?kind=&limit=&before=` | `{"resource": [ ...events ], "has_more": true}`, newest first |

| Parameter | Default | Description |
|---|---|---|
| `kind` | every kind | One kind, or a comma-separated list: `mode`, `decision`, `access`, `scan`, `blocked`, `rule`, `baseline`, `preview` |
| `limit` | `200` | Rows per page, at most 1000 |
| `before` | | An activity `id`: return only older rows. Pass the last `id` of a page to get the next one. |

```bash
curl "https://your-dreamfactory-instance.com/api/v2/system/data_masking/activity?kind=access,baseline&limit=3" \
  -H "X-DreamFactory-Session-Token: <admin session token>"
```

```json
{
  "resource": [
    {
      "id": 63,
      "at": "2026-11-16T19:48:51Z",
      "actor": "Alex Rivera",
      "kind": "baseline",
      "text": "Applied the HIPAA baseline (2 changes)",
      "target": "hipaa"
    },
    {
      "id": 62,
      "at": "2026-11-16T19:48:21Z",
      "actor": "Alex Rivera",
      "kind": "access",
      "text": "support now sees real values (all except restricted)",
      "target": null
    },
    {
      "id": 61,
      "at": "2026-11-16T19:48:00Z",
      "actor": "Alex Rivera",
      "kind": "access",
      "text": "Jordan Lee was given real values for 8 hours",
      "target": null
    }
  ],
  "has_more": true
}
```

- `at` is UTC. `actor` is an admin's name, `<name> (AI session)`, `API key: <app>`, `System`, `Command line` or `Anonymous`.
- `target` is what the event is about: a column (`service.table.column`), a table, a database, a baseline id, or a rule's pattern. It is `null` when there is none.
- Rule events also carry `match` (`name` or `value`).
- `has_more` is `true` when older rows of the same kinds exist.

See [Activity log](./activity.md) for every event text.

| Status | Message |
|---|---|
| 400 | `Unknown activity kind: <kind>. Use mode, decision, access, scan, blocked, rule, baseline, preview.` |
| 400 | `limit must be a positive integer.` |
| 400 | `before must be an activity id.` |

## Compliance API

Paths below are relative to `/api/v2/system/security_baseline`. Baseline ids are `hipaa`, `pci_dss`, `glba`, `cjis`, `gdpr`, `soc2` and `iso27001`. See [Compliance baselines](../compliance-baselines.md) for what each baseline checks and changes. A baseline is not a certification.

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET` | `/` | | Every baseline with its live score |
| `GET` | `/{id}` or `/{id}?mode=on` | | One baseline: checks, and the changes Apply would make |
| `POST` | `/{id}/apply` | `{}` or `{"mode": "on"}` | The baseline after Apply, plus `applied` and `scan_started` |
| `DELETE` | `/{id}` | | The baseline, no longer tracked |
| `GET` | `/{id}/report?format=json` or `format=csv`, optional `&download=true` | | The evidence report |

These errors can come from any path:

| Status | Message |
|---|---|
| 400 | `A baseline id is required.` |
| 404 | `Compliance baseline '<id>' not found.` |
| 404 | `Resource '<path>' not found for service 'system'.` |

### List baselines

```json
{
  "resource": [
    {
      "id": "hipaa",
      "name": "HIPAA",
      "vertical": "healthcare",
      "frameworks": ["HIPAA Security Rule", "HIPAA Privacy Rule"],
      "summary": "US healthcare: keep protected health information (PHI) to the minimum necessary in API responses.",
      "adopted": true,
      "adopted_at": "2026-11-16T19:48:51Z",
      "score": { "pass": 11, "fail": 3, "manual": 4, "total": 18 }
    }
  ]
}
```

The example shows one of the seven baselines. `adopted` is `true` while the baseline is tracked. In `score`, `total` is `pass` + `fail` + `manual`; checks that don't apply (`na`) are left out. The admin app's "11 of 14" counts passing checks out of the automated ones (`pass` + `fail`).

### One baseline

`GET /{id}` returns the checks with their live status, and `changes`: exactly what Apply would change now. With `?mode=on`, `changes` lists what Apply with masking On would change. A PCI DSS example, shortened to three checks:

```json
{
  "id": "pci_dss",
  "name": "PCI DSS",
  "vertical": "payments",
  "frameworks": ["PCI DSS v4.0.1"],
  "summary": "Payments: card numbers show at most the last four digits, and only people with a business need see more.",
  "adopted": false,
  "adopted_at": null,
  "adopted_by": null,
  "applied_at": null,
  "score": { "pass": 14, "fail": 3, "manual": 3, "total": 20 },
  "controls": [
    {
      "id": "masking.mode",
      "title": "Card data is masked in API responses",
      "refs": ["PCI DSS 3.4.1", "PCI DSS 7.2.6"],
      "status": "pass",
      "detail": "Masking is on.",
      "fix": { "kind": "none", "route": null }
    },
    {
      "id": "platform.audit",
      "title": "Reads from every SQL database are logged",
      "refs": ["PCI DSS 10.2.1", "PCI DSS 10.2.1.1"],
      "status": "fail",
      "detail": "Only service changes are recorded (Service Reports). Add a Logstash service and subscribe it to each database's events, e.g. billing.*.",
      "fix": { "kind": "link", "route": "/system-settings/logs" }
    },
    {
      "id": "manual.pan_unreadable",
      "title": "Stored card numbers are unreadable",
      "refs": ["PCI DSS 3.5.1"],
      "status": "manual",
      "detail": "Check outside DreamFactory: card numbers encrypted, truncated, tokenized or hashed wherever they are stored.",
      "fix": { "kind": "none", "route": null }
    }
  ],
  "changes": [
    { "id": "rule:0", "text": "Add a detection rule: Card number abbreviations (pan, cc_num, card_no) are Card number." },
    { "id": "rule:1", "text": "Add a detection rule: Card codes, track data and PIN blocks are Card security code." },
    { "id": "rule:2", "text": "Add a detection rule: Card expiry fields are Card expiry." },
    { "id": "rule:3", "text": "Add a detection rule: Cardholder names are Person name." }
  ]
}
```

| Field | Description |
|---|---|
| `adopted_by`, `applied_at` | Who adopted the baseline and when it was last applied |
| `controls[].status` | `pass`, `fail`, `manual` (check it yourself; the `detail` says what to check) or `na` |
| `controls[].refs` | The framework references. They are not legal advice. |
| `controls[].fix` | For a failing check: `kind` `apply` (Apply fixes it), `link` (`route` is the admin app page that fixes it) or `none` |
| `changes[].id` | `mode`, `ai`, `admins_mode`, `grant:<admin_id>`, `role:<role_id>`, `format:<class>` or `rule:<index>` |

### Apply a baseline

`POST /{id}/apply` adopts the baseline and applies the DreamFactory settings it needs, in one transaction:

```bash
curl -X POST "https://your-dreamfactory-instance.com/api/v2/system/security_baseline/hipaa/apply" \
  -H "X-DreamFactory-Session-Token: <admin session token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

The response is the baseline (as `GET /{id}`) plus `applied`, the changes that were made, and `scan_started`. This is the end of the response on Acme Health, where HIPAA added two rules:

```json
{
  "applied": [
    { "id": "rule:0", "text": "Add a detection rule: Medical record, patient and chart numbers are Health & special category." },
    { "id": "rule:1", "text": "Add a detection rule: Health plan beneficiary and Medicare/Medicaid numbers are Health & special category." }
  ],
  "scan_started": false
}
```

- **Apply only tightens.** It can raise the mode to Preview (to On only with `{"mode": "on"}`), set AI sessions to masked, cap admin access at `selected`, shorten grants to the strictest limit of the baselines you track, narrow roles to "all except restricted" (every baseline except SOC 2 and ISO 27001), change formats the baseline doesn't allow, and add rules. It never clears masking or deletes decisions, grants, roles or rules.
- **`{"mode": "on"}`** needs a completed scan that found columns, unless masking is already On.
- **Before any scan has found columns**, Apply starts a scan of every covered database and returns `"scan_started": true`.
- Any full system admin can apply. Activity records `Applied the HIPAA baseline (2 changes)`, and `Masking set to Preview by the HIPAA baseline` or `Scan started by the HIPAA baseline` when those happen.

| Status | Message |
|---|---|
| 400 | `mode must be 'on' or left out.` (a `mode` that isn't a string) |
| 400 | `mode must be 'on' or left out; Apply never lowers masking.` (any other string) |
| 400 | `Use POST system/security_baseline/{id}/apply to apply a baseline.` |
| 409 | `Scan your databases before turning masking on.` |
| 503 | `Compliance baselines are not set up yet. Run: php artisan df:masking setup (or php artisan migrate)` |

### Stop tracking a baseline

`DELETE /{id}` stops tracking the baseline and returns it with `"adopted": false`. Every setting and rule it applied stays. Activity records `Stopped tracking the HIPAA baseline (settings unchanged)` when the baseline was tracked. A `DELETE` on a sub-path gets 400 `Use DELETE system/security_baseline/{id} to stop tracking a baseline.`

### Evidence report

`GET /{id}/report` exports the evidence for one baseline. It contains no data values.

```bash
curl -OJ "https://your-dreamfactory-instance.com/api/v2/system/security_baseline/hipaa/report?format=csv" \
  -H "X-DreamFactory-Session-Token: <admin session token>"
```

| Parameter | Description |
|---|---|
| `format` | `json` (the default) or `csv` |
| `download` | `true` sends the JSON report as a file attachment. CSV is always an attachment. |

**CSV** is always `text/csv; charset=utf-8`, sent as an attachment whatever the `Accept` header says. It has one row per check, with this header row:

```text
baseline_id,baseline,control_id,title,status,detail,references,generated_at,frameworks,disclaimer
```

References and frameworks are joined with `; `. Cells that start with `=`, `+`, `-`, `@`, a tab or a carriage return get a leading `'`, so spreadsheets don't run them as formulas.

**JSON** has these keys:

| Key | Contents |
|---|---|
| `report`, `generated_at`, `disclaimer` | `"DreamFactory Compliance baseline evidence"`, the time, and the disclaimer: "A baseline checks the DreamFactory settings that support these framework requirements. It is not a certification and does not cover controls outside DreamFactory." |
| `instance` | `url`, `version`, `license`, `install_type`, `host`, `system_db_driver`, `php`, `df_masking` |
| `baseline` | `id`, `name`, `vertical`, `frameworks`, `adopted`, `adopted_at`, `adopted_by`, `applied_at` |
| `score`, `controls`, `pending_changes` | The live score, every check with its status and detail, and what Apply would still change |
| `masking` | `mode`, `ai`, the `formats`, and an `inventory` of column counts per database, class and tier, including admin decisions |
| `access` | Admin access, every admin grant with name and email, the AI setting, roles with real values, and whether a super admin is designated |
| `activity` | Masking activity of the last 90 days, up to 5,000 entries |

Files are named `dreamfactory-<id>-baseline-YYYY-MM-DD.csv` (or `.json`), with the date in UTC.

:::note[Treat reports as internal]
Reports hold no data values, but they do name your admins, with their email addresses, and include the server's host name and `APP_URL`.
:::

`format` with any other value gets 400 `format must be 'json' or 'csv'.`

## Command line

```bash
php artisan df:masking <action> [arguments] [options]
```

Run it from the DreamFactory directory (`/opt/dreamfactory` in DreamFactory's Docker images). In Docker, run it as the web server user:

```bash
docker exec -u www-data <container> php /opt/dreamfactory/artisan df:masking status
```

- **The operator can do everything.** Shell access means you run the instance, so every subcommand can tighten **and** loosen, without the super admin. Changes are recorded in the activity log with the actor "Command line". This makes the CLI the recovery path when nobody can reach the admin app.
- **No action** runs `status`. `help` prints the synopsis.
- **Exit codes.** `0` on success, `1` on any failure. Every action except `setup` and `help` first checks the tables and stops with `Data Masking tables are missing. Run: php artisan df:masking setup (or php artisan migrate --force).` when they are missing. An unknown action prints `Unknown action '<action>'.` and the synopsis.
- **Running as root.** `df:masking` gives the files it created under `storage/` and `bootstrap/cache` back to the owner of `storage/`, so the web server can still write them. Other artisan commands don't, so prefer `www-data`.

The synopsis (`php artisan df:masking help`):

```text
php artisan df:masking status [--json]
php artisan df:masking scan [--service=NAME] [--sample]
php artisan df:masking mode off|preview|on
php artisan df:masking grant ADMIN_EMAIL [--for=1h|8h|24h|7d|forever]
php artisan df:masking revoke ADMIN_EMAIL | --all
php artisan df:masking baseline list | apply ID [--mode=on]
php artisan df:masking setup [--baseline=ID] [--mode=preview|on]
```

### `df:masking status`

Prints what is in force. Always exits `0` when the tables exist.

```text
Data Masking
  Mode:               On
  AI and MCP:         always masked
  Admins:             selected
    grant jordan.lee@acmehealth.example until 2026-11-17T03:48:00Z
  Role support: real values (all except restricted)
  Scan:               last finished 2026-11-16T19:42:32Z
  Columns:            31 masked, 0 to review, 34 not sensitive
  Covered services:   billing, db, hr, patients
```

| Line | Values |
|---|---|
| `Mode` | `Off`, `Preview` or `On` |
| `AI and MCP` | `always masked` or `same as admins` |
| `Admins` | `masked (no one sees real values)`, `selected` or `all`, followed by one `grant` line per live grant (`until turned off` for grants without an end) |
| `Role` | One line per role with real values: `all classes` or `all except restricted` |
| `Scan` | `running` with a percentage, `last finished` with a time (UTC), or `never scanned` |
| `Last scan` | Only when the last scan `failed` or `partly failed`, followed by one `could not read` line per database with its reason |
| `Columns` | Masked, to review and not sensitive |
| `Covered services` | The SQL services Data Masking masks, or `none` |
| `Not covered` | Only when there are any: other database services, followed by `(AI sessions are blocked from these when mode is On)` |

With `--json`:

```json
{
    "mode": "on",
    "ai": "masked",
    "admins": "selected",
    "grants": [
        {
            "admin_id": 2,
            "email": "jordan.lee@acmehealth.example",
            "expires_at": "2026-11-17T03:48:00Z"
        }
    ],
    "roles": [
        {
            "role": "support",
            "scope": "except_restricted"
        }
    ],
    "scan": {
        "status": "idle",
        "progress": null,
        "finished_at": "2026-11-16T19:42:32Z",
        "columns": 65,
        "last_status": "done",
        "failed": [],
        "unknown": false
    },
    "counts": {
        "masked": 31,
        "review": 0,
        "clear": 34
    },
    "covered": [
        "billing",
        "db",
        "hr",
        "patients"
    ],
    "uncovered": []
}
```

Exit `0` doesn't mean masking is On: read `mode`. See [Docker](./operations.md#docker) for a deploy check.

### `df:masking scan`

```bash
php artisan df:masking scan [--service=NAME] [--sample]
```

Scans every active covered database, or only `--service`, **in the foreground**. `--sample` also samples warehouses that bill per query. In an interactive terminal it prints progress lines (`10%`, `20%` and so on). It records `Scan started` (or `Scan started for <label>`) as "Command line".

```text
Scan finished: 65 columns in 4 databases (31 masked, 0 to review, 34 not sensitive).
Mode: On
```

Warnings follow the summary line, indented, when they apply:

- `Could not read <service>: <reason>`. The scan still finishes for the other databases and exits `0`.
- `'<service>' bills per query: classified from column names only. Run with --sample to sample its values.`
- `<n> large or slow tables were partly sampled (time budget).`
- `Values of <n> columns could not be read; they are marked to review.`
- `<n> tables could not be read; their earlier classification was kept.`

When no database could be read, or the scan stopped, it prints `Could not read <names>.` (up to five names, then `and N more`) or `The scan stopped: <message>`, then one `Could not read <service>: <reason>` line per database, and exits `1`. Reasons carry no data values, for example `Could not connect (SQLSTATE HY000)`.

| Message | Exit |
|---|---|
| `A scan is already running. Check progress with: php artisan df:masking status` | 1 |
| `'<name>' is not a database service Data Masking covers.` | 1 |
| `Scanning is not available in this build of df-masking.` | 1 |

The `--scan-id` option is used internally by background scans. Don't use it.

### `df:masking mode`

```bash
php artisan df:masking mode off|preview|on
```

Prints `Masking mode: On`, or `Masking mode: On (unchanged)` when nothing changed. Lowering from On works here without the super admin. Activity records `Masking set to On` (or Off, Preview) as "Command line".

`mode on` before a scan has found columns prints `Scan your databases before turning masking on.`, then `Run: php artisan df:masking scan` when nothing was scanned yet, or `Next: add a SQL database service, then run php artisan df:masking scan.` when only empty databases were. It exits `1`. A missing or wrong mode prints `Usage: php artisan df:masking mode off|preview|on` and exits `1`.

### `df:masking grant`

```bash
php artisan df:masking grant jordan.lee@acmehealth.example --for=8h
```

```text
jordan.lee@acmehealth.example sees real values for 8 hours (until 2026-11-17T03:48:00Z).
AI and MCP sessions stay masked for this admin.
```

- `--for` is `1h`, `8h` (the default), `24h`, `7d` or `forever`. Running it again restarts the grant from now.
- **It switches admin access from "No one" to "Selected"** when needed, and records `Admin access set to selected`. The API doesn't do this.
- The email is matched without regard to case and must belong to a system administrator.
- The second line appears while AI and MCP sessions are always masked.
- Activity records `Jordan Lee was given real values for 8 hours` as "Command line".

| Message | Exit |
|---|---|
| `Give the admin's email address.` | 1 |
| `No system administrator with email <email>.` | 1 |
| `--for must be 1h, 8h, 24h, 7d or forever.` | 1 |
| `<email> is not active.` (warning; the grant is still made) | 0 |

### `df:masking revoke`

```bash
php artisan df:masking revoke jordan.lee@acmehealth.example
php artisan df:masking revoke --all
```

- With an email: prints `Removed the grant for <email>.` or `<email> had no grant.` If admin access is "All admins", it also warns `Admin access is set to "all admins": every admin still sees real values. Use --all to reset it.`
- With `--all`: deletes every grant, sets admin access back to "No one" if it was "All admins", and prints `Removed <n> grant(s). Admins are masked.` Activity records `Real values removed for every admin`.

### `df:masking baseline`

```bash
php artisan df:masking baseline list [--json]
php artisan df:masking baseline apply ID [--mode=on]
```

`baseline list` prints a table, or with `--json` the same data as the API's list:

```text
+----------+-----------+------------+---------+---------------------------+
| id       | baseline  | vertical   | adopted | checks                    |
+----------+-----------+------------+---------+---------------------------+
| hipaa    | HIPAA     | healthcare | yes     | 11 pass, 3 fail, 4 manual |
| pci_dss  | PCI DSS   | payments   | no      | 14 pass, 3 fail, 3 manual |
| glba     | GLBA      | banking    | no      | 10 pass, 3 fail, 4 manual |
| cjis     | CJIS      | government | no      | 11 pass, 3 fail, 3 manual |
| gdpr     | GDPR      | privacy    | no      | 9 pass, 2 fail, 3 manual  |
| soc2     | SOC 2     | general    | no      | 12 pass, 3 fail, 3 manual |
| iso27001 | ISO 27001 | general    | no      | 12 pass, 3 fail, 3 manual |
+----------+-----------+------------+---------+---------------------------+
```

`baseline apply` adopts and applies a baseline, as `POST /{id}/apply` does:

```text
HIPAA baseline adopted.
  - Add a detection rule: Medical record, patient and chart numbers are Health & special category.
  - Add a detection rule: Health plan beneficiary and Medicare/Medicaid numbers are Health & special category.
  Checks: 11 pass, 3 fail, 4 manual
```

When nothing needs changing, the list reads `  Nothing needed changing.` On an instance where no scan has found columns yet, Apply starts one and adds `First scan started: php artisan df:masking status`.

| Message | Exit |
|---|---|
| `Usage: php artisan df:masking baseline apply <id> [--mode=on]` | 1 |
| `baseline apply only takes --mode=on (Apply never lowers masking).` | 1 |
| `Unknown baseline '<id>'. Choose one of: hipaa, pci_dss, glba, cjis, gdpr, soc2, iso27001.` | 1 |
| `Scan your databases before turning masking on.` (with `--mode=on` before a scan has found columns) | 1 |
| `Usage: php artisan df:masking baseline list \| apply <id> [--mode=on]` | 1 |

### `df:masking setup`

```bash
php artisan df:masking setup [--baseline=ID] [--mode=preview|on]
```

Creates or updates the tables, scans every active covered database in the foreground, optionally applies a baseline, and raises the mode. It prints numbered steps `1/4` to `4/4`, then one `Next:` line. See [First-time setup](./operations.md#first-time-setup) for a full example and every option.

The `Next:` line depends on the state:

| State after setup | Line |
|---|---|
| No scan has found columns yet | `Next: add a SQL database service, then run php artisan df:masking scan.` |
| On, with columns to review | `Next: open the admin app > Data Masking and decide the N columns to review.` |
| Preview, with columns to review | `Next: open the admin app > Data Masking, decide the N columns to review, then switch the mode to On.` |
| Preview, nothing to review | `Next: switch the mode to On (admin app > Data Masking, or php artisan df:masking mode on).` |
| Off | `Next: turn masking on (admin app > Data Masking, or php artisan df:masking mode on).` |

With one column to review, the text reads `the 1 column to review`. With masking On and nothing to review, there is no `Next:` line. Setup with `--mode` that is not `preview` or `on` prints `setup --mode must be preview or on.` and exits `1`.

### Recovery

| Situation | Command |
|---|---|
| Every admin must be masked again, now | `php artisan df:masking revoke --all` |
| Masking breaks an app and the super admin is away | `php artisan df:masking mode preview` (keeps reporting what would be masked), or `mode off` |
| Nobody can see real values and the super admin is away | `php artisan df:masking grant you@example.com --for=1h` |
| You need to know what is in force | `php artisan df:masking status` |

Each change is recorded with the actor "Command line", so the activity log shows that it came from the shell.

## Related

- [Install and operate](./operations.md) — setup, Docker, clusters, upgrades and configuration
- [Who sees real values](./access.md) — the access model behind `/access`
- [Custom rules](./custom-rules.md) — writing detection rules
- [Classes and mask formats](./classes-and-formats.md) — the class and format ids
- [Activity log](./activity.md) — every event text
- [Compliance baselines](../compliance-baselines.md) — what each baseline checks and changes
- [System API reference](../../api-reference/system-api.md) — admin sign-in and other system endpoints
