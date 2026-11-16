---
sidebar_position: 9
title: Install and operate
id: operations
description: "Verify, set up and run Data Masking: df:masking setup and status, Docker images, shared caches, upgrades, removal, settings and performance."
keywords: [data masking, df-masking, df:masking, installation, setup, docker, health check, redis, cache, cluster, upgrade, uninstall, environment variables, performance]
difficulty: advanced
---

# Install and operate

This page is for the people who run DreamFactory: platform engineers and administrators with shell access. It covers checking that Data Masking is installed, the one-command setup, Docker images, clusters, upgrades, turning masking off, removing the package, configuration and performance.

Data Masking and Compliance baselines require a DreamFactory commercial license (Gold). They ship in the `dreamfactory/df-masking` package. If **Security > Data Masking** shows the upgrade page on a Gold instance, the package is not installed: contact DreamFactory support.

Support provides the package and the steps to install it for your deployment. This page starts once the package is in place.

Installing the package changes nothing on its own. Masking starts **Off**, and API responses stay byte-for-byte identical until an admin turns masking **On**. See [Data Masking](./overview.md) for how the modes work.

## Quick reference

| Concept | Description |
|---|---|
| **Package** | `dreamfactory/df-masking` (Gold) |
| **Check the install** | `php artisan df:masking status` exits `0` when the package and its tables are there, `1` otherwise |
| **First-time setup** | `php artisan df:masking setup [--baseline=ID] [--mode=preview\|on]` |
| **Run commands as** | The web server user, `www-data` |
| **Several nodes** | Every node must use the same cache store (Redis or Memcached) |
| **Turn masking off** | `php artisan df:masking mode off`. Responses are then byte-for-byte those of an instance without the package. |
| **Where the policy lives** | The DreamFactory system database, in nine `dm_*` tables |
| **Settings** | `DF_MASKING_*` environment variables (see [Configuration](#configuration)) |
| **Command reference** | [API and CLI reference](./api-and-cli.md#command-line) |

## What it works with

Data Masking masks **SQL database services** only (every service built on DreamFactory's SQL connector: MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, SQLite, Snowflake and the others). The package needs PHP 8.3 or later. It also uses these DreamFactory packages when they are installed:

| Package | What it adds |
|---|---|
| `df-compliance` | Lets you designate a super admin with `php artisan df:root_admin --admin_id=<id>`. Without it, or while no super admin is designated, every full system admin is the super admin. See [Who sees real values](./access.md). |
| `df-limits` | Needed by the Compliance check "API rate limits are active" |
| `df-logger` (Logstash), or `df-mongo-logs` with `LOGSDB_ENABLED=true` | Needed by the Compliance check "Reads from every SQL database are logged" |

## Check that it is installed

You can check from the admin app, the command line or the API.

**Admin app.** Open **Security > Data Masking**. With the package installed you see the **Columns**, **Access**, **Masks**, **Detection** and **Activity** tabs. Before the first scan, the Columns tab reads "No scan yet" and offers **Scan databases**. When there is nothing to scan yet, it reads "No SQL databases yet" or "No tables to scan" and offers **Add a database**. On a Gold instance, the upgrade page instead means the package is missing. On open source and Silver licenses, the **Data Masking** and **Compliance** menu items also carry a lock icon.

![The Data Masking page in the admin app before the first scan. The Columns tab shows "No scan yet", a Scan databases button and "Start from a baseline" chips for HIPAA, PCI DSS, GLBA, CJIS, GDPR, SOC 2 and ISO 27001.](/img/security/data-masking/first-run.png)

If the page shows "Couldn't load data masking" with the reason `Data Masking is not set up yet. Run: php artisan df:masking setup`, the package is installed but its tables are not. Run [setup](#first-time-setup).

**Command line.** From the DreamFactory directory (`/opt/dreamfactory` in DreamFactory's Docker images):

```bash
php artisan df:masking status
echo $?
```

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
0
```

The exit code tells you whether the package can work:

| Exit code | Meaning |
|---|---|
| `0` | The package is installed and its tables exist. |
| `1` | The tables are missing (`Data Masking tables are missing. Run: php artisan df:masking setup (or php artisan migrate --force).`), the system database cannot be reached, or the package is not installed at all (artisan reports that the `df:masking` command is not defined). |

Exit code `0` does **not** mean masking is On. To check the mode in a script, read `mode` from `php artisan df:masking status --json` (see [Docker](#docker)).

**API.** `GET /api/v2/system/data_masking`, as a system administrator, returns the overview with the current `mode`. See [API and CLI reference](./api-and-cli.md).

## First-time setup

One command creates the tables, scans every active SQL database service, optionally applies a Compliance baseline, and sets the mode:

```bash
php artisan df:masking setup
```

Run it once per system database. If several DreamFactory nodes share one system database, run it on one of them. On an existing install whose databases are already services, the output looks like this:

```text
Creating Data Masking tables...
1/4 Tables ready.
2/4 Scanning 4 database service(s): billing, db, hr, patients...
Scan finished: 65 columns in 4 databases (28 masked, 1 to review, 36 not sensitive).
Mode: Preview
3/4 No baseline requested (see: php artisan df:masking baseline list).
4/4 Masking mode: Preview.

Next: open the admin app > Data Masking, decide the 1 column to review, then switch the mode to On.
```

- **The first line** reads `Creating Data Masking tables...` on a new install and `Updating Data Masking tables...` when the package has migrations that have not run yet. Laravel's own migration lines follow it (they are left out of the example above). When the tables are already up to date, setup starts at `1/4 Tables ready.`
- **The scan runs in the foreground.** On large databases setup can take a while. In an interactive terminal, progress lines (`10%`, `20%` and so on) appear while it runs. Scans started from the admin app or the API run in the background instead.
- **The first scan that finds columns moves masking from Off to Preview**, unless someone already chose a mode. Preview changes no response.
- **The last line** is the one useful next step. Depending on the state it says to decide the columns to review, to switch the mode to On, or `Next: add a SQL database service, then run php artisan df:masking scan.`

Setup is safe to run again at any time. It never lowers the mode and never changes an admin's decisions.

### Options

| Option | Effect |
|---|---|
| `--baseline=ID` | After the scan, apply a Compliance baseline: `hipaa`, `pci_dss`, `glba`, `cjis`, `gdpr`, `soc2` or `iso27001`. Step 3 then reads `3/4 Applying the hipaa baseline...` and lists the changes. See [Compliance baselines](../compliance-baselines.md). |
| `--mode=preview` | Raise the mode to at least Preview. |
| `--mode=on` | Raise the mode to On. It needs a scan that found columns: setup scans first, and if the scan found none it stops with `Scan your databases before turning masking on.` and exits `1`. |

`--mode` only ever raises the mode. If masking is already higher, setup leaves it and says so, for example `Masking is already On; leaving it On (use df:masking mode preview to lower it).`

### A new install with no databases yet

A default DreamFactory install has only the built-in `db` service (SQLite), which is empty. Setup scans it, finds no columns, leaves masking Off, and ends with:

```text
Next: add a SQL database service, then run php artisan df:masking scan.
```

From then on, each SQL database service you add is scanned as soon as you create it, and the first scan that finds columns moves the mode to Preview.

There is one exception. If setup finds **no active SQL service at all** (for example, the built-in `db` was removed or deactivated), it prints `2/4 No active SQL database services yet: nothing to scan. Add a service, then run php artisan df:masking scan.` and runs no scan. New services are then **not** scanned automatically until someone runs a scan or raises the mode. After you add your first database, run `php artisan df:masking scan` or click **Scan databases**.

## Docker

Run artisan commands inside the container as the web server user:

```bash
docker exec -u www-data <container> php /opt/dreamfactory/artisan df:masking setup
docker exec -u www-data <container> php /opt/dreamfactory/artisan df:masking status
```

- **Why `www-data`.** Artisan commands run as root can leave root-owned files in the cache, log or SQLite storage that the web server can no longer write. Data Masking settings changes would then fail with HTTP 500. If you do run `df:masking` as root, it gives the files it created under `storage/` and `bootstrap/cache` back to the owner of `storage/`. Other artisan commands, such as `cache:clear`, don't do this for you.
- **Progress lines.** `df:masking scan` prints `10%`, `20%` and so on only in an interactive terminal. Add `-it` to `docker exec` to see them.

:::danger[A package installed into a running container disappears when the container is re-created]
A package added inside a running container lives in that container's writable layer. Pulling a new image, or re-creating the container for any other reason, removes it. The Data Masking settings survive in the system database, but **nothing enforces them**: apps, AI tools and admins get real values again, and nothing warns you. Put the package in your image instead.
:::

### Put the package in your image

Install the package in a build step of your own image, following the instructions DreamFactory support sent with it, so that every container started from the image has it. If DreamFactory provides an image that already includes the package, use that as your base image instead.

```dockerfile
FROM <your DreamFactory Gold image>

# Install the df-masking package here, in the image build,
# following the instructions DreamFactory support sent with it.

# Mark the container unhealthy when Data Masking is missing.
# This replaces the base image's HEALTHCHECK, if it has one: keep its command in front of &&.
HEALTHCHECK --interval=5m --timeout=60s \
  CMD <base image health check> && php /opt/dreamfactory/artisan df:masking status > /dev/null || exit 1
```

A `HEALTHCHECK` in your Dockerfile replaces any in the base image, and some DreamFactory images have one (it checks that the web server answers). Read it with `docker image inspect --format '{{json .Config.Healthcheck}}' <image>` and keep its command in yours, as above. If the base image has none, drop `<base image health check> &&`.

`df:masking status` exits `1` when the package or its tables are missing, so it works as a container health check and as a deploy check. Because exit `0` does not mean masking is On, a deploy check for a production instance should also read the mode:

```bash
docker exec -u www-data <container> php /opt/dreamfactory/artisan df:masking status --json \
  | grep -q '"mode": "on"' \
  || { echo "Data Masking is missing or not On"; exit 1; }
```

When you move to a new DreamFactory image, rebuild your image on top of it so the package comes along, then run `php artisan df:masking setup` once (see [Upgrading](#upgrading)).

## Several DreamFactory nodes

All nodes must share one cache store, for example `CACHE_DRIVER=redis` or `CACHE_DRIVER=memcached`.

Data Masking caches its settings, table policies and mask formats for up to an hour, and the list of covered services for 10 minutes. Every entry is keyed by a policy version number that is kept in the cache. Every change made through the admin app, the API or `php artisan df:masking` bumps that number, so every node that reads the same cache sees the change on its next request. The locks that keep access changes and scan starts in order also live in the cache.

:::warning[Per-node caches serve stale masking]
With a per-node cache (`file` or `apc`), a change made through one node does not reach the others. In a test with two nodes on one system database, after masking was turned On through a node using Redis, the node using a `file` cache kept serving real values until `php artisan cache:clear` ran on it. Grant and role changes reach such a node within `DF_MASKING_ACCESS_CACHE_SECONDS` (30 seconds by default); other changes, such as the mode, admin access, column decisions and mask formats, can take up to an hour.
:::

After you move the nodes to a shared cache, run `php artisan cache:clear` once on each node.

Changes made **directly** in the system database (with SQL, outside the admin app, API and CLI) don't bump the version. Grants and role access pick them up within `DF_MASKING_ACCESS_CACHE_SECONDS` (30 seconds by default); everything else can take up to an hour, or until `php artisan cache:clear`. Make changes through the admin app, the API or the CLI.

## Upgrading

After you install a newer version of the package (as support provides it), run setup again:

```bash
php artisan df:masking setup
```

Setup runs only this package's pending migrations, never unrelated ones, and prints `Updating Data Masking tables...` when there are any. It then scans again. It is safe on a live instance: `--mode` only raises the mode, and admin decisions, rules and access settings stay as they are.

You can also run `php artisan migrate --force` (which runs every pending migration, not only this package's) followed by `php artisan df:masking scan`.

The package's migrations are:

| Migration | What it does |
|---|---|
| `2026_10_29_000001_create_dm_tables` | Creates eight tables: `dm_setting`, `dm_column`, `dm_mask_format`, `dm_rule`, `dm_admin_grant`, `dm_role_access`, `dm_activity` and `dm_scan` |
| `2026_10_29_000003_dm_exact_names_and_scan_failures` | Makes table and column names compare exactly (case and accents) on MySQL, MariaDB and SQL Server system databases, and records which services a scan could not read |
| `2026_10_29_000004_dm_scan_scope` | Records whether each scan was full or for one service. Additive. |
| `2026_10_29_000005_dm_scan_read_services` | Records which databases each scan read. Additive. |
| `2026_10_29_000100_create_dm_baseline_table` | Creates `dm_baseline` for Compliance baselines |

There is no `000002`. The upgrade migrations (`000003` to `000005`) are additive: they keep every stored decision, rule and setting.

## Turning masking off and removing the package

### Turn masking off

```bash
php artisan df:masking mode off
```

Or use the mode switch in **Security > Data Masking**. In mode Off the package is a no-op for apps: responses are byte-for-byte those of an instance without it, even with scan results stored. Two things still happen in Off: changes to Data Masking settings are recorded in the activity log, and an AI or MCP session that tries to change them still gets 403.

Lowering the mode from On, in the admin app or the API, needs the super admin. The command line always works and records the change as "Command line". To keep the activity records and the settings but stop masking for a while, `mode off` or `mode preview` is all you need.

### Remove the package

Removing the package stops all masking: apps, AI tools and admins get real values. Run these steps in order. The first one needs the package's migration files, so run it **before** you remove the package:

```bash
cd /opt/dreamfactory
php artisan migrate:reset --path=vendor/dreamfactory/df-masking/database/migrations --force
composer remove dreamfactory/df-masking
php artisan cache:clear
```

- `migrate:reset --path` rolls back only this package's five migrations. It drops the nine `dm_*` tables and removes the five rows from the `migrations` table. It lists DreamFactory's other migrations as "Migration not found" and leaves them alone.
- Use `composer remove` if the package was installed with Composer; otherwise remove it as support instructed. In Docker, also remove the install step from your Dockerfile and rebuild.
- Afterwards, **Security > Data Masking** and **Security > Compliance** show the upgrade page, on Gold too.

If you already removed the package, drop the nine tables and delete the five `migrations` rows by their exact names:

```sql
DROP TABLE dm_setting;
DROP TABLE dm_column;
DROP TABLE dm_mask_format;
DROP TABLE dm_rule;
DROP TABLE dm_admin_grant;
DROP TABLE dm_role_access;
DROP TABLE dm_activity;
DROP TABLE dm_scan;
DROP TABLE dm_baseline;

DELETE FROM migrations WHERE migration IN (
  '2026_10_29_000001_create_dm_tables',
  '2026_10_29_000003_dm_exact_names_and_scan_failures',
  '2026_10_29_000004_dm_scan_scope',
  '2026_10_29_000005_dm_scan_read_services',
  '2026_10_29_000100_create_dm_baseline_table'
);
```

Then run `php artisan cache:clear`.

- **Delete by exact name, never with `LIKE`.** The pattern `'%_dm_%'` also matches df-compliance's `2019_04_01_142947_add_is_root_admin_to_user`, because `_` matches any single character ("a**dm**i").
- **Leave no row behind.** A leftover row makes a later reinstall skip that migration.
- **A reinstall starts over.** The migrations drop the cached settings themselves, so a reinstall starts at mode Off, and mode On is refused until a scan of the new install finds columns. Run `cache:clear` anyway: until it runs, a node can keep a cached table policy.

## Configuration

Masking policy (mode, column decisions, access, formats, rules and baselines) lives in the system database and is managed in the admin app, the API or the CLI. The few settings below are environment variables, read by `config/df-masking.php`. Set them in DreamFactory's `.env` file or the container environment. If you cache the configuration (`php artisan config:cache`), cache it again after a change.

| Variable | Default | Meaning |
|---|---|---|
| `DF_MASKING_TOKEN_KEY` | Not set: a key is generated on first use and stored in the system database, encrypted with `APP_KEY` | The key for **Token** masks: base64 of exactly 32 bytes (a `base64:` prefix is accepted). An invalid value is ignored and logged as a warning. Set the same value on instances that must produce identical tokens, and to keep tokens stable across an `APP_KEY` rotation. |
| `DF_MASKING_ACTIVITY_RETENTION_DAYS` | `400` | Activity rows older than this are deleted. `0` keeps them forever. Pruning runs on about one in 200 activity writes, so rows can linger a little past the window. |
| `DF_MASKING_ACCESS_CACHE_SECONDS` | `30` (minimum 1) | Longest time an admin grant or role decision is cached. Changes through the admin app, API or CLI apply at once; this only bounds changes made directly in the database. |
| `DF_MASKING_RULE_TEST_BUDGET_MS` | `3000` (minimum 250) | Time budget for testing a value rule (the live preview in **Add rule**) |
| `DF_MASKING_RULE_BACKTRACK_LIMIT` | `100000` (`0` or less means 100000) | PCRE backtrack limit while custom rule patterns run. Protects against patterns that never finish. |
| `DF_MASKING_SCAN_TABLE_BUDGET_MS` | `20000` | Sampling time budget per table. Large or slow tables are partly sampled when it runs out. |
| `DF_MASKING_SCAN_STATEMENT_TIMEOUT_MS` | `10000` (minimum 1000) | Per-statement timeout while sampling. Enforced by the database on PostgreSQL (`statement_timeout`) and MySQL (`MAX_EXECUTION_TIME`) only; elsewhere the table budget is checked between statements. |
| `DF_MASKING_SCAN_STALE_MINUTES` | `5` (minimum 1) | A scan that has sent no heartbeat for this long is reported as failed. |
| `DF_MASKING_PHP_BINARY` | Not set | The PHP command-line binary used to run background scans. See below. |

The Compliance checks also read `APP_URL`, `APP_DEBUG`, `DF_JWT_TTL`, `DF_JWT_REFRESH_TTL`, `DF_ALLOW_FOREVER_SESSIONS` and `LOGSDB_ENABLED`. See [Compliance baselines](../compliance-baselines.md).

### Background scans and the PHP binary

Most scans run in a separate process (`php artisan df:masking scan`), so the request that asked for them returns at once. That covers scans started from the admin app or the API, and the scans that a new or changed database service, a value rule or a baseline starts. Only `setup` and a `df:masking scan` you run yourself scan in the foreground. One scan runs at a time: a scan that a database service change or a value rule requests while another runs starts when that one ends. A manual scan does not queue: `POST /scan` returns the scan already running, and `df:masking scan` stops with `A scan is already running. Check progress with: php artisan df:masking status`.

To start that process, Data Masking looks for a PHP command-line binary in this order:

1. `DF_MASKING_PHP_BINARY`, if it is set and executable.
2. The PHP binary of the current process, but only when it runs on the command line, never under PHP-FPM.
3. A PHP binary found on the system path, skipping anything named `fpm`.
4. `/usr/bin/php`, then `/usr/local/bin/php`.

If no binary is found, or `proc_open` is disabled in `php.ini`, **the scan runs inside the HTTP request** that started it. That request then blocks until the scan ends and can time out on large databases. Set `DF_MASKING_PHP_BINARY` to your CLI PHP path and allow `proc_open` to avoid it.

## System databases

The `dm_*` tables were verified for this release on these DreamFactory system databases: MySQL 5.7, PostgreSQL 16, SQL Server 2022 and SQLite. Install, scans, column decisions, access and mode changes, and enforcement were tested on each. MariaDB uses the MySQL code path but was not tested separately.

The tables hold no raw data values. They store column names, verdicts, evidence text (such as `205 of 256 values are formatted phone numbers`), already-masked examples, settings, the encrypted token key, and activity sentences. Table and column names longer than 255 characters are skipped by scans.

## What scans do to your databases

Scans only read, with each database service's own connection and credentials, so that account needs `SELECT` on the tables.

- **Sampling.** Up to 128 rows from the start and 128 from the end of each table, by key. Sampled values stay in memory and are never stored or logged.
- **Read-only.** On PostgreSQL, MySQL, MariaDB and SQL Server, each read runs in a transaction that is always rolled back. Other SQL databases get plain `SELECT` statements within the per-table time budget.
- **Warehouses that bill per query** (Snowflake, Databricks, Trino, Dremio, BigQuery) are classified from column names only, to avoid query costs. Sampling them is opt-in: `php artisan df:masking scan --sample`, or `"sample": true` on `POST /api/v2/system/data_masking/scan`.
- **Unreadable data doesn't stop a scan.** A database that can't be reached is reported with a value-free reason, such as `Could not connect (SQLSTATE HY000)`, and the scan finishes for the others. Columns whose values can't be read go to at least **To review**.

[Scans](./review-columns.md#scans) in Review columns has the details: how each database is read, timeouts, failure reasons and automatic scans.

## Performance

Measured for this release on a development stack (DreamFactory 7.7.1, MySQL 5.7 system database, Redis cache, shared host): an app reading 100 rows from a MySQL table (`?limit=100`) with 11 of 16 columns masked, p50 of 100 requests per mode, client wall time.

| Mode | Added time per request (five runs) |
|---|---|
| On | 5.1 to 10.8 ms (median 8.7 ms) |
| Preview | 0.8 to 5.0 ms |

- Runs on the same host vary by several milliseconds.
- Part of the On cost is the larger body: tokens are longer than most values (59.6 KB instead of 41.5 KB in this test).
- The test used a development install, which keeps the package out of Composer's optimized class map. A production install costs slightly less.
- Requests to non-database services, and every request while the mode is Off, make no Data Masking database queries.
- Scanning a 50-column MySQL database takes about a second.

## Backup, restore and moving instances

- **Back up the system database.** It holds every masking decision, rule, grant and setting, and the activity log. The ISO 27001 baseline's manual check "Backups taken and restores tested" asks for exactly this.
- **Package export does not carry masking.** DreamFactory's package export (`system/package`) does not include Data Masking or Compliance settings. On a new instance, scan, then re-apply your decisions and settings, or apply the same baseline. Exporting table data from a masked table while masking is On needs real-value access; see [What changes for apps](./app-behavior.md).
- **Tokens depend on the token key.** If you restore the system database on an instance with a different `APP_KEY`, the stored token key can't be decrypted. A new key is generated (with a warning in the log), and every **Token** value changes. Set the same `DF_MASKING_TOKEN_KEY` on both instances to keep tokens identical.

## Related

- [Data Masking](./overview.md) — what it does and how the modes work
- [Get started: mask your first database](./get-started.md) — the first scan, review and turning masking On in the admin app
- [API and CLI reference](./api-and-cli.md) — every endpoint and every `df:masking` command
- [Who sees real values](./access.md) — admins, roles, AI sessions and the super admin
- [Troubleshooting and limits](./troubleshooting.md) — symptoms, causes and fixes
- [Compliance baselines](../compliance-baselines.md) — presets, checks and evidence exports
