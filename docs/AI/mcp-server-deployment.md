---
sidebar_position: 8
title: Deploying the MCP Server
id: mcp-server-deployment
description: Install, daemonize, verify, and configure the DreamFactory MCP server and its Node.js daemons, including the shared secret, the System API MCP daemon (7.7.1), PHP-FPM sizing, and running behind a reverse proxy or load balancer.
keywords: [MCP, Model Context Protocol, daemon, systemd, reverse proxy, load balancer, deployment, OAuth, 7.7.1, system MCP, internal key]
difficulty: advanced
---

# Deploying the MCP Server

This guide covers installing and operating the MCP server on your DreamFactory host: the Node.js daemons, the shared secret, configuration, verification, and running behind a reverse proxy.

- To create an MCP service in the admin interface, see [Creating an MCP Server Service](./mcp-service-creation.md).
- For the available tools, request format, and required headers, see [MCP Server](./mcp-service.md).

:::info Which version is this page about?
MCP deployment changed between 7.7.0 and 7.7.1. Each DreamFactory release ships a specific version of the `dreamfactory/df-mcp-server` package, and that package version decides which steps apply:

| DreamFactory | `df-mcp-server` | Also ships |
|---|---|---|
| 7.7.0 | 1.3.0 | — |
| 7.7.1 | 1.4.0 | `dreamfactory/df-system-mcp-server` (the System API MCP daemon) |

Check what you have with `composer show dreamfactory/df-mcp-server | grep versions`.

Throughout this page, a heading or table row marked **7.7.1+** applies only to 7.7.1 and later. A block marked **7.7.0** applies only to 7.7.0. Everything unmarked applies to both. The [What changed in 7.7.1](#what-changed-in-771) table lists every difference in one place.
:::

## Overview

The MCP server runs in two or three parts on your DreamFactory host:

- **PHP routes** served by DreamFactory at `/mcp/{service}`. Clients connect here, over HTTPS, and never to a daemon directly.
- **The data daemon** (`vendor/dreamfactory/df-mcp-server/daemon/`, listening on `127.0.0.1:8006`). It speaks the MCP protocol and serves every `mcp` service. The PHP side forwards to it.
- **7.7.1+: the System API MCP daemon** (`vendor/dreamfactory/df-system-mcp-server/`, listening on `127.0.0.1:3700`). It serves `system_mcp` services, which expose DreamFactory's own System API as tools. Only needed if you create a service of that type.

Both daemons execute tools by calling DreamFactory's REST API back, so each one needs a route back into DreamFactory (see [Daemon callback URL](#daemon-callback-url-mcp_internal_base_url)) and, on 7.7.1, a [shared secret](#the-daemon-shared-secret-771) so that only DreamFactory can drive them.

## What changed in 7.7.1

| Area | 7.7.0 (`df-mcp-server` 1.3.0) | 7.7.1 (`df-mcp-server` 1.4.0) |
|---|---|---|
| Daemon dependency install | No lockfile ships. `npm install` resolves whatever is current, so two hosts installed on different days can get different versions. | `daemon/package-lock.json` ships. Use `npm ci --omit=dev` for identical installs everywhere. |
| Compiled daemon | `daemon/dist/` ships; no build step. | Same. |
| Session mode | Stateful by default. Multi-node deployments **must** set `MCP_STATELESS=true` on the daemon. | Stateless by default. Nothing to set for multi-node. |
| Daemon shared secret | Optional. Enforced only when `MCP_INTERNAL_KEY` is set on both sides. | **Always required.** DreamFactory generates one into `storage/framework/mcp_internal_key`; the daemon reads it. Rejects every call without it. |
| Install health check | None. Probe `http://127.0.0.1:8006/health` by hand. | `GET /_internal/ai/mcp-health` (admin), plus a status chip in the admin UI. |
| System API MCP daemon | Not available. | New `system_mcp` service type backed by `df-system-mcp-server` on port 3700, with its own launcher. |
| Proxy timeout | Fixed. | `MCP_DAEMON_TIMEOUT` (default 300 s); a slow call returns `504` instead of pinning a PHP worker. |
| Service settings | — | [Exposed Services](./mcp-exposed-services.md), [API key authentication](./mcp-api-key-auth.md), Require Role Access, Database Tool Style, Allow writes, Lazy Tool Loading. |
| Function custom tools | — | Off unless the daemon runs with `MCP_ALLOW_FUNCTION_TOOLS=true`. |

## Prerequisites

A working DreamFactory installation, plus the following **on the server**:

- **Node.js 20 or newer, and npm.** The MCP SDK the daemon uses needs the global Web Crypto API, which Node 18 lacks. On Node 18 the daemon exits at startup with `ReferenceError: crypto is not defined`. On Ubuntu:

  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  node -v && npm -v
  ```

- The `dreamfactory/df-mcp-server` package (included in the commercial composer set).
- **7.7.1+:** the `dreamfactory/df-system-mcp-server` package, installed alongside it by the same composer set. Only needed for `system_mcp` services.

Confirm the packages and routes are present:

```bash
ls vendor/dreamfactory/df-mcp-server
ls vendor/dreamfactory/df-system-mcp-server    # 7.7.1+
php artisan route:list | grep '/mcp/'
```

## Installing the data daemon

The compiled daemon (`daemon/dist/server.js`) ships inside the package on both versions. There is no build step; you only install its runtime dependencies.

### 7.7.1+ (df-mcp-server 1.4.0)

```bash
cd vendor/dreamfactory/df-mcp-server/daemon
npm ci --omit=dev
```

`npm ci` installs exactly the versions in the shipped `package-lock.json`, so every host and every reinstall gets the same daemon. `--omit=dev` leaves out TypeScript and `tsx`, which the compiled daemon does not need.

### 7.7.0 (df-mcp-server 1.3.0)

```bash
cd vendor/dreamfactory/df-mcp-server/daemon
npm install --omit=dev
```

:::caution 7.7.0 has no lockfile
`df-mcp-server` 1.3.0 ships no `package-lock.json`, so `npm install` resolves the newest versions allowed by `package.json` at the moment you run it. Two hosts installed on different days (or a production host reinstalled after an upgrade) can end up on different MCP SDK versions, and newer SDK releases require Node 20. If you run more than one node, install on all of them in the same session, or upgrade to 7.7.1 where the lockfile makes installs reproducible.
:::

### Reinstall after every `composer update`

Composer replaces the whole package directory when it updates `dreamfactory/df-mcp-server`, which deletes `daemon/node_modules`. The shipped `dist/` comes back, the dependencies do not, so the daemon fails at startup with `ERR_MODULE_NOT_FOUND` (typically naming `express`) and, under systemd with `Restart=always`, loops. Run the install step above again after any upgrade, then restart the daemon.

### Starting the daemon

Always start it through the shipped launcher:

```bash
vendor/dreamfactory/df-mcp-server/scripts/start-daemon.sh
```

The launcher runs the compiled `node dist/server.js`, sets production defaults, and on 7.7.1 resolves the [shared secret](#the-daemon-shared-secret-771). Do not use `npm start` or `npm run dev` in production: both run the TypeScript source through `tsx`, a dev dependency that `--omit=dev` leaves out.

:::note 7.7.0 with more than one DreamFactory node
On 7.7.0 the daemon is stateful by default and keeps each MCP session in memory, so behind a load balancer requests round-robin onto a node that has never seen the session and fail with `Bad Request: Server not initialized`. Set `MCP_STATELESS=true` in the daemon's environment (for example in the systemd unit below) on every node. On 7.7.1 stateless is the default and nothing needs to be set.
:::

### Daemonizing for production

No systemd unit ships by default. Add one so the daemon starts on boot and restarts on crash, at `/etc/systemd/system/df-mcp-daemon.service`:

```ini
[Unit]
Description=DreamFactory MCP Daemon
After=network.target

[Service]
Type=simple
User=www-data
ExecStart=/opt/dreamfactory/vendor/dreamfactory/df-mcp-server/scripts/start-daemon.sh
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production
# 7.7.0 only, multi-node deployments: Environment=MCP_STATELESS=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now df-mcp-daemon
sudo systemctl status df-mcp-daemon
```

:::tip Run the daemon as the web-server user
`User=www-data` is not cosmetic. On 7.7.1 the daemon must read the shared-secret file that PHP-FPM writes to `storage/framework/mcp_internal_key` (mode 0600), and on both versions a first run with missing `node_modules` writes into the package directory. Use whatever user PHP-FPM runs as on your distribution. If the daemon runs as a user that cannot read that file, every MCP call is rejected with `403 Forbidden: invalid internal key`.
:::

### Viewing the daemon logs

Because the unit sends output to the journal (`StandardOutput=journal`), read the daemon's logs with `journalctl`:

```bash
sudo journalctl -u df-mcp-daemon -f             # follow live
sudo journalctl -u df-mcp-daemon -n 100         # last 100 lines
sudo journalctl -u df-mcp-daemon --since "15 min ago"
```

:::note
In the Docker/compose stack, the daemon starts automatically when `ENABLE_MCP_DAEMON` is set, so no systemd unit is needed.
:::

### Windows

The package ships `scripts\start-daemon-win.ps1`. On both 7.7.0 and 7.7.1 it runs a full `npm install` (including dev dependencies) and starts the daemon from the TypeScript source with `npx tsx src\server.ts`, in the background. That works, but it needs network access for the install and keeps `tsx` on the host. To run the compiled daemon instead, mirror the Linux launcher by hand:

```powershell
cd C:\dreamfactory\vendor\dreamfactory\df-mcp-server\daemon
npm ci --omit=dev          # 7.7.0: npm install --omit=dev
$env:MCP_DAEMON_HOST = "127.0.0.1"
$env:MCP_DAEMON_PORT = "8006"
$env:NODE_ENV = "production"
$env:MCP_INTERNAL_KEY_FILE = "C:\dreamfactory\storage\framework\mcp_internal_key"   # 7.7.1+
node dist\server.js
```

Wrap that in a Windows service (NSSM or `sc.exe`) or a Task Scheduler "at startup" task, running as the IIS application pool identity so it can read the shared-secret file. Start order does not matter: the daemon reads the key file lazily on the first call, so it may boot before DreamFactory has created the file.

## Installing the System API MCP daemon (7.7.1+)

The `system_mcp` service type ("System API MCP Server") lets an AI client administer the instance through DreamFactory's System API. It is served by a second daemon, `df-system-mcp-server`, which Composer installs as a sibling package at `vendor/dreamfactory/df-system-mcp-server`. Until that daemon runs, every request to a `system_mcp` service returns `503` with setup instructions. Nothing else depends on it, so skip this section if you do not use that service type.

Start it with the launcher that ships in `df-mcp-server`:

```bash
vendor/dreamfactory/df-mcp-server/scripts/start-system-daemon.sh
```

What the launcher does:

- Finds the package at `vendor/dreamfactory/df-system-mcp-server` (override with `DF_SYSTEM_MCP_DIR`).
- **Builds it on first run.** The Composer package does not include a compiled `build/` directory, so the launcher runs `npm install` and `npm run build` once. This needs network access and takes a minute. After a `composer update` replaces the package, the next start rebuilds the same way.
- Listens on `127.0.0.1:3700`, which matches DreamFactory's default `MCP_SYSTEM_DAEMON_URL`, so **no `.env` change is needed** when it runs on the DreamFactory host.
- Calls DreamFactory back on `MCP_INTERNAL_BASE_URL`, or `http://127.0.0.1` when that is unset.
- Passes the daemon only its own settings (`MCP_SYSTEM_DAEMON_HOST`, `MCP_SYSTEM_DAEMON_PORT`, `DREAMFACTORY_URL`, `MCP_INTERNAL_KEY`, `SESSION_TTL_SECONDS`), not the rest of DreamFactory's environment.

Give it its own systemd unit next to the data daemon's, at `/etc/systemd/system/df-system-mcp-daemon.service`:

```ini
[Unit]
Description=DreamFactory System API MCP Daemon
After=network.target

[Service]
Type=simple
User=www-data
ExecStart=/opt/dreamfactory/vendor/dreamfactory/df-mcp-server/scripts/start-system-daemon.sh
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now df-system-mcp-daemon
sudo journalctl -u df-system-mcp-daemon -n 50
```

Because this daemon listens on loopback, it accepts DreamFactory's callbacks without `MCP_INTERNAL_KEY`. If you run it elsewhere, see [Sidecar container](#system-api-mcp-daemon-as-a-sidecar-container-771) below.

On Windows, `scripts\start-system-daemon-win.ps1` does the equivalent.

## The daemon shared secret (7.7.1+)

Every `/mcp` route on the data daemon requires an `X-Mcp-Internal-Key` header that matches the daemon's key. DreamFactory sends it on every proxied call; anything else on the host that reaches port 8006 is refused with `403 Forbidden: invalid internal key`. On 7.7.0 this check only runs when you set `MCP_INTERNAL_KEY` yourself; on 7.7.1 it always runs.

How the key is resolved, in order:

1. `MCP_INTERNAL_KEY` in the environment, on both DreamFactory and the daemon. Set this explicitly when the daemon cannot read DreamFactory's files: a sidecar container, another host, or a daemon user without access to `storage/framework`.
2. Otherwise DreamFactory generates a key into `storage/framework/mcp_internal_key` (mode 0600) the first time it needs one, and the daemon reads that file. `start-daemon.sh` finds it by walking up from the daemon directory to the directory that holds `artisan`. If your layout defeats that walk (a symlinked or relocated package), set `DF_APP_ROOT` to the DreamFactory root, or `MCP_INTERNAL_KEY_FILE` to the file itself.

Never move the file under `storage/app`: that is the root of the stock `files` service and is downloadable over the REST API.

Each DreamFactory node talks only to the daemon on its own host (`127.0.0.1:8006`), so in a multi-node deployment every node having its own generated key is fine. A shared `MCP_INTERNAL_KEY` is needed only when one daemon serves more than one DreamFactory host, or runs on a different host from the DreamFactory that drives it.

The [health check](#verifying-the-install) reports the key's source as `env`, `file`, or `null`. `null` means no key at all, and the daemon is rejecting everything.

## Configuration

Set these in your DreamFactory `.env`:

| Variable | Set to | Applies to | Notes |
|---|---|---|---|
| `APP_URL` | `https://df.example.com` | both | The external URL clients use. Not `http://localhost`. |
| `DF_FRONTEND_URL` | *(optional)* | both | Override only if the admin SPA is on a different host. |
| `LOG_LEVEL` | `warning` | both | Set to `debug` while troubleshooting OAuth, then revert. |
| `MCP_DAEMON_ENABLED` | `true` | both | Set to `false` to disable the data daemon and every `mcp` service (they answer `503`). |
| `MCP_DAEMON_URL` | `http://127.0.0.1:8006` | both | Where DreamFactory reaches the data daemon. Change it only if you changed the daemon's host or port (`MCP_DAEMON_HOST` / `MCP_DAEMON_PORT` in the daemon's environment). |
| `MCP_INTERNAL_BASE_URL` | *(optional)* | both | URL the daemons call DreamFactory back on. **Required when the external port differs from the internal one** (typical Docker port mapping). See [below](#daemon-callback-url-mcp_internal_base_url). |
| `MCP_DAEMON_TIMEOUT` | `300` | **7.7.1+** | Seconds a PHP worker waits for the daemon on one proxied call before answering `504`. Lower it only if no tool chains many sub-calls. |
| `MCP_SCOPE_TOOLS` | `true` | **7.7.1+** | Set to `false` to restore the pre-7.7.1 instance-wide tool catalog for services with no [Exposed Services](./mcp-exposed-services.md) selection. |
| `MCP_INTERNAL_KEY` | *(optional)* | both (7.7.1: see [shared secret](#the-daemon-shared-secret-771)) | Shared secret sent to both daemons. On 7.7.1 leave it unset on a single host and let DreamFactory generate the file; set it, with the same value on the daemon side, when the daemon runs elsewhere. On 7.7.0 setting it is what turns the check on. |
| `MCP_INTERNAL_KEY_FILE` | `storage/framework/mcp_internal_key` | **7.7.1+** | Where the generated key lives. Set on both sides if you move it. |
| `MCP_SYSTEM_DAEMON_ENABLED` | `true` | **7.7.1+** | Gate for the `system_mcp` type. When `false`, those services answer `503`. |
| `MCP_SYSTEM_DAEMON_URL` | `http://127.0.0.1:3700` | **7.7.1+** | Where DreamFactory reaches the System API MCP daemon. For a sidecar, its container address, e.g. `http://df-system-mcp:3700`. |
| `MCP_SYSTEM_DAEMON_BASE_URL` | *(optional)* | **7.7.1+** | DreamFactory URL the system daemon calls back on. Leave unset on the same host. For a sidecar, an address it can reach, e.g. `http://web`. Falls back to `MCP_INTERNAL_BASE_URL`, then the request origin. |

Daemon-side variables (set in the daemon's environment, for example the systemd unit, not in `.env`):

| Variable | Default | Applies to | Notes |
|---|---|---|---|
| `MCP_DAEMON_HOST` / `MCP_DAEMON_PORT` | `127.0.0.1` / `8006` | both | Keep `MCP_DAEMON_URL` in step if you change them. |
| `MCP_STATELESS` | 7.7.0: `false`. 7.7.1: `true` | both | 7.7.0 multi-node deployments must set `true`. 7.7.1 single-node installs that want warm sessions may set `false`. |
| `MCP_ALLOW_FUNCTION_TOOLS` | `false` | **7.7.1+** | Function custom tools run admin-authored JavaScript inside the daemon. They are registered only when this is `true`. |
| `DF_APP_ROOT` | *(auto)* | **7.7.1+** | DreamFactory root, used to find the generated key file when the launcher's walk-up fails. |

:::warning
`APP_URL` must be the **external HTTPS URL** clients reach. It drives the OAuth discovery and callback URLs as well as server-side session validation. If it is left as `http://localhost` (or any value clients can't reach), MCP authentication fails — typically as a login page that loops.
:::

Verify the value actually in use:

```bash
php artisan tinker --execute="echo config('app.url');"
```

### Daemon callback URL (`MCP_INTERNAL_BASE_URL`)

The daemons execute every tool by calling DreamFactory's REST API back. By default the data daemon calls the same origin the client's request arrived on. When that origin is not reachable from where the daemon runs, set `MCP_INTERNAL_BASE_URL` to an address that is.

The classic case is Docker port mapping: with `-p 8084:80`, clients reach DreamFactory at `http://host:8084`, but inside the container it listens on port 80 — so the daemon's callback to `:8084` fails. The symptom is distinctive: **connecting and `tools/list` succeed, but every tool call fails**, because only tool execution needs the callback.

```bash
# in .env — an address that reaches DreamFactory from where the daemon runs
MCP_INTERNAL_BASE_URL=http://127.0.0.1
```

In a compose stack with a separate daemon container, use the web service's internal address instead (e.g. `http://web`). Then run `php artisan config:clear` and restart PHP-FPM.

On 7.7.1 the System API MCP daemon uses the same variable (or `MCP_SYSTEM_DAEMON_BASE_URL` when set) for its own callbacks.

### PHP-FPM pool sizing

Every proxied MCP call occupies **two** PHP-FPM workers from the same pool at once: one holds the client's request open while the daemon works, and the daemon's REST call back into DreamFactory takes another. A pool that is too small does not error; MCP calls simply hang until the daemon timeout, and the rest of the site slows down with them.

Size `pm.max_children` for at least twice the number of concurrent MCP calls you expect. The Debian default of 5 is exhausted by 3 concurrent calls. Alternatively, point `MCP_INTERNAL_BASE_URL` at a separate FPM pool reserved for daemon-originated traffic, so tool execution cannot starve the pool that serves clients.

On 7.7.1, a call that outlives `MCP_DAEMON_TIMEOUT` returns `504` with `MCP daemon did not respond within Ns` rather than holding the worker.

### System API MCP daemon as a sidecar container (7.7.1+)

If you would rather not run Node on the DreamFactory host, the system daemon can run as a container on the same Docker network:

```bash
git clone https://github.com/dreamfactorysoftware/df-system-mcp-server && cd df-system-mcp-server
docker build -t df-system-mcp .
docker run -d --name df-system-mcp --network dreamfactory_default \
  -e DREAMFACTORY_URL=http://web/api/v2 \
  -e MCP_INTERNAL_KEY=<same value as DreamFactory> \
  -p 3700:3700 df-system-mcp
```

Then in DreamFactory's `.env` set `MCP_SYSTEM_DAEMON_URL=http://df-system-mcp:3700`, `MCP_SYSTEM_DAEMON_BASE_URL=http://web`, and the same `MCP_INTERNAL_KEY`. The key is mandatory here: the sidecar listens on a network interface, and the key is what stops anything else on that network from driving it.

## Applying configuration changes

DreamFactory caches configuration, so editing `.env` alone is not enough:

```bash
php artisan config:clear            # required — .env is ignored while config is cached
php artisan config:cache            # only if you run cached config in production
sudo systemctl restart php8.5-fpm   # use your PHP version; also clears OPcache
```

- **Don't** run `php artisan` as `root` — it creates root-owned cache files that PHP-FPM can't read, causing 500s. Run it as a normal user. If it already happened, reset ownership to your web-server user, e.g. `sudo chown -R www-data:www-data storage bootstrap/cache`.
- **Don't** rely on a PHP-FPM restart alone to apply `.env` changes — run `config:clear` first.
- Restart PHP-FPM after editing any vendor PHP file (OPcache won't pick it up otherwise).
- Daemon-side variables (`MCP_STATELESS`, `MCP_ALLOW_FUNCTION_TOOLS`, the host and port) take effect when the daemon restarts, not on `config:clear`.

## Verifying the install

### 7.7.1+: the health endpoint

One admin-only call reports whether each daemon is reachable, whether `APP_URL` matches the address you are connecting on, and whether the shared secret and callback URL are in place:

```bash
curl -s -H "X-DreamFactory-Session-Token: $ADMIN_TOKEN" \
  https://df.example.com/_internal/ai/mcp-health | jq .
```

The response carries a `status` (`ok`, `warn`, or `error`, the worst of all checks), one record per daemon (`reachable`, `version`, `mode`, `tools`), and a `checks` list where every entry has a plain-language `message` saying what to do. The checks are:

| `id` | What it looks at |
|---|---|
| `daemon.mcp` | The data daemon's `/health`. `error` when enabled but unreachable. |
| `daemon.system_mcp` | The same for the System API MCP daemon. |
| `app_url` | `APP_URL` host and port against the origin this request came from, honoring `X-Forwarded-*`. `warn` on a mismatch, which means OAuth redirects will loop. |
| `internal_base_url` | `warn` when `MCP_INTERNAL_BASE_URL` is unset but a daemon runs on a non-loopback host. |
| `internal_key` | Where the shared secret comes from: `env`, `file`, or `null`. `error` on `null`. |
| `function_tools` | `warn` when function custom tools are configured but the daemon has them off. |
| `node` | Whether `node` is on the web host's path. `error` if the data daemon is expected here and is down. |
| `stateless` | The data daemon's session mode. Informational. |

The admin UI shows the same data: the System page lists the full report, and each MCP service page shows a one-line status chip.

### Both versions: probe the daemon directly

```bash
curl -s http://127.0.0.1:8006/health     # data daemon: version, mode, session count
curl -s http://127.0.0.1:3700/health     # 7.7.1+: System API MCP daemon
```

`/health` does not require the shared secret, so it answers even when the key is misconfigured. If it answers but MCP calls return `403`, the problem is the key.

Then confirm the routes and OAuth discovery from outside:

```bash
curl -s https://df.example.com/.well-known/oauth-authorization-server/mcp/<service> \
  | jq -r '.issuer, .authorization_endpoint'
```

## Running behind a reverse proxy

When a proxy (AWS ALB, nginx, Cloudflare) terminates TLS and forwards traffic to DreamFactory over HTTP, MCP OAuth and the rest of DreamFactory take different paths.

MCP OAuth discovery reads `APP_URL` directly. Set it to the external HTTPS URL (see [Configuration](#configuration)). That is what makes discovery advertise `https://` URLs.

:::caution
`APP_URL` is sufficient for MCP OAuth discovery. It is **not** sufficient for redirects. Laravel builds the root-route redirect (`/` → the admin UI) from the incoming request, so behind a TLS-terminating proxy the `Location` header comes back as `http://` unless you set `FORCE_HTTPS` or pass `HTTPS` through to PHP. See [Redirects still going to HTTP](#redirects-still-going-to-http) and [Web Server — TLS](../getting-started/optimizing-dreamfactory/webserver.md#tls).
:::

After applying `APP_URL`, confirm OAuth discovery advertises **https** URLs:

```bash
curl -s https://df.example.com/.well-known/oauth-authorization-server/mcp/<service> \
  | jq -r '.issuer, .authorization_endpoint'
```

If those URLs come back as `https://…`, no further proxy configuration is needed for MCP OAuth.

### If discovery still shows `http://`

This means the proxy's scheme isn't reaching PHP. Pass it through in your nginx site:

```nginx
# in the http { } block
map $http_x_forwarded_proto $fcgi_https { default off; https on; }

# in server { } -> location ~ \.php$ { }
fastcgi_param HTTPS $fcgi_https;
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Redirects still going to HTTP

Laravel builds redirects from the incoming request. Behind a TLS-terminating proxy the app only sees the HTTP leg, so `Location` headers come back as `http://…` even when `APP_URL` is correct. The supported application-level switch is:

```bash
# in .env
FORCE_HTTPS=true
```

Then run `php artisan config:clear` and restart PHP-FPM. Do **not** follow that with `config:cache` — `FORCE_HTTPS` is read from the environment at boot, not from cached config, so caching config makes the setting a no-op and redirects go back to `http://`.

The nginx `HTTPS` FastCGI parameter above is the other supported path: it tells PHP the original request was HTTPS. Use both when TLS terminates in front of DreamFactory.

DreamFactory does not ship `app/Http/Middleware/TrustProxies.php`. Do not add one.

Full reverse-proxy notes are on [Web Server — TLS](../getting-started/optimizing-dreamfactory/webserver.md#tls).

### Load balancers and multiple nodes

Run the daemon (and on 7.7.1 the system daemon, if used) on **every** node, each listening on its own loopback. DreamFactory on a node only ever talks to the daemon on that node, so no stickiness, shared cache, or shared key file is needed, with one version-specific condition:

- **7.7.0:** set `MCP_STATELESS=true` on every daemon, or sessions fail on the node that did not create them.
- **7.7.1+:** stateless is the default. Only the lazy-loading `fetch_more` handle is per node; a client whose paged result lands on another node gets `unknown or expired handle` and should narrow its query.

## Connecting a client

After [creating an MCP service](./mcp-service-creation.md), point your client at `https://<host>/mcp/{service}`:

- **No trailing slash** — a trailing slash breaks OAuth discovery.
- **Not** `/api/v2/...` — that is the REST API and returns `400 No session token or API Key`.

Example VS Code `mcp.json`:

```json
{
  "servers": {
    "df-poc": { "type": "http", "url": "https://df.example.com/mcp/poc" }
  }
}
```

:::note
Native clients (VS Code, Cursor, Claude Desktop) receive the OAuth code on a rotating `http://127.0.0.1:<port>/` listener. If you see `redirect_uri is not registered for this client`, free up the client's preferred fixed port (VS Code uses `33418`) and reconnect.
:::

:::info 7.7.1+: new services start with Require Role Access on
A service created on 7.7.1 has **Require Role Access** enabled, so a non-admin user can authenticate and still be refused with HTTP `403` and JSON-RPC error `-32003` until an admin grants their role access to the MCP service itself (Roles → Access, or the MCP service page). Administrators always pass. Services that existed before the upgrade keep the switch off.
:::

For tool calls and the full list of required headers, see [MCP Server](./mcp-service.md#required-headers).

## Troubleshooting

On 7.7.1, run the [health endpoint](#verifying-the-install) first; it names most of the problems below outright. Then enable debug logging — OAuth failures are otherwise silent. Set `LOG_LEVEL=debug`, run `config:clear`, then:

```bash
tail -f storage/logs/dreamfactory.log
sudo tail -f /var/log/nginx/access.log | grep -E "oauth-callback|user/session"
sudo journalctl -u df-mcp-daemon -f
```

| Symptom | Applies to | Fix |
|---|---|---|
| Login page loops or flickers | both | Set `APP_URL` to the external HTTPS URL, `config:clear`, restart PHP-FPM |
| Discovery advertises `http://` URLs | both | Set `APP_URL`; if it still shows `http://`, add the nginx `HTTPS` FastCGI param |
| Root URL (or other redirects) go to `http://` | both | Set `FORCE_HTTPS=true`, `config:clear` (not `config:cache`), restart PHP-FPM. See [Web Server — TLS](../getting-started/optimizing-dreamfactory/webserver.md#tls) |
| `400 No session token or API Key` | both | Client URL points at `/api/v2/...` — use `/mcp/{service}` |
| `.well-known` returns 404 | both | Use the service-scoped path `/.well-known/oauth-authorization-server/mcp/{service}` |
| `redirect_uri is not registered` | both | Rotating loopback port — free/reuse the client's fixed port and reconnect |
| 404 on all `/mcp/*` | both | Confirm the package is installed, then `php artisan route:clear` |
| `503 MCP daemon is not reachable at http://127.0.0.1:8006` | both | The data daemon is not running, or `MCP_DAEMON_URL` points elsewhere. Start it (`systemctl status df-mcp-daemon`), or fix the URL and `config:clear` |
| Daemon exits with `ReferenceError: crypto is not defined` | both | Node is older than 20. Install Node 20+ and restart the daemon |
| Daemon exits with `ERR_MODULE_NOT_FOUND` (often `express`), usually right after an upgrade | both | `composer update` removed `daemon/node_modules`. Reinstall: `npm ci --omit=dev` (7.7.1) or `npm install --omit=dev` (7.7.0), then restart |
| Config change has no effect | both | Run `config:clear` (not just a PHP-FPM restart); ensure cache files aren't root-owned |
| Connecting and `tools/list` work, but every tool call fails | both | The daemon can't reach DreamFactory on the request's origin (external port ≠ internal port). Set [`MCP_INTERNAL_BASE_URL`](#daemon-callback-url-mcp_internal_base_url) |
| MCP calls hang, or the whole site slows down while an AI client is active | both | PHP-FPM pool exhausted: each MCP call needs two workers. Raise `pm.max_children` or use a separate pool. See [PHP-FPM pool sizing](#php-fpm-pool-sizing) |
| `Bad Request: Server not initialized` behind a load balancer | 7.7.0 | Stateful daemon on multiple nodes. Set `MCP_STATELESS=true` on every daemon |
| Every MCP call returns `403 Forbidden: invalid internal key`; daemon log says requests are rejected until a key is set | 7.7.1+ | The daemon cannot find or read the [shared secret](#the-daemon-shared-secret-771). Run the daemon as the PHP-FPM user, or set `DF_APP_ROOT` / `MCP_INTERNAL_KEY_FILE`, or set `MCP_INTERNAL_KEY` on both sides |
| `system_mcp` service returns `503` naming `start-system-daemon.sh` | 7.7.1+ | The [System API MCP daemon](#installing-the-system-api-mcp-daemon-771) is not running, or `MCP_SYSTEM_DAEMON_ENABLED=false` |
| Non-admin user logs in but gets `403` with JSON-RPC error `-32003` | 7.7.1+ | Require Role Access is on and the user's role has no grant on the MCP service. Grant it, or turn the switch off on the service |
| `504 MCP daemon did not respond within 300s` | 7.7.1+ | A tool call exceeded `MCP_DAEMON_TIMEOUT`. Usually a slow backend query; raise the timeout only if the call legitimately needs longer |
| Client sees no database/file tools | 7.7.1+ | No [Exposed Services](./mcp-exposed-services.md) selected on the MCP service (new services and pre-7.7.1 imports start empty) — select services, save, reconnect the client |
| Function custom tools never appear | 7.7.1+ | The daemon runs without `MCP_ALLOW_FUNCTION_TOOLS=true`. Set it in the daemon's environment and restart |

## Upgrading to 7.7.1

DreamFactory 7.7.1 adds [Exposed Services scoping](./mcp-exposed-services.md) and [API key authentication](./mcp-api-key-auth.md) to MCP services. The package migrations run as part of the normal upgrade (`php artisan migrate`) and are designed so nothing shrinks:

- Every existing MCP service is backfilled with the database and file services that exist at migrate time, so its `tools/list` is unchanged. Services created **after** the upgrade start with an empty Exposed Services selection.
- **Allow API Key Authentication** defaults to off everywhere — OAuth behavior is unchanged until an admin opts a service in.
- **Require Role Access** is added as off on every existing service. Only services created after the upgrade start with it on.
- After changing a service's Exposed Services, **reconnect its MCP clients** — the tool list is fixed for the life of a session.

Deployment steps the upgrade adds, beyond the migrations:

1. **Reinstall the daemon's dependencies.** The upgrade replaces the package directory, so `daemon/node_modules` is gone. Run `npm ci --omit=dev` in `vendor/dreamfactory/df-mcp-server/daemon` and restart the daemon (see [Reinstall after every composer update](#reinstall-after-every-composer-update)).
2. **Let the shared secret be created.** The first MCP request after the upgrade writes `storage/framework/mcp_internal_key`. The daemon must run as a user that can read it; if it was running as someone else before, fix the unit's `User=` now. If you had set `MCP_INTERNAL_KEY` on 7.7.0, keep it on both sides and nothing changes.
3. **Drop `MCP_STATELESS=true` if you set it for multi-node on 7.7.0.** It is now the default. Leaving it set is harmless.
4. **Start the System API MCP daemon** only if you intend to create `system_mcp` services. Nothing else needs it.
5. **Run the health endpoint** and clear every `warn` and `error` before reconnecting clients.

:::caution Service export/import across versions
The new fields travel with MCP service exports. Importing a scoped 7.7.1 service into a **pre-7.7.1** instance silently drops `exposed_services`, `scope_tools`, and `allow_api_key_auth` — the older instance doesn't know those fields. In the other direction, importing a **pre-7.7.1** export into 7.7.1 creates an MCP service with **no exposure** (the export carries no `exposed_services`, and empty means none) — open the service and select its Exposed Services after the import.
:::

## See also

- [MCP Server](./mcp-service.md) — protocol overview, tools, and request format
- [Creating an MCP Server Service](./mcp-service-creation.md)
- [Scoping Tools with Exposed Services](./mcp-exposed-services.md)
- [API Key Authentication for MCP](./mcp-api-key-auth.md)
- [Custom Login Page for MCP](./mcp-custom-login-page.md)
- [Upgrading DreamFactory](../upgrades-and-migrations/upgrading-migrating-dreamfactory.md) — the 7.7.1 upgrade checklist, including the System API MCP daemon
- [Web Server — TLS](../getting-started/optimizing-dreamfactory/webserver.md#tls) — reverse-proxy scheme, `FORCE_HTTPS`, and redirects
