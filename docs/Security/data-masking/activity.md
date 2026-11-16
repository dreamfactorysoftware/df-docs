---
sidebar_position: 8
title: Activity log
id: activity
description: "The Data Masking Activity tab: what each kind of row records, Preview and blocked rows, actor labels, retention, the activity API, and audit evidence."
keywords: [data masking, activity log, audit trail, preview, blocked requests, retention, DF_MASKING_ACTIVITY_RETENTION_DAYS, compliance evidence]
difficulty: beginner
---

# Activity log

The **Activity** tab records what happened to Data Masking: who changed a setting, what scans found, what Preview would have masked, and what masking refused. Use it to check a rollout before you turn masking On, to find out why an app got an empty result, and as evidence for an audit.

Rows never contain data values. They name columns, tables, databases, classes, rule patterns and people, with counts.

## Quick reference

| Concept | Description |
|---|---|
| **Admin UI path** | **Security > Data Masking**, **Activity** tab |
| **REST API** | `GET /api/v2/system/data_masking/activity` |
| **Kinds** | `mode`, `decision`, `access`, `scan`, `blocked`, `rule`, `baseline`, `preview` |
| **Order** | Newest first, grouped by day, 200 rows per page |
| **Retention** | 400 days by default (`DF_MASKING_ACTIVITY_RETENTION_DAYS`). `0` keeps rows forever |
| **Who can read it** | Full system administrators |
| **Evidence export** | The last 90 days are part of a Compliance baseline's JSON export |

![The Activity tab in Preview with the filter chips All, Changes, Access, Scans, Blocked and Preview. Under Today: Would mask 4 columns billing.payment_cards, Would mask 1 column patients.appointments, Would mask 4 columns billing.accounts and Would mask 11 columns patients.patients, all by API key: support-portal; Kept masked as Phone patients.appointments.callback by Alex Rivera; Masking set to Preview after the first scan and Scan finished: 65 columns in 4 databases by System; and Scan started by Alex Rivera.](/img/security/data-masking/activity-preview.png)

## Filters

Six chips filter the list. Each one asks the server for its own kinds:

| Chip | Kinds | Shows |
|---|---|---|
| **All** | every kind | Everything |
| **Changes** | `mode`, `decision`, `rule`, `baseline` | Mode switches, column decisions, mask format changes, rules and baselines |
| **Access** | `access` | Changes to who sees real values |
| **Scans** | `scan` | Scans that started, finished or failed |
| **Blocked** | `blocked` | Requests and setting changes that Data Masking rewrote or refused |
| **Preview** | `preview` | What Preview would have masked |

The **Preview** chip appears while the mode is Preview, or once the list has shown a preview row. The list loads 200 rows at a time. **Load older** fetches the next page. An empty log reads "No activity yet".

## Read a row

Rows are grouped by day, under "Today", "Yesterday" or a date such as "Monday, Nov 10". Each row has:

- an icon for its kind;
- the text, such as "Kept masked as Phone";
- the target, shown as code: a column (`patients.appointments.callback`), a table (`billing.payment_cards`), a database, a baseline id (`hipaa`) or a system path. A rule row shows the rule as its sentence;
- the actor;
- the time, relative ("just now", "2 hours ago"). Hover it to see the exact local time.

### Actors

| Actor | Who |
|---|---|
| An admin's name, such as `Alex Rivera` | An admin, in the admin app or through the API |
| A user's name | A user signed in to an app |
| `API key: support-portal` | An app that called with its API key and no user session |
| `System` | Scans finishing or failing, and the switch to Preview after the first scan |
| `Command line` | `php artisan df:masking` |
| A label followed by `(AI session)`, such as `Alex Rivera (AI session)`, `API key: support-portal (AI session)`, `AI Chat (AI session)` or `Agent <name> (AI session)` | An AI or MCP session. See [Who sees real values](./access.md) for how Data Masking detects one |
| `Anonymous` | A caller with no user and no app |

## What each kind records

| Kind | Chip | Example rows |
|---|---|---|
| `mode` | Changes | "Masking set to On"; "Masking set to Preview after the first scan" (by System); "Masking set to On by the HIPAA baseline" |
| `decision` | Changes | "Kept masked as Phone", "Set class to National ID" and "Marked not sensitive", with the column as target; "Email now masked as first letter" for a change on the **Masks** tab |
| `access` | Access | "Admin access set to selected"; "Jordan Lee was given real values for 8 hours"; "Real values removed for Jordan Lee"; "AI and MCP sessions now match admins"; "support now sees real values (all except restricted)"; "support is masked again" |
| `scan` | Scans | "Scan started"; "Scan started for Patient records"; "Scan started to apply a value rule"; "Scan started by the HIPAA baseline"; "Scan finished: 65 columns in 4 databases"; "Scan failed: could not read HR" |
| `rule` | Changes | "Added a column name rule for Health & special category"; "Added a value rule for Health & special category"; "Deleted a value rule for Health & special category" |
| `baseline` | Changes | "Applied the HIPAA baseline (2 changes)"; "Stopped tracking the HIPAA baseline (settings unchanged)" |
| `preview` | Preview | "Would mask 11 columns", with the table as target. See [Preview rows](#preview-rows) |
| `blocked` | Blocked | See [Blocked rows](#blocked-rows) |

A few details:

- Grant rows give the duration chosen: "for 1 hour", "for 8 hours", "for 24 hours", "for 7 days" or "until turned off". A grant that runs out writes no row.
- A "Scan finished" row can end with " (could not scan HR)" or "; values of 2 columns could not be read".
- Applying a baseline writes one row with the number of changes, plus a `mode` row if it changed the mode and a `scan` row if it started the first scan. It doesn't write a row per change. The Apply dialog on **Security > Compliance** lists the changes before you confirm.
- Revoking every grant from the command line writes "Real values removed for every admin".

## Preview rows

In Preview, apps get real values. Data Masking records what it would have masked, so you can see who would be affected before you turn masking On.

A preview row reads "Would mask N columns" (or "Would mask 1 column"). The target is the table, such as `billing.payment_cards`, and the actor is the caller, such as `API key: support-portal`. N is the number of columns in that response the caller would have received masked.

- **At most one row per caller and table per hour.** The first response in the hour sets N. Later requests to the same table within the hour add no row, even for other columns. A caller here is the combination of user, role, app and whether the request is an AI session.
- **Only responses that contain a masked column.** A request for `fields=id`, or for other unmasked columns, adds no row. Neither does an error response.
- **Only callers who would be masked.** A caller who sees real values for every column in the response adds no row.
- **Only table requests.** Stored procedures and functions (`_proc`, `_func`) add no preview row.
- **Admins count too.** Admins are masked by default, so browsing a table in **Data Explorer** during Preview adds a row with your name.

The row shows a count, not column names. To see which columns are masked, open the table on the **Columns** tab with the **Masked** filter.

In the example above, the `support-portal` app read four tables during Preview, and each table got one row. Before turning masking On, the Acme Health admins used these rows to check which callers would be affected. [Get started](./get-started.md) walks through that check.

## Blocked rows

### Requests that masking rewrote or refused (mode On)

In mode On, Data Masking changes or refuses requests that would reveal masked values. It records them under **Blocked**, with the table or column as target. The rows are throttled, so one row can stand for many requests.

These requests still succeed with `200`, minus the part that used a masked column:

| Row | What the caller sent | What happened |
|---|---|---|
| "Conditions on a masked column matched no rows" | A filter, or a lookup by id, comparing a masked column in a way the caller may not | The condition matched no rows. A lookup by id gets `404` or a batch error instead of `200` |
| "A filter Data Masking could not check matched no rows" | A filter Data Masking couldn't parse that mentions a masked column | The filter matched no rows |
| "Sorting by a masked column was left out" | `order` on a masked column | The sort was ignored |
| "Grouping by a masked column was left out" | `group` on a masked column | The grouping was ignored |
| "A function on a masked column was left out" | A function over a masked column in `fields` | The field was left out |
| "Masked columns could not be used to filter, sort or group" | More than one of the above in one request | All of the above |

Each of these is logged at most once every 10 minutes for the same caller, target and rewrite.

These requests are refused:

| Row | What the caller sent | Answer | Logged at most |
|---|---|---|---|
| "Blocked a write that filtered on a masked column" | `PUT`, `PATCH`, `MERGE` or `DELETE` whose filter or id compares a masked column other than by exact match, or compares a restricted or free-text column at all | `400 Writes may filter masked columns (ssn) only by exact match (=, IN), and never restricted or free-text columns.` | Once a minute per caller and target |
| "Blocked an insert of masked values" | `POST` with masked values copied from a read | `400 Masked values can't be inserted. Send real values or leave the field out.` | Once a minute per caller and target |
| "Blocked an expression on a table with masked columns" | A write with an `expression` value | `400 Expressions are not allowed on tables with masked columns` | Once a minute per caller and target |
| "Blocked a package export of masked table data" | A package export with table data, by a caller who gets masked values | `403 Exporting table data needs real-value access. Ask the super admin for a grant, or export without table data.` | Once a minute per caller and database |
| "Blocked AI access to a database Data Masking cannot mask" | An AI session calling a database service Data Masking doesn't cover, such as MongoDB | `403 Data Masking blocks AI access to services it cannot mask.` | Once every 10 minutes per caller and database |

A write filter Data Masking can't verify is refused with `400 Data Masking could not verify the filter of this write. Use simple comparisons, or filter on columns that are not masked.` and logged on the same "Blocked a write that filtered on a masked column" row.

Here is one request and the row it leaves. The `support-portal` app filters on `ssn` (National ID) and sorts by `email`:

```http
GET /api/v2/patients/_table/patients?fields=id&filter=ssn like '123%'&order=email
X-DreamFactory-API-Key: YOUR_APP_API_KEY

HTTP/1.1 200 OK
X-DreamFactory-Masking-Rewrites: filter:ssn, order:email

{"resource":[]}
```

The Activity tab shows "Masked columns could not be used to filter, sort or group" with the target `patients.patients.ssn` and the actor `API key: support-portal`. [What changes for apps](./app-behavior.md) explains each rewrite and the response headers.

![The Activity tab in mode On with 31 masked columns. Rows include Applied the HIPAA baseline (2 changes) hipaa; support now sees real values (all except restricted); Jordan Lee was given real values for 8 hours; Admin access set to selected; Conditions on a masked column matched no rows patients.patients.ssn and Masked columns could not be used to filter, sort or group patients.patients.ssn, by API key: support-portal and by Alex Rivera; Masking set to On; Scan finished: 65 columns in 4 databases; and Scan started to apply a value rule.](/img/security/data-masking/activity-on.png)

In the screenshot, the same two blocked rows appear twice: once for the app, and once for Alex Rivera, who filtered on `ssn` in **Data Explorer** while admins still got masked values.

Data Masking doesn't log updates whose masked values it dropped as unchanged, or database errors whose details it removed.

### Setting changes that were refused (every mode)

Refused changes to Data Masking or Compliance settings are logged in every mode, Off included, and are never throttled. Refused reads are not logged.

| Row | Cause | Answer |
|---|---|---|
| "Blocked an attempt to change Data Masking settings" | An AI or MCP session tried to change a setting. The target is the path, such as `system/data_masking/rule` | `403 AI sessions cannot change Data Masking settings.` |
| "Blocked an attempt to change access" | An AI session tried to change access, or an admin who is not the super admin tried to give access | `403 AI sessions cannot change Data Masking settings.` or `403 Only the super admin can give access.` |
| "Blocked an attempt to change compliance baselines" | An AI session tried to apply or stop a baseline | `403 AI sessions cannot change compliance baselines.` |
| "Blocked an attempt to lower the masking mode" | An admin who is not the super admin tried to switch from On to Preview or Off | `403 Only the super admin can lower the masking mode.` |
| "Blocked an attempt to change Data Masking settings by a caller that is not a system administrator" | A caller who is not a full system administrator, such as a role granted access to the `system` service or a restricted admin, tried a change. For Compliance the row reads "... change Compliance baselines by ..." | `403 Only a system administrator can change Data Masking settings.` |

## What each mode logs

| Rows | Off | Preview | On |
|---|---|---|---|
| Setting changes (`mode`, `decision`, `access`, `rule`, `baseline`) | Yes | Yes | Yes |
| Scans (`scan`) | Yes | Yes | Yes |
| Refused setting changes (`blocked`) | Yes | Yes | Yes |
| "Would mask" rows (`preview`) | No | Yes | No |
| Rewritten or refused requests (`blocked`) | No | No | Yes |

Off leaves app traffic alone completely, but it still records admins' changes, scans, and refused setting changes such as an AI session trying to change a setting.

## Retention

Data Masking deletes activity rows older than `DF_MASKING_ACTIVITY_RETENTION_DAYS` days. The default is `400`. Set it to `0` to keep rows forever.

- Deletion is lazy. About one activity write in 200 also deletes the expired rows, so rows can stay a little past the window, and an instance that records nothing new deletes nothing.
- The PCI DSS and CJIS baselines check "Masking activity kept for at least a year". It passes at `365` or more, or at `0`. The default passes, with the detail "Masking activity is kept for 400 days."
- Set the variable in the environment of every DreamFactory node, like other DreamFactory settings. See [Install and operate](./operations.md).

## Read activity over the API

`GET /api/v2/system/data_masking/activity` returns the same rows, newest first, 200 per page. `kind` takes one kind or a comma-separated list, `limit` changes the page size (at most 1000), and `before` set to the smallest `id` you have returns the next older page. Only full system administrators can read it: a role or API key gets `403 Only a system administrator can view Data Masking settings.` even when its role grants the `system` service.

```bash
curl "https://your-dreamfactory-instance.com/api/v2/system/data_masking/activity?kind=blocked,preview&limit=50" \
  -H "X-DreamFactory-Session-Token: <admin session token>"
```

```json
{
  "resource": [
    {
      "id": 57,
      "at": "2026-11-16T19:45:37Z",
      "actor": "API key: support-portal",
      "kind": "blocked",
      "text": "Conditions on a masked column matched no rows",
      "target": "patients.patients.ssn"
    },
    {
      "id": 50,
      "at": "2026-11-16T19:41:02Z",
      "actor": "API key: support-portal",
      "kind": "preview",
      "text": "Would mask 4 columns",
      "target": "billing.payment_cards"
    }
  ],
  "has_more": false
}
```

The response above is shortened to two of its rows. `at` is in UTC, and `target` is `null` when a row has none. Rule rows also carry `match` (`name` or `value`), and their `target` is the rule's pattern. `has_more` stays `true` while older rows of the same kinds exist. The [API and CLI reference](./api-and-cli.md#activity) lists the parameters and the 400 errors.

## Use it as evidence

The log answers the questions auditors ask about masking: when masking was turned On and by whom, who was given real values and for how long, which columns an admin decided by hand, and which rules were added.

- **Export it with a baseline.** On **Security > Compliance**, a baseline's **Export** as JSON includes an `activity` block with the last 90 days, up to 5,000 rows. Its counts per kind cover the whole 90 days, and `truncated` is `true` when rows were left out. The CSV export has one row per check and no activity. See [Compliance baselines](../compliance-baselines.md).
- **Export a longer window with the API.** Page through `GET /activity` with `before` and store the result.
- **Treat exports as internal.** They hold no data values, but they name admins, users and apps.

The `activity` block of the JSON export looks like this (`entries` shortened to one row):

```json
"activity": {
  "since": "2026-08-18T19:50:12Z",
  "total": 21,
  "by_kind": [
    {"kind": "access", "count": 3},
    {"kind": "baseline", "count": 1},
    {"kind": "blocked", "count": 4},
    {"kind": "decision", "count": 1},
    {"kind": "mode", "count": 2},
    {"kind": "preview", "count": 4},
    {"kind": "rule", "count": 2},
    {"kind": "scan", "count": 4}
  ],
  "entries": [
    {
      "id": 63,
      "at": "2026-11-16T19:48:51Z",
      "actor": "Alex Rivera",
      "kind": "baseline",
      "text": "Applied the HIPAA baseline (2 changes)",
      "target": "hipaa"
    }
  ],
  "truncated": false
}
```

:::note[Not a request log]
Preview and blocked rows are throttled, and requests that pass unchanged aren't logged at all. For a record of every request, use DreamFactory's request logging: a [Logstash service](../../system-settings/logstash.md) subscribed to your databases' events, or the MongoDB request log. Every Compliance baseline checks it as "Reads from every SQL database are logged".
:::

## Things to know

- **Rows can't be edited or deleted.** Neither the admin app nor the API changes or removes activity rows. Only retention deletes them, and the uninstall steps in [Install and operate](./operations.md) drop the table.
- **Rows outlive accounts.** The actor is stored as text, so a row keeps the admin's or app's name after the account is deleted.
- **Logging never blocks a request.** If a row can't be written, Data Masking writes a warning to the DreamFactory log and the request goes on.
- **Times on the tab are relative.** Hover a time for the exact local time. The API returns UTC.
- **A grant's end isn't logged.** Work it out from the row that gave it, such as "Jordan Lee was given real values for 8 hours".
- **One Apply, one row.** Applying a baseline logs the number of changes, not each change.
- **Mask format changes are under Changes.** They are `decision` rows, such as "Email now masked as first letter".

## Related

- [Get started](./get-started.md): use Preview rows to check a rollout before turning masking On.
- [What changes for apps](./app-behavior.md): the rewrites and refusals behind blocked rows.
- [Who sees real values](./access.md): grants, roles and AI sessions that appear in access rows.
- [Compliance baselines](../compliance-baselines.md): evidence exports that include the activity log.
- [Install and operate](./operations.md): setting `DF_MASKING_ACTIVITY_RETENTION_DAYS`.
