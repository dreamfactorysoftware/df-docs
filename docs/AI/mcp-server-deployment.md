---
sidebar_position: 5
title: Deploying the MCP Server
id: mcp-server-deployment
description: Install, daemonize, and configure the DreamFactory MCP server, including running behind a reverse proxy or load balancer.
keywords: [MCP, Model Context Protocol, daemon, systemd, reverse proxy, load balancer, deployment, OAuth]
difficulty: advanced
---

# Deploying the MCP Server

This guide covers installing and operating the MCP server on your DreamFactory host: the Node.js daemon, configuration, and running behind a reverse proxy.

- To create an MCP service in the admin interface, see [Creating an MCP Server Service](./mcp-service-creation.md).
- For the available tools, request format, and required headers, see [MCP Server](./mcp-service.md).

## Overview

The MCP server runs in two parts on your DreamFactory host:

- **PHP routes** served by DreamFactory at `/mcp/{service}`
- **A Node.js daemon** that handles the MCP protocol layer (the PHP side forwards to it)

Clients connect to `https://<host>/mcp/{service}` — never directly to the daemon.

## Prerequisites

A working DreamFactory installation, plus the following **on the server**:

- **Node.js 20+ and npm** — required to build and run the daemon. On Ubuntu:

  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  node -v && npm -v
  ```

- The `dreamfactory/df-mcp-server` package (included in the commercial composer set).

Confirm the package and routes are present:

```bash
ls vendor/dreamfactory/df-mcp-server
php artisan route:list | grep '/mcp/'
```

## The MCP daemon

The daemon lives under `vendor/dreamfactory/df-mcp-server/daemon/` and listens on `127.0.0.1:8006`.

Build it:

```bash
cd vendor/dreamfactory/df-mcp-server/daemon
npm install
npm run build
```

Run it via the shipped start script:

```bash
vendor/dreamfactory/df-mcp-server/scripts/start-daemon.sh
```

### Daemonizing for production

No systemd unit ships by default. Add one so the daemon starts on boot and restarts on crash — `/etc/systemd/system/df-mcp-daemon.service`:

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

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now df-mcp-daemon
sudo systemctl status df-mcp-daemon
```

### Viewing the daemon logs

Because the unit sends output to the journal (`StandardOutput=journal`), read the daemon's logs with `journalctl`:

```bash
sudo journalctl -u df-mcp-daemon -f             # follow live
sudo journalctl -u df-mcp-daemon -n 100         # last 100 lines
sudo journalctl -u df-mcp-daemon --since "15 min ago"
```

:::tip
Point `ExecStart` at the shipped `start-daemon.sh`, which runs the compiled `dist/server.js`. Don't point it at `tsx` — that's a dev-only dependency and is removed by a production `npm install --omit=dev`.
:::

:::note
In the Docker/compose stack, the daemon starts automatically when `ENABLE_MCP_DAEMON` is set, so no systemd unit is needed.
:::

## Configuration

Set these in your DreamFactory `.env`:

| Variable | Set to | Notes |
|---|---|---|
| `APP_URL` | `https://df.example.com` | The external URL clients use. Not `http://localhost`. |
| `DF_FRONTEND_URL` | *(optional)* | Override only if the admin SPA is on a different host. |
| `LOG_LEVEL` | `warning` | Set to `debug` while troubleshooting OAuth, then revert. |

:::warning
`APP_URL` must be the **external HTTPS URL** clients reach. It drives the OAuth discovery and callback URLs as well as server-side session validation. If it is left as `http://localhost` (or any value clients can't reach), MCP authentication fails — typically as a login page that loops.
:::

Verify the value actually in use:

```bash
php artisan tinker --execute="echo config('app.url');"
```

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

## Running behind a reverse proxy

When a proxy (AWS ALB, nginx, Cloudflare) terminates TLS and forwards traffic to DreamFactory, the one thing you must do is set `APP_URL` to the external HTTPS URL (see [Configuration](#configuration)). That is sufficient for most deployments.

After applying the change, confirm OAuth discovery advertises **https** URLs:

```bash
curl -s https://df.example.com/.well-known/oauth-authorization-server/mcp/<service> \
  | jq -r '.issuer, .authorization_endpoint'
```

If those URLs come back as `https://…`, no further proxy configuration is needed.

### Only if discovery still shows `http://`

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

For correct behavior across the rest of DreamFactory behind a proxy (redirects, secure cookies, client IPs in logs), also trust the proxy in `app/Http/Middleware/TrustProxies.php`:

```php
protected $proxies = '*';   // or your load balancer / subnet CIDRs
protected $headers =
    Request::HEADER_X_FORWARDED_FOR  | Request::HEADER_X_FORWARDED_HOST |
    Request::HEADER_X_FORWARDED_PORT | Request::HEADER_X_FORWARDED_PROTO;
```

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

For tool calls and the full list of required headers, see [MCP Server](./mcp-service.md#required-headers).

## Troubleshooting

Enable debug logging first — OAuth failures are otherwise silent. Set `LOG_LEVEL=debug`, run `config:clear`, then:

```bash
tail -f storage/logs/dreamfactory.log
sudo tail -f /var/log/nginx/access.log | grep -E "oauth-callback|user/session"
```

| Symptom | Fix |
|---|---|
| Login page loops or flickers | Set `APP_URL` to the external HTTPS URL, `config:clear`, restart PHP-FPM |
| Discovery advertises `http://` URLs | Set `APP_URL` + TrustProxies + nginx `HTTPS` param |
| `400 No session token or API Key` | Client URL points at `/api/v2/...` — use `/mcp/{service}` |
| `.well-known` returns 404 | Use the service-scoped path `/.well-known/oauth-authorization-server/mcp/{service}` |
| `redirect_uri is not registered` | Rotating loopback port — free/reuse the client's fixed port and reconnect |
| 404 on all `/mcp/*` | Confirm the package is installed, then `php artisan route:clear` |
| Config change has no effect | Run `config:clear` (not just a PHP-FPM restart); ensure cache files aren't root-owned |

## See also

- [MCP Server](./mcp-service.md) — protocol overview, tools, and request format
- [Creating an MCP Server Service](./mcp-service-creation.md)
- [Custom Login Page for MCP](./mcp-custom-login-page.md)
