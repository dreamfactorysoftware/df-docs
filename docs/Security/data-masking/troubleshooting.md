---
sidebar_position: 11
title: Troubleshooting and limits
id: troubleshooting
description: "Fix common Data Masking problems: empty filter results, 404s on masked keys, 403 and 409 errors, scans, rules and caches. Includes a FAQ and the v1 limits."
keywords: [data masking, troubleshooting, FAQ, limits, masked values, 403, 409, X-DreamFactory-Masking-Rewrites, X-DreamFactory-Masked-Fields, compliance baselines]
difficulty: intermediate
---

# Troubleshooting and limits

This page lists the problems people meet most often with Data Masking and Compliance baselines, what causes each one, and how to fix it. It ends with a FAQ and the known limits of this release (v1).

## Start here

Three tools answer most questions:

- **The response headers.** In mode On, `X-DreamFactory-Masked-Fields` lists the masked fields in a response, and `X-DreamFactory-Masking-Rewrites` lists what Data Masking changed in the request. Run curl with `-i` to see them.
- **The Activity tab.** Under **Blocked**, Activity records filters that matched no rows, refused writes and blocked AI access, with the caller. In Preview, the **Preview** filter shows which callers would get masked values.
- **`php artisan df:masking status`** on the server prints the mode, who sees real values, the last scan and the column counts.

For example, an app filters on `ssn` and sorts by `email`, both masked. The call succeeds with no rows, and the header says why:

```bash
curl -i -G "https://your-dreamfactory-instance.com/api/v2/patients/_table/patients" \
  -H "X-DreamFactory-API-Key: YOUR_APP_API_KEY" \
  --data-urlencode "fields=id" \
  --data-urlencode "filter=ssn like '123%'" \
  --data-urlencode "order=email"
```

```http
HTTP/1.1 200 OK
X-DreamFactory-Masking-Rewrites: filter:ssn, order:email
X-DreamFactory-Trace-Id: 36c613bf-98c2-40dd-8fc2-eac5f4371584

{"resource":[]}
```

`filter:ssn` means the condition on `ssn` matched no rows. `order:email` means the sort on `email` was left out. Field names that contain spaces, commas or non-ASCII characters are percent-encoded in these headers; see [What changes for apps](./app-behavior.md) for the format.

## Setup and install

| Symptom | Cause | Fix |
|---|---|---|
| **Security > Data Masking** or **Security > Compliance** shows the upgrade page ("Access to this feature is available via our commercial product.") on a Gold instance. | The `dreamfactory/df-masking` package is not installed. On open source and Silver licenses the menu items also carry a lock. | Contact DreamFactory support for the package. See [Install and operate](./operations.md). |
| The page shows "Couldn't load data masking" and `Data Masking is not set up yet. Run: php artisan df:masking setup` (HTTP 503), or `df:masking status` prints `Data Masking tables are missing. Run: php artisan df:masking setup (or php artisan migrate --force).` and exits 1. | The package is installed, but its tables are not. | Run `php artisan df:masking setup` on the server, as the web server user. |
| There is no **Off** / **Preview** / **On** switch, only **Scan databases**. Or the switch shows, but **Preview** and **On** are greyed out. | No scan has found columns yet. Until one has, the switch stays hidden (or Preview and On stay disabled), and the page gives no other reason. | Click **Scan databases**, or run `php artisan df:masking scan`. See [Get started](./get-started.md). |

## Scans and classification

| Symptom | Cause | Fix |
|---|---|---|
| The Columns tab shows "No SQL databases yet" or "No tables to scan". | Data Masking covers SQL database services only. You have none, or the ones you have, such as the built-in `db`, have no tables. | Add a SQL database service that has tables (**Add a database**), then scan. |
| Turning masking On fails with 409 `Scan your databases before turning masking on.` The CLI prints the same line and exits 1. | No completed scan has found at least one column. A scan of empty databases does not count, and neither does a scan from an earlier install. | Add your SQL databases, scan, then turn masking On. |
| A new database service is not scanned when you create it. | Automatic scans of new and changed services start only after some scan has finished, or once the mode is not Off. | Run one scan (**Scan databases**, `php artisan df:masking scan`, or `setup`). Services you add after that are scanned automatically. |
| **Scan now** keeps the browser waiting, or the request times out. | The server found no command-line PHP, or `proc_open` is disabled, so the scan runs inside the web request instead of in the background. | Set `DF_MASKING_PHP_BINARY` to the CLI PHP binary (for example `/usr/bin/php`) and allow `proc_open`. See [Install and operate](./operations.md). |
| Toast "Scan failed. Couldn't read Billing." or "Scan finished. Couldn't read Billing.", and the database is listed under "Couldn't scan". | The scan could not connect to or read that database. Hover the row for the reason, such as `Could not connect (SQLSTATE ...)`, `Login failed ...` or `Permission denied ...`. | Fix the service's connection settings or the database account's permissions, then click **Retry** on that row. |
| The Columns tab shows "Couldn't read the scan history. Check the DreamFactory log." and no **Scan databases** button. Compliance masking checks read `Could not be checked: see the DreamFactory log.` | DreamFactory could not read the scan history from its system database. This is a server problem, not a sign that nothing was scanned. | Check the DreamFactory log and the system database, then reload the page. |
| Columns from Snowflake, Databricks, Trino, Dremio or BigQuery are mostly **To review**. | These warehouses bill per query, so scans classify them from column names only. Name-only scoring sends anything that scores 15 or more to review, instead of 40. | Scan with sampling: `php artisan df:masking scan --sample`, or `POST /api/v2/system/data_masking/scan` with `{"sample": true}`. Sampling runs queries that the warehouse bills. |

## Apps and API calls

| Symptom | Cause | Fix |
|---|---|---|
| A filter returns no rows (200 with an empty `resource`), and the response has `X-DreamFactory-Masking-Rewrites: filter:<column>`. | In mode On, a comparison the caller may not make on a masked column matches nothing. Restricted and free-text columns allow only `IS NULL` and `IS NOT NULL`. Identity and quasi-identifier columns also allow `=`, `!=` and `IN` with up to 25 values. `LIKE`, `CONTAINS`, ranges and functions match nothing. | Filter on unmasked columns or ids, use exact matches on identity columns, or give the caller's role real-value access. See [What changes for apps](./app-behavior.md). |
| `GET _table/{table}/{id}` returns 404 `Record with identifier '•••' not found.` although the record exists. With `ids=` or records in the body, the answer is 400 `Batch Error: Not all requested records could be retrieved.` | The table's key column is masked as a restricted or free-text class, or you asked for more than 25 ids on an identity or quasi-identifier column, so the lookup never runs. The batch error holds a 404 for the first id only, or for every id with `continue=true`. | Look records up by an unmasked key, mark the key column **Not sensitive** if it holds no personal data, or grant real values. |
| PUT, PATCH or DELETE returns 400 `Writes may filter masked columns (ssn) only by exact match (=, IN), and never restricted or free-text columns.` or `Data Masking could not verify the filter of this write. Use simple comparisons, or filter on columns that are not masked.` | The write's filter or id uses a masked column with a comparison that is not exact, or uses any restricted or free-text column. Data Masking refuses such writes; it never rewrites them. | Write by an unmasked key. |
| POST returns 400 `Masked values can't be inserted. Send real values or leave the field out.` | The client copied a masked value (bullets, or a token such as `EMAIL_e4a7daa0`) from a read into an insert. | Send real values, leave the field out, or send `null`. |
| An update leaves a masked field unchanged, or returns 400 `Nothing to write: the request only sent back masked values, and masked values are never written.` | Masked values sent back are treated as unchanged and dropped. For numeric columns, and columns using the Null format, a `null` sent back also counts as unchanged. | Make the update as a caller with real-value access. |
| A sort or group you sent is ignored, or a grouped field is missing from the result. The Rewrites header shows `order:`, `group:` or `fields:` items. | Sorting, grouping and functions on masked columns are left out (`COUNT` is kept). When a group on a masked column is dropped and the request has aggregates, plain selections of that column are dropped too. | Sort and group on unmasked columns. |
| An app that expects a number gets `null`. | Masked numbers and booleans become `null` under every format except Token. | Handle `null` in the app, or give the caller real-value access. See [Classes and mask formats](./classes-and-formats.md). |
| A browser app can't read `X-DreamFactory-Masked-Fields` or `X-DreamFactory-Masking-Rewrites`. | Cross-origin JavaScript sees only the headers that CORS exposes, and Data Masking does not change CORS. | Add both header names to the exposed headers of your CORS entry (**System > Config > CORS**). |
| A regular client is masked even though its role has real-value access, or gets 403 `Data Masking blocks AI access to services it cannot mask. This request counts as an AI session because it carries X-DreamFactory-Trace-Id.` | DreamFactory returns `X-DreamFactory-Trace-Id` on every response. A gateway or SDK that copies it into later requests turns them into AI sessions. | Don't forward that header from clients that are not AI tools. |
| Scheduled tasks, queue jobs, MQTT or AMQP listeners, or artisan scripts get masked values. | They run without a session, so no admin grant or role access applies. | Give the scheduled task a run-as app, and turn on real-value access for that app's role on the **Access** tab. |
| Package export returns 403 `Exporting table data needs real-value access. Ask the super admin for a grant, or export without table data.` | In mode On, exporting table data as a caller who gets masked values would turn masked values into data on the target. | Get a grant, or export without table data. |
| Requests fail with 500 `Data Masking could not check this request.` or `Data Masking could not mask this response, so it was withheld.` | In mode On, Data Masking could not read its settings or resolve a table, so it fails closed. In Preview the same request goes through and the error is logged instead. | Check the DreamFactory log and the health of the system database. |

## Access

| Symptom | Cause | Fix |
|---|---|---|
| Admins, you included, see bullets and tokens in Data Explorer and API responses. | Admins are masked by default (**Admins: No one**). | The super admin sets **Admins** to **Selected** and gives you a grant on the **Access** tab, or the operator runs `php artisan df:masking grant you@example.com --for=8h`. A grant made through the API does nothing while admin access is **No one**; the CLI switches it to **Selected** for you. See [Who sees real values](./access.md). |
| Giving an admin access, turning a role on, widening a role to **All classes**, or setting AI to **Same as admins** fails with 403 `Only the super admin can give access.` | A df-compliance super admin is designated and you are not them. Every change that loosens access needs the super admin, and a request that mixes loosening with tightening is refused as a whole. | Ask the super admin. In an emergency, the operator can run `php artisan df:masking grant` on the server. |
| With masking On, **Off** and **Preview** are greyed out and the page shows "Only the super admin can lower the masking mode." An API call that lowers the mode gets 403 with the same text. | Lowering the mode from On also needs the super admin. Raising it never does. | Ask the super admin, or the operator runs `php artisan df:masking mode preview` (or `mode off`). The command always works and is logged as "Command line". |
| A role, or an API key granted the `system` service, gets 403 `Only a system administrator can view Data Masking settings.` Restricted admins don't see the Data Masking and Compliance menu items. | Both APIs require a full system administrator (an admin with no role), whatever role-based access allows. | Use a full system admin account. |
| A role set to **All except restricted** still gets a masked value in a column waiting for review. | A review column with no class is treated as restricted. | Choose a class for the column on the **Columns** tab. |

## Rules

| Symptom | Cause | Fix |
|---|---|---|
| A value rule masks nothing, or its preview shows no match. | A value rule needs at least 3 matching sampled values, and at least half of the column's sampled non-null values. A column with fewer than 3 sampled non-null values never matches. | Use a name rule, or decide the column yourself. See [Custom rules](./custom-rules.md). |
| A "look like" rule typed from an example with `#` in it, such as `INV#00012`, matches nothing. | In "look like", `#` is a digit slot, so `INV#00012` becomes the shape `AAA######`. | Use "match regex" instead, for example `^INV#\d{5}$`. |
| A new value rule shows 0 matches, or a spinner under **Matches**. | Value-rule matches are counted from scan results, and the scan the rule started has not finished. On an instance that was never scanned, with masking Off, no scan starts. | Wait for the scan (`php artisan df:masking status`), or start one. |
| A column stays masked after you delete the rule that masked it, or after a rescan. | Rules and rescans only add masking; they never remove it. The evidence then reads `Masked as <Class> by a detection rule that no longer matches; ...`. | Choose **Delete and unmask** in the delete dialog when it is offered, or mark the column **Not sensitive**. |
| A custom or baseline rule doesn't change a column whose name or values it matches. | An admin marked that column **Not sensitive**, and rules never override admin decisions. Or the column is already masked with a stricter class: it keeps that class, and the rule only adds an `Also matches:` line to its evidence. | Set the column's class yourself on the **Columns** tab. |

## Operations

| Symptom | Cause | Fix |
|---|---|---|
| After pulling a new image or re-creating the container, apps get real values again, with no warning. | The package was installed into the running container and is gone. The settings are still in the system database, but nothing enforces them. | Once support has provided the package, bake it into your image. Add `php artisan df:masking status` to deploy or health checks: it exits 1 when the package or its tables are missing. Exit 0 does not mean masking is On, so also check the `Mode:` line. See [Install and operate](./operations.md). |
| On one node the API still returns real values after masking was turned On, or after a grant was removed. | The nodes use separate cache stores (`file` or `apc`), so the change never reaches the other nodes. Settings stay cached for up to an hour. | Point every node at the same Redis or Memcached cache, then run `php artisan cache:clear` on each node. |
| Apps get masked values or 500 errors although masking was Off or in Preview, and the DreamFactory log shows `df-masking: could not read dm_setting (...); enforcing mode on until it can be read.` | Data Masking could not read its settings from the system database. It enforces the last mode it read, or On when it has read none, so a failing system database never turns masking off. | Fix the system database connection. Masking returns to the stored mode as soon as the settings can be read again. |
| Tokens changed after an `APP_KEY` rotation, or differ between two instances. | The token key is generated per instance and stored encrypted with `APP_KEY`. A key that can't be decrypted is replaced, with a warning in the log. | Set the same `DF_MASKING_TOKEN_KEY` (base64 of 32 bytes) wherever tokens must match. |
| The compliance check "Idle sessions require signing in again after N minutes" still fails after you set `DF_JWT_TTL`. | DreamFactory renews an expired token without credentials until `DF_JWT_REFRESH_TTL` after sign-in (default 20160 minutes). The check needs both values at or below N, and `DF_ALLOW_FOREVER_SESSIONS` not true. | Set `DF_JWT_REFRESH_TTL` as well. Users then sign in again at least every N minutes. See [Compliance baselines](../compliance-baselines.md). |

## FAQ

### Does Data Masking store my data?

No raw values. Scans read sample values in memory to classify columns, and keep only the results: the class, the score, evidence lines with counts and value shapes (such as `(999) 999-9999`), and a masked example per column. The `dm_*` tables in the system database hold settings, decisions, rules and activity, never raw values. Evidence exports contain no data values either.

DreamFactory itself may write database error text, which can include submitted values, to its own log. Data Masking never logs values.

### Does it change data in my databases?

No. Data Masking changes API responses, not tables. Scans only read: they sample up to 128 rows from each end of a table with `SELECT` statements. On PostgreSQL, MySQL, MariaDB and SQL Server each read runs in a transaction that is always rolled back, read-only on PostgreSQL and MySQL. Other SQL databases get plain `SELECT` statements. See [Scans only read](./review-columns.md#scans-only-read).

Masked callers cannot write masked values back either. Masked values sent in an update are dropped as unchanged, and inserts that contain masked values are refused. The one exception is upserts: see [Limits](#limits-v1).

### Can a client turn masking off with a header?

No. Data Masking reads no request header or parameter of its own, so a client cannot opt out. The only request header that changes anything is `X-DreamFactory-Trace-Id`, and it makes the request stricter: the caller counts as an AI session.

### How do I see what an app sees?

Call the API with the app's API key and read the values and headers:

```bash
curl -i -G "https://your-dreamfactory-instance.com/api/v2/patients/_table/patients/2" \
  -H "X-DreamFactory-API-Key: YOUR_APP_API_KEY" \
  --data-urlencode "fields=id,first_name,email,ssn,date_of_birth,notes"
```

```http
HTTP/1.1 200 OK
X-DreamFactory-Masked-Fields: first_name, email, ssn, date_of_birth, notes
X-DreamFactory-Trace-Id: 02f30114-d073-41de-b449-8e0cea288a46

{"id":2,"first_name":"NAME_87183da6","email":"EMAIL_e4a7daa0","ssn":"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022","date_of_birth":"1979-\u2022\u2022-\u2022\u2022","notes":"Send lab results to \u2022\u2022\u2022\u2022\u2022\u2022."}
```

`\u2022` is the JSON escape for the bullet character `•`, so `ssn` holds 8 bullets and `date_of_birth` keeps only the year. In **Data Explorer**, the line "Roles with read access" shows a role's API key, and **Copy curl** copies a request that uses it. In Preview, the Activity tab's **Preview** filter lists "Would mask N columns" per caller and table.

What you see in Data Explorer as an admin is not necessarily what an app sees: admins and roles have separate access settings.

### Why do I, an admin, see masked values?

Admins are masked by default, in Data Explorer and in the API. That is why the turn-on dialog says "you included". The super admin can give you a time-limited grant on the **Access** tab. See [Who sees real values](./access.md).

### Does masking On also mask columns still to review?

Yes. In mode On, columns waiting for review are masked too, so unsure detections fail closed. The turn-on dialog counts them together with the masked columns.

### Does it work with MongoDB and other non-SQL databases?

No. This release covers SQL database services only. MongoDB, Cassandra, CouchDB, DynamoDB, Salesforce and other database services are listed as "Not covered" on the **Columns** tab, and their values are not masked. People and apps keep normal access to them. AI sessions get 403 from them while masking is On.

### Can I copy the masking configuration to another instance?

Not with package export: `system/package` does not include Data Masking or Compliance settings. Re-create the settings on the target instance in the admin app or with the `system/data_masking` API, or apply the same baseline there. Tokens also differ between instances unless both use the same `DF_MASKING_TOKEN_KEY`. The evidence export is a report, not a configuration you can import.

### What about AI tools and MCP?

AI and MCP sessions get masked values by default, even when their user's role or admin grant would show real values (**AI and MCP sessions: Always masked**). Data Masking treats these as AI sessions: requests from the MCP server (which sends `X-DreamFactory-Trace-Id` on every call), DreamFactory agents, and AI Chat. It does not detect admin-defined MCP custom tools that call the data API, script callbacks made over HTTP, or a model driving a person's own credentials.

While masking is On, AI sessions get 403 from database services that Data Masking cannot mask. They can read the Data Masking and Compliance settings, but every change they attempt is refused with 403 and logged. See [Who sees real values](./access.md).

### Is Preview safe?

Preview is safe for apps: it changes no response, adds no header, and apps, AI tools and admins receive real values. It records which callers would get masked values, at most one Activity row per caller and table per hour.

Preview also protects nothing. Use it to find which apps read sensitive columns before you turn masking On, not as a control. A baseline's "is masked in API responses" check fails in Preview.

### How fast is it?

In the release measurements, mode On added 5.1 to 10.8 ms to a 100-row read with 11 of 16 columns masked, and Preview 0.8 to 5.0 ms. Mode Off adds no Data Masking database queries. See [Performance](./operations.md#performance) for the test setup, and measure on your own stack before you rely on these numbers.

### Is a compliance baseline a certification?

No. A baseline checks the DreamFactory settings that support a framework's requirements. It does not cover controls outside DreamFactory, and its framework references are not legal advice. See [Compliance baselines](../compliance-baselines.md).

## Limits (v1)

- **SQL services only.** MongoDB, Cassandra, CouchDB, DynamoDB, Salesforce and other database services are not masked. People and apps keep normal access to them; AI sessions are blocked from them while masking is On.
- **Event scripts that set or change filters are not checked.** A `pre_process` script runs after Data Masking checks the request, so a filter, sort or group it adds on a masked column runs on real values, and its results can reveal them. Scripts are admin code with full trust. Limit who can edit event scripts (give non-admin roles no access to `system/event_script`), and review scripts that build filters from request parameters.
- **Scripts that open their own database connections** bypass the API, so they are not masked. Internal `_spec` calls from server-side scripts are not intercepted either. HTTP `_spec` model requests are masked.
- **Names inside free text are not detected.** Span masking in free text covers email addresses, phone numbers, card numbers, national IDs (US SSN with dashes, UK NI number, French NIR, Spanish DNI and NIE), IBANs, IPv4 addresses and credentials (private keys, JWTs and provider API keys).
- **Lists of IP addresses** (such as `203.0.113.7, 198.51.100.4` in `x_forwarded_for`) are detected as IP address only in columns whose name suggests IP addresses, such as `x_forwarded_for` or `client_ip`. The same lists under other names stay not sensitive. Add a name rule or decide the column yourself.
- **New tables and columns** are classified from their names until their scan finishes, which takes seconds, or minutes on large databases. In mode On, their text columns are span-masked meanwhile. If you changed the Free text format from Detected spans to Redact or Null, those columns, keys included, are fully hidden until the scan finishes. Custom rules apply to them only after that scan.
- **Tables keyed on a masked restricted or free-text column** cannot be read or edited by id by masked callers. Reads by path id answer 404, reads by `ids=` or by records in the body answer 400 `Batch Error: Not all requested records could be retrieved.`, and writes answer 400. On an identity or quasi-identifier key, the same happens above 25 ids.
- **Relationships keyed on a masked column** (for example on email) can return empty related records for masked callers. They fail closed.
- **Computed fields stay masked** after their expression is removed or changed, until an admin marks them **Not sensitive**. Their evidence reads `Was built from: ...`.
- **Upserts.** On services with `allow_upsert`, a PUT or PATCH that ends up inserting a row stores `NULL` for the masked fields it dropped as unchanged.
- **Stored procedures and functions** (`_proc`, `_func`) are masked on a best-effort basis: result cells by column name, and detected spans in every other string. Their `X-DreamFactory-Masked-Fields` value is `*`.
- **Numbers and booleans become `null`** under every format except Token. GraphQL types are not made nullable for masked columns.
- **Empty strings stay empty.** A masked empty string is returned as `""`, so a caller can tell that the value is empty. Redact otherwise always returns 8 bullets, whatever the length.
- **Masking configuration is not part of package export.** Re-create it, or apply the same baseline, on the target instance.
- **Per-node caches are not supported.** Every node must use the same cache store.
- **AI detection** covers the MCP server, DreamFactory agents and AI Chat. A non-AI client that forwards `X-DreamFactory-Trace-Id` is treated as an AI session. Admin-defined MCP custom tools that call the data API, script callbacks over HTTP, and a model driving a person's own credentials are not detected as AI.
- **PostgreSQL partitioned tables without a primary key** may be under-sampled.
- **Statement timeouts** while sampling are enforced by the database on PostgreSQL and MySQL only. Elsewhere the per-table time budget is checked between statements.

## Related

- [Data Masking overview](./overview.md)
- [What changes for apps](./app-behavior.md): filters, lookups, writes and headers in detail
- [Who sees real values](./access.md): admins, roles, AI sessions and the super admin
- [Install and operate](./operations.md): installation, Docker, several nodes and configuration
- [API and CLI reference](./api-and-cli.md): every endpoint, error and `df:masking` command
- [Compliance baselines](../compliance-baselines.md)
