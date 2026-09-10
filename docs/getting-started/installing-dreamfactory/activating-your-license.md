---
sidebar_position: 7
title: Activating Your License
id: activating-your-license
description: Apply your DreamFactory license key and package files to an existing installation to unlock all connectors and features. Docker and Linux steps, no reinstall required.
keywords: [DreamFactory license key, activate license, unlock connectors, composer files, DF_LICENSE_KEY]
---

# Activating Your License

If you already have DreamFactory running and have received a license from the DreamFactory team, this guide walks through applying it to your existing instance. Your services, roles, API keys, and system database are untouched. Only the application packages and the license key change.

## What you receive

The DreamFactory team provides two things:

- **Three composer files**: `composer.json`, `composer.json-dist`, and `composer.lock`. These tell Composer which DreamFactory packages to install for your license. The DreamFactory team will typically give you credentials to download these from the DreamFactory SFTP server, where they are organized by version.
- **A license key**: a string you set as `DF_LICENSE_KEY` in the environment.

Both must match the DreamFactory version you are running. If you are unsure which version that is, check **Admin > About DreamFactory** in the admin panel before you start.

:::tip
The Oracle connector is shipped separately due to Oracle's licensing terms. If your license includes Oracle, see [Installing Additional Drivers](installing-additional-drivers.md).
:::

## Docker

These steps assume you started DreamFactory from the [df-docker](https://github.com/dreamfactorysoftware/df-docker) repository.

1. Back up first. Stop the containers and confirm `APP_KEY` is pinned in `docker-compose.yml` so your system database stays readable after the rebuild (see [Persisting system database configs](docker-installation.md#persisting-system-database-configs)).

   ```bash
   docker compose stop
   ```

2. Copy the three composer files into the `df-docker` directory, overwriting the existing ones.

3. Add the license key to the `web` service in `docker-compose.yml`:

   ```yaml
   web:
     environment:
       DF_LICENSE_KEY: "your-license-key"
   ```

4. Rebuild and start:

   ```bash
   docker compose build web
   docker compose up -d
   ```

   The build pulls the additional packages, so it takes longer than usual.

## Linux and manual installs

These steps assume DreamFactory lives in `/opt/dreamfactory`. Adjust the path if yours differs.

1. Back up the installation directory and system database.

2. Copy the three composer files into the installation directory, overwriting the existing ones.

3. Install the packages:

   ```bash
   cd /opt/dreamfactory
   composer install --no-dev --ignore-platform-reqs
   ```

4. Add the license key to `.env`:

   ```bash
   DF_LICENSE_KEY=your-license-key
   ```

5. Run migrations and clear caches:

   ```bash
   php artisan migrate --seed
   php artisan cache:clear
   php artisan config:clear
   ```

6. Restart the web server and PHP-FPM:

   ```bash
   sudo systemctl restart nginx php8.3-fpm
   ```

## Verify

Log in to the admin panel and open the **API Generation & Connections** tab. Connectors that were previously greyed out, such as SQL Server, SOAP, and Salesforce, are now selectable. **Admin > About DreamFactory** also shows your license key.

## Troubleshooting

**`composer install` fails on a platform requirement** such as `ext-oci8`. Composer is checking for a PHP extension you do not have installed. The `--ignore-platform-reqs` flag above skips that check, which is safe for any driver you are not using.

**Connectors are still locked after restart.** Confirm the key is visible to the application with `php artisan tinker --execute="echo config('app.license_key');"` (inside the container for Docker). An empty result means the key is not being read from the environment.

**"The MAC is invalid" after a Docker rebuild.** `APP_KEY` changed. Restore the original value in `docker-compose.yml` and restart.

Need help? Contact [support@dreamfactory.com](mailto:support@dreamfactory.com).
