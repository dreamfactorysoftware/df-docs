---
sidebar_position: 3
title: Optimizing PHP and Laravel for DreamFactory
sidebar_label: "PHP and Laravel"
id: php-and-laravel
description: Tune PHP and Laravel for DreamFactory performance, covering OPcache, PHP-FPM limits, framework caching, and the settings DreamFactory ships with.
keywords: [DreamFactory performance, PHP tuning, OPcache, PHP-FPM, Laravel cache, artisan optimize, DreamFactory PHP settings]
difficulty: "intermediate"
---

# PHP and Laravel

DreamFactory is a Laravel application, so most of what makes it fast is ordinary PHP and Laravel tuning. This page covers the settings that matter, and the ones DreamFactory already sets for you.

## The Platform Baseline

DreamFactory 7.7 runs on **PHP 8.5** and **Laravel 13**. Check what you are actually on:

```bash
php -v
php artisan --version
```

If you are upgrading from an older release, do that first. Performance work on an unsupported PHP version is wasted effort, and DreamFactory gets a meaningful speed increase from each major PHP release on its own.

## PHP Settings DreamFactory Sets

These are the values DreamFactory ships. They are chosen for a platform that proxies large payloads and runs user-supplied scripts, so they are more generous than a stock `php.ini`.

| Setting | Value | Why |
|---|---|---|
| `memory_limit` | `1024M` | Large result sets and file transfers pass through PHP memory |
| `max_execution_time` | `300` | Scripted services and bulk operations can be slow |
| `upload_max_filesize` | `100M` | File service uploads |
| `post_max_size` | `100M` | Must be at least as large as `upload_max_filesize` |

If you raise the upload limits, raise them in **three** places or the change does nothing: `upload_max_filesize`, `post_max_size`, and NGINX's `client_max_body_size`. See [Web Server](webserver.md).

### Leave `display_errors` off

```ini
display_errors=Off
display_startup_errors=Off
log_errors=On
```

This is not just tidiness. On PHP 8.5, deprecation notices are echoed directly into the HTTP response body, which corrupts JSON API responses for clients that are otherwise working fine. Laravel overrides `error_reporting` during bootstrap, so filtering deprecations there does not help. Turning off the raw echo is the reliable fix. Errors still reach Laravel's handler and your logs.

## OPcache

OPcache compiles PHP to bytecode once and reuses it. It is enabled by default and it is the single largest PHP-level win available. Confirm it is on:

```bash
php -i | grep opcache.enable
```

The setting that matters in production is timestamp validation:

```ini
opcache.validate_timestamps=0
```

With validation off, PHP stops checking whether files changed on every request. Development environments set `opcache.validate_timestamps=1` with `opcache.revalidate_freq=0` so edits appear immediately, which is the correct choice while you are working but wasteful in production.

The catch: with validation off, **deployments must reset the cache**. Restart PHP-FPM as the last step of every deploy, or your new code will not be running. Forgetting this looks exactly like a failed deployment.

Other values worth reviewing on a busy instance are `opcache.memory_consumption` and `opcache.max_accelerated_files`. DreamFactory plus its connectors is a large codebase, and if the file count exceeds `max_accelerated_files` the cache thrashes and you lose most of the benefit.

JIT is disabled by default. It rarely helps a request-response web workload like this one; spend the effort on OPcache and caching first.

## Laravel Framework Caching

Laravel can precompile its configuration, routes and metadata. On a production instance, run:

```bash
php artisan optimize
```

That caches framework bootstrap, configuration and metadata in one command. The individual pieces are also available:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

To reverse all of it:

```bash
php artisan optimize:clear
```

**Two rules.** First, re-run `optimize` on every deploy, for the same reason you restart PHP-FPM: cached config is a snapshot. Second, once configuration is cached, `.env` is no longer read at runtime. Changing a value in `.env` has no effect until you re-run the command. This surprises people during incident response, when someone edits `.env` to change a setting and nothing happens.

## Application Cache Driver

Separate from the framework caches above, DreamFactory caches service definitions, schema and role data in Laravel's cache store. The default file driver works, but a shared store is faster and is required if you run more than one application server, since each one would otherwise keep its own copy.

Configuring Redis as the cache driver is covered in [Optimizing Database APIs](database.md).

To clear DreamFactory's own file-based cache:

```bash
php artisan df:clear-file-cache
```

## PHP-FPM Process Limits

Under load, the ceiling is usually the number of PHP-FPM workers, not PHP itself. If requests queue while CPU sits idle, `pm.max_children` is the limit you have hit.

Size it against memory rather than guessing. Measure the resident size of a typical DreamFactory worker under real traffic, then allow enough headroom that peak worker count times worker size stays comfortably below total RAM. Setting `pm.max_children` too high is worse than too low: it trades a queue for swapping, and swapping takes the whole instance down instead of slowing it.

## Where to Look Next

- [Optimizing Database APIs](database.md), including database caching and Redis
- [Web Server](webserver.md), for NGINX limits and timeouts that pair with the PHP settings here
