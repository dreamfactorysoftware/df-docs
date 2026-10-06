---
sidebar_position: 1.5
title: Upgrading a Docker Deployment to 7.7.x
id: upgrading-docker-to-7-7
description: What changed in the df-docker stack between DreamFactory 7.6 and 7.7.1, what to change in an existing 7.6 docker-compose setup, and a tested step-by-step upgrade for open source and commercial images.
keywords: [DreamFactory Docker upgrade, df-docker, docker-compose, DreamFactory 7.7, APP_KEY, DF_LICENSE_KEY, Laravel 13]
---

# Upgrading a Docker Deployment to 7.7.x

This page is for instances built from the [df-docker](https://github.com/dreamfactorysoftware/df-docker) repository with `docker compose`. It lists what changed in the stack between DreamFactory 7.6 and 7.7.1, what you need to change in an existing 7.6 `docker-compose.yml` and `Dockerfile`, and a step-by-step upgrade.

Every step was validated by building a 7.6.0 Gold (commercial) stack from df-docker `7.6.0` with the stock `docker-compose.yml` (MySQL 5.7, Redis), adding data, then upgrading it in place to 7.7.1 on the same volumes.

For the non-Docker (Linux/VM) procedure and the general 7.7 release notes, see [Upgrading and Migrating DreamFactory](/upgrades-and-migrations/upgrading-and-migrating-dreamfactory#upgrading-to-77x).

## What changed between the 7.6 and 7.7.1 stacks

| Area | 7.6 stack | 7.7.1 stack | Action needed |
|---|---|---|---|
| Base image | `df-base-img:7.6` — Ubuntu 24.04, PHP 8.5.6 | `df-base-img:7.7` — Ubuntu 24.04, PHP 8.5.11, multi-arch (amd64 + arm64) | None. Same PHP extensions, Node.js 20 and Composer 2. |
| DreamFactory | 7.6.0 on Laravel 11 | 7.7.1 on Laravel 13 | Run migrations after the upgrade — the container does not do it for you. |
| Commercial composer files | 7.6.x set | 7.7.1 set (adds Agents, Alerts, Schema Contracts, API Builder, System API MCP) | Replace them. The build succeeds with the old files but produces a broken install. |
| `ADMIN_PASSWORD` | Not checked by the entrypoint | Container exits on start if it is set and shorter than 16 characters | Use a 16+ character value, or remove the `ADMIN_*` variables once the admin exists. |
| `DF_LICENSE_KEY` environment variable | Written to `.env` only if a placeholder existed | Always written to `.env` | None — the variable now works as documented. |
| System API MCP daemon | Not present | New `ENABLE_SYSTEM_MCP_DAEMON` variable; dependencies installed at build time | Add `ENABLE_SYSTEM_MCP_DAEMON: "true"` if you want the `system_mcp` service type. |
| `HTTPS_HEADER` | Existing variable, undocumented | Documented in `docker-compose.yml` | Set `HTTPS_HEADER: "on"` if TLS terminates at a proxy or load balancer in front of the container. See [Running behind HTTPS](#running-behind-https-or-on-a-non-standard-port). |
| MCP daemon callback address | Request origin | Request origin | Set `MCP_INTERNAL_BASE_URL` in `.env` behind a proxy or on a non-80 port mapping, or MCP tool calls fail with `fetch failed`. See [Running behind HTTPS](#running-behind-https-or-on-a-non-standard-port). |
| `mysql:5.7` service | No platform set | `platform: linux/amd64` | Only matters on ARM hosts (Apple Silicon, Graviton). |

:::note[df-docker tags]
In the df-docker repository the `7.6.0` and `7.7.0` tags point at the same commit, and the `Dockerfile` clones DreamFactory from `master` unless you pass a `BRANCH` build argument. **Checking out a df-docker tag does not pin the DreamFactory version** — building any df-docker tag today installs the latest DreamFactory release. Always pass `--build-arg BRANCH=<version>` (see [Step 5](#step-5-build-the-new-image)).
:::

## Environment variables reach PHP only through `.env`

PHP-FPM inside the `web` container does not inherit the container environment (`clear_env` is left at its default), so web requests read their settings **only from `/opt/dreamfactory/.env`**. A variable in the `environment:` block of `docker-compose.yml` affects DreamFactory only if `docker-entrypoint.sh` copies it into `.env` on start. In 7.7.1 the entrypoint copies `DB_DRIVER` and the `DB_*` connection settings, `APP_KEY`, `DF_LICENSE_KEY`, `DF_REGISTER_CONTACT`, `CACHE_HOST`, `CACHE_PORT`, `CACHE_DATABASE`, `CACHE_USERNAME`, `CACHE_PASSWORD`, `CACHE_WEIGHT`, `CACHE_PERSISTENT_ID`, `SESSION_DRIVER`, `REDIS_HOST`, `REDIS_PORT`, `JWT_TTL`, `JWT_REFRESH_TTL`, `ALLOW_FOREVER_SESSIONS`, `APP_LOG_LEVEL`, `EXTERNAL_IP`, the `LOGSDB_*` settings and `SENDMAIL_DEFAULT_COMMAND`. `SERVERNAME` and `HTTPS_HEADER` are applied to the nginx configuration instead, and `SSMTP_*` to the mail configuration.

Anything else — for example `CACHE_STORE`, `APP_URL` or `MCP_INTERNAL_BASE_URL` — is silently ignored by web requests when set in `docker-compose.yml`, even though `docker compose exec web php artisan ...` sees it (the CLI does inherit the container environment), which makes it look correct when you check.

`.env` lives in the image, not in a volume, so editing it inside a running container is lost the next time the container is recreated. To set such a variable durably, write it into `.env` at build time with a line in the `Dockerfile`, placed before `COPY docker-entrypoint.sh`:

```dockerfile
RUN echo "MCP_INTERNAL_BASE_URL=http://127.0.0.1" >> /opt/dreamfactory/.env
```

## Check your 7.6 configuration first

Before upgrading, go through your existing `docker-compose.yml` and `Dockerfile` with this list. Each item was a silent failure in testing.

### `APP_KEY` must be pinned in `docker-compose.yml`

The stock `docker-compose.yml` leaves `APP_KEY` commented out. The container then generates a key on first start and stores it in `.env` inside the container — not in a volume. Rebuilding the image or recreating the container generates a **new** key.

Because DreamFactory caches decrypted service configuration in the `df-storage` volume, everything appears to work right after the upgrade. Once the cache expires (5 hours by default) or is cleared, every service with stored credentials fails with `The MAC is invalid.` If the old container has already been removed, the original key cannot be recovered.

Copy the key out of the **running 7.6 container** before you rebuild anything:

```bash
docker compose exec web grep '^APP_KEY=' .env
```

Then set it on the `web` service, in single quotes:

```yaml
web:
  environment:
    APP_KEY: 'base64:your-existing-key='
```

See [Persisting system database configs](/getting-started/installing-dreamfactory/docker-installation#persisting-system-database-configs) for more detail.

### Commercial images: composer files and the `COPY` line

Commercial images get their packages from `composer.json`, `composer.json-dist` and `composer.lock` placed in the `df-docker` directory. They are only used if this line in the `Dockerfile` is uncommented:

```dockerfile
COPY composer.* /opt/dreamfactory/
```

When you move to 7.7.1, replace all three files with the **7.7.1** set from DreamFactory support. If you rebuild with your 7.6 files still in place, the build succeeds, the instance reports version 7.7.1, but it is actually running the 7.6 packages on Laravel 11 under a 7.7.1 application skeleton. None of the 7.7 features or database migrations are present, and the only hint in the logs is:

```
Warning: ENABLE_SYSTEM_MCP_DAEMON is set but df-system-mcp-server package not found
```

If you set the license key with the `sed` line in the `Dockerfile` (`#DF_REGISTER_CONTACT=` → `DF_LICENSE_KEY=...`), it still works in 7.7.1, but the key ends up in the image layers and in the build output. Setting `DF_LICENSE_KEY` on the `web` service in `docker-compose.yml` is the better option in 7.7.1: the entrypoint writes it into `.env` on every start, and the key stays out of the image.

### `ADMIN_PASSWORD` must be at least 16 characters

If your `docker-compose.yml` sets `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `ADMIN_PHONE` to create the first admin, the 7.7.1 entrypoint checks `ADMIN_PASSWORD` on **every** start, even when the admin already exists. A shorter value stops the container:

```
ERROR: ADMIN_PASSWORD must be at least 16 characters.
```

The container exits with code 1, and the stock `docker-compose.yml` has no restart policy, so it stays down. DreamFactory 7.6 already required 16-character admin passwords, so this only affects stacks where the variable was never actually used to create the admin (for example, the admin was created in the UI). Either set a 16+ character value or remove the `ADMIN_*` variables once the admin account exists.

### Use `CACHE_STORE`, not `CACHE_DRIVER`

The stock `docker-compose.yml` sets `CACHE_DRIVER: redis`, but Laravel 11 and later read `CACHE_STORE`, and the entrypoint's `CACHE_DRIVER` handling no longer matches anything in `.env`. As a result, the stock 7.6 stack uses the **file** cache, not Redis.

This keeps working in 7.7.1, because `.env` in the image has `CACHE_STORE=file`. Setting `CACHE_STORE: redis` in `docker-compose.yml` does **not** switch web requests to Redis (see [Environment variables reach PHP only through `.env`](#environment-variables-reach-php-only-through-env)). To use Redis, keep the `CACHE_HOST`, `CACHE_PORT` and `CACHE_DATABASE` settings in `docker-compose.yml` (the entrypoint copies those into `.env`) and set the store in the `Dockerfile`, before `COPY docker-entrypoint.sh`:

```dockerfile
RUN sed -i "s/^CACHE_STORE=.*/CACHE_STORE=redis/" /opt/dreamfactory/.env
```

You can confirm it is in use: `docker compose exec redis redis-cli -n 0 dbsize` grows as you use DreamFactory, and `storage/framework/cache/data` in the `web` container stays empty.

Do not leave the cache store unset in a custom `.env`: from 7.7.0 Laravel falls back to the `database` store, and the DreamFactory system database has no `cache` table, so every request fails with `Table 'dreamfactory.cache' doesn't exist`.

## Running behind HTTPS or on a non-standard port

The container serves plain HTTP on port 80. If TLS is terminated in front of it — a reverse proxy, load balancer, ingress or CDN — or if you publish it on a port other than 80, three settings decide whether URLs and the MCP server work. These apply to 7.6 as well; check them while you are upgrading.

### `HTTPS_HEADER: "on"` behind TLS

Without it, DreamFactory sees every request as `http://` and generates `http://` absolute URLs. In testing behind a TLS proxy, the MCP OAuth metadata (`issuer`, `authorization_endpoint`, `token_endpoint`) and the OAuth `authorize` redirect to the login page all came out as `http://`, which breaks MCP client sign-in. With `HTTPS_HEADER: "on"` they are `https://`.

```yaml
web:
  environment:
    HTTPS_HEADER: "on"
```

Keep the quotes, as the stock `docker-compose.yml` does — some YAML parsers read a bare `on` as a boolean.

### `MCP_INTERNAL_BASE_URL=http://127.0.0.1` in `.env`

The MCP daemons run inside the `web` container and call DreamFactory's API back for every tool call. Unless `MCP_INTERNAL_BASE_URL` is set, they call it at the **origin of the incoming request**: the public `https://` host name behind a proxy, or `http://host:8080` when port 8080 is mapped to the container's port 80. From inside the container that address usually does not resolve, is not listening, or has a certificate the daemon does not trust, and every MCP tool call fails with:

```
Error during <tool>: fetch failed
```

`initialize` and `tools/list` still succeed, so MCP clients connect and list tools normally — only tool calls fail. Point the daemons at the container itself. This must be in `.env` (setting it in `docker-compose.yml` has no effect), so add it in the `Dockerfile` before `COPY docker-entrypoint.sh`:

```dockerfile
RUN echo "MCP_INTERNAL_BASE_URL=http://127.0.0.1" >> /opt/dreamfactory/.env
```

The stock setup — no proxy, published as `80:80` and browsed at `http://localhost` — works without it.

### `APP_URL`

Leave `APP_URL` unset unless you need it. MCP OAuth uses `APP_URL` in preference to the request when it is set, so an `http://` value on an `https://` site breaks the OAuth redirects even with `HTTPS_HEADER: "on"`. If you do set it, use the full public `https://` URL, and set it in `.env` via the `Dockerfile` — like `MCP_INTERNAL_BASE_URL`, setting it in `docker-compose.yml` has no effect on web requests.

Publish TLS on port 443. DreamFactory builds URLs from the host name only, so a public port such as `https://dreamfactory.example.com:8443` is dropped from generated URLs.

## Upgrade procedure

These steps assume you are in your `df-docker` directory and use the stock service names (`web`, `mysql`). If you use a custom Compose project name or service names, adjust the commands.

### Step 1: Back up

Save the `APP_KEY` as described [above](#app_key-must-be-pinned-in-docker-composeyml), and keep a copy of your current `docker-compose.yml`, `Dockerfile` and composer files.

Back up the system database while the 7.6 stack is running (the stock MySQL root password is `root`):

```bash
docker compose exec -T mysql mysqldump -uroot -proot dreamfactory > dreamfactory-7.6-backup.sql
```

Back up the `df-storage` volume, which holds file services, the SQLite `db` service, logs and cache. Find its name with `docker volume ls` (it is `<project>_df-storage`, where the project is usually the directory name, e.g. `df-docker`):

```bash
docker run --rm -v df-docker_df-storage:/data -v "$PWD":/backup alpine \
  tar czf /backup/df-storage-7.6-backup.tgz -C /data .
```

### Step 2: Update the df-docker files

Update your clone and check out the 7.7.1 tag. If you have edited `Dockerfile` or `docker-compose.yml` in place, stash or copy your changes first:

```bash
git stash
git fetch --tags
git checkout 7.7.1
```

### Step 3: Re-apply your settings

Compare your saved `docker-compose.yml` and `Dockerfile` with the 7.7.1 versions and carry your settings across: ports, database credentials, `SERVERNAME`, mail settings and so on. Make sure that:

- `APP_KEY` is set to your existing key.
- `ADMIN_PASSWORD`, if set, is at least 16 characters.
- The `Dockerfile` sets `CACHE_STORE=redis` in `.env` if you want Redis (see [above](#use-cache_store-not-cache_driver)).
- `ENABLE_SYSTEM_MCP_DAEMON: "true"` is added if you want the System API MCP service type.
- `HTTPS_HEADER: "on"` is set if TLS terminates in front of the container, and `MCP_INTERNAL_BASE_URL` is written into `.env` by the `Dockerfile` if you run behind a proxy or on a port other than 80 (see [Running behind HTTPS](#running-behind-https-or-on-a-non-standard-port)).
- `DF_LICENSE_KEY` is set on the `web` service (commercial images).

### Step 4: Commercial images — install the 7.7.1 composer files

Copy the 7.7.1 `composer.json`, `composer.json-dist` and `composer.lock` into the `df-docker` directory, overwriting the old ones, and uncomment the `COPY composer.* /opt/dreamfactory/` line in the 7.7.1 `Dockerfile`. If you set the license key in the `Dockerfile`, re-apply that line too.

### Step 5: Build the new image

Build the `web` image, pinning the DreamFactory version:

```bash
docker compose build --build-arg BRANCH=7.7.1 web
```

### Step 6: Recreate the web container

```bash
docker compose up -d web
```

Only the `web` container is replaced. The `mysql` container and the `df-mysql` and `df-storage` volumes are reused.

During startup you will see `MySQL not ready yet... waiting` about 30 times before the container continues. That is expected: the image has no MySQL client, so the readiness check always times out, and it adds about 30 seconds to each start.

### Step 7: Run the database migrations

The container runs migrations only when it creates the first admin user. On an existing instance you must run them yourself; until you do, many API calls fail with errors such as `Table 'dreamfactory.schema_contract_service' doesn't exist`. In testing, a 7.6.0 Gold instance had 29 pending migrations.

```bash
docker compose exec web php artisan migrate --seed --force
docker compose exec web php artisan optimize:clear
```

Confirm nothing is pending:

```bash
docker compose exec web php artisan migrate:status | grep -c Pending
```

The result should be `0`.

## Verification

Check the DreamFactory and Laravel versions. Laravel must be 13.x — if it still reports 11.x, the 7.6 composer files were used ([Step 4](#step-4-commercial-images--install-the-771-composer-files)):

```bash
docker compose exec web grep "'version'" config/app.php
docker compose exec web php artisan --version
```

Then, in the admin UI:

1. **System > Config > System Info** shows version 7.7.1 and the same license level as before (for example `GOLD`).
2. Services with stored credentials still connect. Run `docker compose exec web php artisan cache:clear` first, so you are testing the stored configuration rather than a cached copy — this is what exposes a changed `APP_KEY`.
3. `docker compose logs web` shows no errors, and `docker compose exec web tail storage/logs/dreamfactory.log` has no new `ERROR` lines.

## Troubleshooting

### `The MAC is invalid.`

`APP_KEY` changed during the rebuild. Set the original key in `docker-compose.yml` and recreate the container (`docker compose up -d web`). If the original key is lost, stored service credentials have to be re-entered.

### Version shows 7.7.1 but Laravel is 11.x, or 7.7 features are missing

The 7.6 composer files were built into the image. Install the 7.7.1 files ([Step 4](#step-4-commercial-images--install-the-771-composer-files)), rebuild, recreate the container and run the migrations.

### `SQLSTATE[42S02]: Base table or view not found`

The database migrations have not been run. See [Step 7](#step-7-run-the-database-migrations). If the missing table is `cache`, set `CACHE_STORE` instead (see [above](#use-cache_store-not-cache_driver)).

### The web container exits immediately

Check `docker compose logs web`. If it ends with `ERROR: ADMIN_PASSWORD must be at least 16 characters.`, lengthen or remove `ADMIN_PASSWORD` ([details](#admin_password-must-be-at-least-16-characters)).

### `system_mcp` services return 503

The System API MCP daemon is not running. Add `ENABLE_SYSTEM_MCP_DAEMON: "true"` to the `web` service and recreate the container. The log should show `[df-system-mcp] listening on http://127.0.0.1:3700`.

### MCP tool calls fail with `fetch failed`

The MCP daemon cannot reach DreamFactory at the request's origin. Write `MCP_INTERNAL_BASE_URL=http://127.0.0.1` into `.env` from the `Dockerfile`, rebuild and recreate the container (see [Running behind HTTPS](#mcp_internal_base_urlhttp127001-in-env)).

### MCP clients cannot sign in, or OAuth URLs start with `http://`

Set `HTTPS_HEADER: "on"` when TLS terminates in front of the container, and make sure `APP_URL` is either unset or the public `https://` URL (see [Running behind HTTPS](#running-behind-https-or-on-a-non-standard-port)). You can check what DreamFactory advertises with:

```bash
curl -s https://<your-host>/.well-known/oauth-authorization-server/mcp/<mcp-service-name>
```

### A setting in `docker-compose.yml` has no effect

PHP-FPM only reads `.env`. See [Environment variables reach PHP only through `.env`](#environment-variables-reach-php-only-through-env).

## Rolling back

Check out your previous df-docker revision and composer files, rebuild with the old version, and restore the database backup into an **empty** database. The 7.7 migrations add tables that a 7.6 backup does not drop; if they are left behind, a later upgrade fails on `table already exists`.

```bash
docker compose build --build-arg BRANCH=7.6.0 web
docker compose exec -T mysql mysql -uroot -proot -e "DROP DATABASE dreamfactory; CREATE DATABASE dreamfactory;"
docker compose exec -T mysql mysql -uroot -proot dreamfactory < dreamfactory-7.6-backup.sql
docker compose up -d web
docker compose exec web php artisan cache:clear
```

Keep the same `APP_KEY` throughout.
