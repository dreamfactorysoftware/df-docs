---
sidebar_position: 1
title: Upgrading and Migrating DreamFactory
id: upgrading-and-migrating-dreamfactory
description: Upgrade DreamFactory in-place for minor versions or migrate to a new server for major releases. Covers backup, restore, and environment setup.
keywords: [DreamFactory upgrade, DreamFactory migration, version upgrade, server migration, DreamFactory backup]
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Upgrading and Migrating DreamFactory

## Current Version & Changelog

The current stable release of DreamFactory is **v7.7.1**. For the full list of releases, version history, and release notes, see the [DreamFactory GitHub Releases page](https://github.com/dreamfactorysoftware/dreamfactory/releases).

Each release includes a changelog describing new features, bug fixes, and any breaking changes. Before upgrading, review the changelog for your target version to identify any actions required on your end (e.g., PHP version changes, `.env` configuration additions, or deprecated API behaviors).

To check the version currently running on your instance, log in to the DreamFactory admin panel and navigate to **System > Config > System Info**, or run this from the DreamFactory root directory:

```bash
grep "'version'" config/app.php
```

The **System Info** page also shows your license level (for example `GOLD` or `OPEN SOURCE`). Note it before you upgrade — it is the quickest way to confirm afterwards that a commercial instance is still running its commercial edition.

## Upgrade Path by Version

Use the table below to identify the appropriate upgrade method based on your current and target versions:

| From Version | To Version | Method | Notes |
|---|---|---|---|
| 4.x | 5.x | In-place (`git pull`) | PHP 7.4+ required; run `php artisan migrate --seed` |
| 5.x | 6.x | In-place (`git pull`) | Review `.env` for new required variables; check deprecated connectors |
| 6.x | 7.x | In-place or fresh migration | PHP 8.3+ required; significant dependency updates — test in staging first |
| 7.0–7.6 | 7.7.x | In-place (check out the release tag) | Laravel 11 → 13; PHP 8.3+; commercial installs need the 7.7.x composer files. See [Upgrading to 7.7.x](#upgrading-to-77x) |
| Any | Cross-server | Full migration (see below) | Use the Major Version Migration process to copy `.env` and system database |

**Breaking changes to watch for:**
- **3.x → 4.x**: System database schema changed significantly — a fresh migration is required; data can be re-imported via the 4.x import tools.
- **5.x → 6.x**: Several legacy connectors were removed; verify your active services are still supported.
- **6.x → 7.x**: PHP minimum version bumped to 8.1 (8.3 from 7.0.1 onward); Composer 2 required; some deprecated API behaviors removed.
- **7.6.x → 7.7.x**: The framework moves from Laravel 11 to Laravel 13, which changes the default cache store and several configuration files. `CACHE_STORE` must be set in `.env` — see [Upgrading to 7.7.x](#upgrading-to-77x).

## Upgrading to 7.7.x

DreamFactory 7.7.0 and 7.7.1 are in-place upgrades from any earlier 7.x release, using the [Minor Version Upgrade process](#upgrade-process) below. The upgrade path 7.6.0 → 7.7.0 → 7.7.1 has been validated on Ubuntu 24.04 with PHP 8.3, Nginx and a MariaDB system database, for both open source and commercial (Gold) installs. Read these notes before you start:

- **PHP 8.3 or later.** 7.7.x runs on Laravel 13, which requires PHP 8.3+. If you are still on an older PHP version, upgrade PHP before you start.
- **Commercial installs need the composer files for the new version.** Your commercial edition is defined by the `composer.json`, `composer.json-dist` and `composer.lock` files DreamFactory provided for your *current* version. Before upgrading, request the matching set for your *target* version (for example 7.7.1) from DreamFactory support. If you skip this, `composer install` installs the open source edition: every command succeeds, but the commercial connectors (Oracle, SQL Server, Snowflake, SAML, Limits, Agents, and others) disappear and the license shows `OPEN SOURCE`.
- **`CACHE_STORE` must be set in `.env`.** Laravel 13's `config/cache.php` falls back to the `database` cache store when `CACHE_STORE` is not set, and the DreamFactory system database has no `cache` table. Without the variable, every request fails with `Table 'dreamfactory.cache' doesn't exist`, including admin login. Installer-built instances already have `CACHE_STORE=file`; check yours before upgrading:

  ```bash
  grep '^CACHE_STORE' .env
  ```

  If nothing is returned, add `CACHE_STORE=file` (or `redis` / `memcached` if you use one of those).
- **Configuration files are replaced.** Checking out the new release replaces the tracked files in `config/`, `app/` and `public/` — including the new `config/cache.php` with `'serializable_classes' => true` (see [Configuration Notes for Laravel 13-Based Releases](#configuration-notes-for-laravel-13-based-releases)). Local edits to those files are saved by `git stash`; re-apply them by hand rather than with `git stash pop`.
- **New in 7.7.1: the System API MCP daemon.** The `df-system-mcp-server` package is installed with every full edition. The `system_mcp` service type needs that daemon running (`vendor/dreamfactory/df-mcp-server/scripts/start-system-daemon.sh`, Node.js required); until it is started, requests to a `system_mcp` service return a 503 with setup instructions. Nothing else depends on it.

## Pre-Upgrade Checklist

Before starting any upgrade, complete these steps to ensure you can recover if something goes wrong:

1. **Back up the `.env` file** — this file contains your `APP_KEY`, database credentials, and all environment-specific configuration. Without it, encrypted data is unrecoverable.

   ```bash
   cp /opt/dreamfactory/.env /opt/dreamfactory/.env.backup.$(date +%Y%m%d)
   ```

2. **Back up the system database** — the system database stores all your API configurations, roles, scripts, and user accounts. Use the [Step 2: Back Up the System Database](#step-2-back-up-the-system-database) instructions below for your database type.

3. **Note your PHP version** — confirm the target DreamFactory version supports your current PHP installation:

   ```bash
   php --version
   ```

4. **Note custom scripts and connectors** — list any event scripts, scripted services, or custom connectors you've added so you can verify they still function after the upgrade.

5. **Check scheduled jobs and cron tasks** — if you use DreamFactory's scheduler or have external cron jobs calling DreamFactory APIs, document them before upgrading.

6. **Test in a staging environment first** — if possible, clone your instance to a staging server and run the upgrade there before applying it to production.

7. **Commercial installs: get the composer files for the target version** — request the `composer.json`, `composer.json-dist` and `composer.lock` for the version you are upgrading to from DreamFactory support, and note your current license level on **System > Config > System Info**.

## Rolling Back an Upgrade

If an upgrade fails or causes unexpected behavior, restore your previous state using the backups created in the Pre-Upgrade Checklist:

### Step 1: Restore the application files

If you made a file-based backup (`cp -r dreamfactory dreamfactory.backup`), restore it. This is the most reliable option because it also restores `vendor/` and your commercial composer files:

```bash
sudo mv /opt/dreamfactory /opt/dreamfactory.failed
sudo cp -a /opt/dreamfactory.backup /opt/dreamfactory
```

Otherwise, check out the release you were running before and reinstall its dependencies, as the user that owns the installation (see [Step 2](#step-2-prepare-for-upgrade)). On a commercial install, copy the previous version's composer files back in before running `composer install`:

```bash
cd /opt/dreamfactory
sudo -u dreamfactory git checkout <previous-version-tag>   # e.g. 7.6.0
sudo -u dreamfactory composer install --no-dev --ignore-platform-reqs
```

### Step 2: Restore the system database

Use your database-specific method to restore the `dump.sql` backup:

```bash
# MySQL example
mysql -u root -p dreamfactory < /path/to/dump.sql

# PostgreSQL example
psql -U root -d dreamfactory < /path/to/dump.sql
```

### Step 3: Restore the .env file

```bash
cp /opt/dreamfactory/.env.backup.YYYYMMDD /opt/dreamfactory/.env
```

### Step 4: Clear caches and restart

```bash
sudo -u dreamfactory php artisan optimize:clear
sudo systemctl restart php8.3-fpm   # match your PHP version
sudo systemctl restart nginx
```

After restoring, verify the admin panel loads correctly and your APIs respond as expected.

---

This guide covers two different scenarios for updating your DreamFactory installation:

- **Minor Version Upgrades**: In-place updates for patch releases and minor versions (e.g., 7.0.0 → 7.1.0)
- **Major Version Migration**: Complete migration to a new server or environment, typically for major version changes or infrastructure updates

Choose the appropriate section based on your needs. Most users will use the minor version upgrade process for routine updates.

---

# Minor Version Upgrades

For minor version upgrades and patch releases, you can perform an in-place upgrade of your existing DreamFactory installation. This process uses Git, Composer, and Laravel's Artisan commands to update your current environment.

## Prerequisites

- **Backup Required**: Always perform complete backups before upgrading
- **Git Repository**: Your DreamFactory installation must be a Git repository
- **Command Line Access**: Shell/SSH access to your server
- **Commercial composer files**: For commercial installs, the `composer.json`, `composer.json-dist` and `composer.lock` for your target version, provided by DreamFactory support

## Upgrade Process

### Step 1: Create Backups

Navigate to one level above your DreamFactory directory (typically `/opt/dreamfactory`) and create a file backup:

```bash
cd /opt
sudo cp -a dreamfactory dreamfactory.backup
```

Create a database backup, reference for methods found [here](#step-2-back-up-the-system-database).

### Step 2: Prepare for Upgrade

Navigate to your DreamFactory installation directory:

```bash
cd /opt/dreamfactory
```

Find the user that owns the installation:

```bash
stat -c '%U' /opt/dreamfactory
```

Run every `git`, `composer` and `php artisan` command in this guide **as that user**. On servers built with the DreamFactory installer this is `dreamfactory`, which is what the examples below use; substitute your own user if it differs. Running these commands as `root` (or with plain `sudo`) causes two problems:

- Git refuses to work in a directory owned by another user (`fatal: detected dubious ownership in repository`).
- Files created under `storage/`, `bootstrap/cache/` and `vendor/` become owned by `root`. The web server can then no longer write its cache, which surfaces as HTTP 500 errors such as `file_put_contents(.../storage/framework/cache/data/...): Failed to open stream`, and later `composer install` runs fail part-way with `Could not delete .../vendor/...`.

Stash any local changes to preserve modifications:

```bash
sudo -u dreamfactory git stash
```

:::note
On a commercial install, `git stash` also stashes the commercial `composer.json`, `composer.json-dist` and `composer.lock`, because they replace the open source versions tracked in the repository. That is expected — you will copy in the files for the new version in Step 4. Do not run `git stash pop` after the upgrade: it would conflict with the new release's files.
:::

### Step 3: Update Source Code

Fetch the release tags and check out the version you are upgrading to:

```bash
sudo -u dreamfactory git fetch origin --tags
```

```bash
sudo -u dreamfactory git checkout 7.7.1   # replace with your target version
```

Checking out a release tag works on every install, including those created with the installer's "Install a specific version" option. Those installs are cloned from a single tag and have no `master` branch, so `git checkout master` fails with `pathspec 'master' did not match`. Using the tag also lets you upgrade one version at a time, for example 7.6.0 → 7.7.0 → 7.7.1.

:::tip
If your install tracks the `master` branch, `git checkout master` followed by `git pull origin master` also works, but it always takes you to the newest release rather than to a version you choose.
:::

### Step 4: Install the Commercial Composer Files (commercial installs only)

Copy the composer files DreamFactory provided for your target version into the installation directory, replacing the existing ones:

```bash
sudo cp /path/to/license-files/composer.{json,json-dist,lock} /opt/dreamfactory/
sudo chown dreamfactory:dreamfactory /opt/dreamfactory/composer.{json,json-dist,lock}
```

:::warning
If you skip this step, `composer install` installs the **open source** edition from the repository's own composer files. Every command still succeeds, so nothing looks wrong until you notice that the commercial connectors (Oracle, SQL Server, Snowflake, SAML, Limits, Agents, and others) are gone and **System > Config > System Info** shows the license as `OPEN SOURCE`. Copying the correct files in and re-running Step 5 restores them.
:::

### Step 5: Update Dependencies and Run Migrations

Update Composer dependencies:

```bash
sudo -u dreamfactory composer install --no-dev --ignore-platform-reqs
```

Run database migrations:

```bash
sudo -u dreamfactory php artisan migrate --seed --force
```

`--force` is needed when `APP_ENV=production`; without it, Laravel asks for confirmation, and a non-interactive session cancels the migration silently.

Clear the application cache and the cached configuration, routes and views:

```bash
sudo -u dreamfactory php artisan optimize:clear
```

### Step 6: Reset Ownership and Permissions

Make sure the web server can write to the storage and cache directories. Replace `dreamfactory:dreamfactory` with your installation's user and group:

```bash
sudo chown -R dreamfactory:dreamfactory storage/ bootstrap/cache/
```

```bash
sudo chmod -R 2775 storage/ bootstrap/cache/
```

Do this after the Composer and Artisan commands, so it also fixes anything they created.

### Step 7: Restart PHP-FPM and the Web Server

Restart PHP-FPM so it loads the new code. Installer-built servers enable OPcache with `opcache.validate_timestamps=0`, so until PHP-FPM is restarted it keeps serving the previous version — the API continues to report the old version number even though the upgrade has finished. Adjust the service name to your PHP version:

```bash
sudo systemctl restart php8.3-fpm
```

Then restart the web server. For Nginx (DreamFactory default):

```bash
sudo systemctl restart nginx
```

For Apache (if Apache runs PHP through PHP-FPM, restart PHP-FPM as well, as above):
```bash
sudo systemctl restart apache2
```

## Troubleshooting

### `fatal: detected dubious ownership in repository`

You are running `git` as a different user from the one that owns `/opt/dreamfactory`. Run it as the owner instead, for example `sudo -u dreamfactory git status` (see [Step 2](#step-2-prepare-for-upgrade)).

### `git checkout master` fails with `pathspec 'master' did not match`

Your install was cloned from a single release tag. Check out the target release tag instead, as described in [Step 3](#step-3-update-source-code).

### Composer Install Errors

If Composer fails with `Could not delete .../vendor/...`, part of `vendor/` is owned by another user (usually `root`, from an earlier `composer install` run as root). Composer stops part-way through, leaving `vendor/` partly updated, so fix the ownership and run the install again:

```bash
sudo chown -R dreamfactory:dreamfactory /opt/dreamfactory
```

```bash
sudo -u dreamfactory composer install --no-dev --ignore-platform-reqs
```

For other Composer errors, clear the Composer cache:

```bash
sudo -u dreamfactory composer clear-cache
```

Remove vendor directory and reinstall:

```bash
sudo rm -rf vendor/
```

```bash
sudo -u dreamfactory composer install --no-dev --ignore-platform-reqs
```

### Commercial Connectors Missing or License Shows `OPEN SOURCE`

The open source composer files were used. Copy the commercial `composer.json`, `composer.json-dist` and `composer.lock` for your target version into `/opt/dreamfactory` ([Step 4](#step-4-install-the-commercial-composer-files-commercial-installs-only)), then repeat Steps 5–7.

### `Table 'dreamfactory.cache' doesn't exist`

`CACHE_STORE` is not set in `.env`, so Laravel 13 falls back to the `database` cache store. Add `CACHE_STORE=file` (or your Redis/Memcached store) to `.env`, then run:

```bash
sudo -u dreamfactory php artisan config:clear
```

```bash
sudo systemctl restart php8.3-fpm
```

### HTTP 500 with `Failed to open stream` under `storage/framework/cache`

Cache files were created by `root`. Reset ownership as described in [Step 6](#step-6-reset-ownership-and-permissions).

### The Old Version Is Still Reported After Upgrading

PHP-FPM is still serving cached bytecode. Restart it as described in [Step 7](#step-7-restart-php-fpm-and-the-web-server).

### Migration Command Not Found

Clear compiled cache files:

```bash
sudo rm -rf bootstrap/cache/*.php storage/framework/cache/data/*
```

Retry the composer install:

```bash
sudo -u dreamfactory composer install --no-dev --ignore-platform-reqs
```

## Verification

After completing the upgrade:

1. **Check DreamFactory version and license** on **System > Config > System Info**. A commercial instance should show the same license level as before the upgrade.
2. **Test your APIs** to ensure they're functioning correctly
3. **Verify user access** and permissions are intact
4. **Check system logs** (`storage/logs/dreamfactory.log`) for any errors

---

# Major Version Migration

For major version changes or when migrating to a new server/environment, you'll need to migrate your DreamFactory instance completely. This process focuses on transferring two critical components: the `.env` file and the DreamFactory system database.

## Why These Components Matter

### `.env` File
Contains essential configuration settings including:
- The APP_KEY (critical for data encryption)
- Database credentials
- Caching preferences
- API keys
- Environmental settings

### DreamFactory System Database
Stores all your configuration data:
- User accounts
- Scripts  
- API configurations
- System-level metadata

Migrating these components ensures your new instance contains all original configurations, eliminating manual recreation.

## File Transfer Reference

:::info[CLI File Transfer Methods by Deployment Type]
<Tabs>
  <TabItem value="vm/linux" label="VM/Linux">    
    **FROM remote TO local**
    ```bash
    scp <user>@<remote-server>:/path/to/file local-destination/
    ```
    Example: `scp root@192.168.1.100:/opt/dreamfactory/.env .`
    
    **FROM local TO remote**
    ```bash
    scp local-source <user>@<remote-server>:/path/to/destination/
    ```
    Example: `scp dump.sql root@192.168.1.100:/opt/dreamfactory/`
  </TabItem>
  <TabItem value="docker" label="Docker">
    **FROM container TO local**
    ```bash
    docker cp <container_name_or_id>:/path/to/file local-destination/
    ```
    Example: `docker cp df-docker-web-1:/opt/dreamfactory/.env .`

    **FROM local TO container**
    ```bash
    docker cp local-source <container_name_or_id>:/path/to/destination/
    ```
    Example: `docker cp dump.sql df-docker-web-1:/opt/dreamfactory/`
  </TabItem>
  <TabItem value="kubernetes" label="Kubernetes">
    **FROM pod TO local**
    ```bash
    kubectl cp <namespace>/<pod-name>:/path/to/file local-destination/
    ```
    Example: `kubectl cp df-namespace/df-pod:/opt/dreamfactory/.env .`

    **FROM local TO pod**
    ```bash
    kubectl cp local-source <namespace>/<pod-name>:/path/to/destination/
    ```
    Example: `kubectl cp dump.sql df-namespace/df-pod:/opt/dreamfactory/`
  </TabItem>
</Tabs>
:::

## Migration Process

### Step 1: Back Up the .env File

Navigate to the DreamFactory root directory:

```bash
cd /opt/dreamfactory
```

Copy the `.env` file to your local machine (see [File Transfer Reference](#file-transfer-reference) for deployment-specific commands):

```bash
scp <user>@<remote-server>:/opt/dreamfactory/.env .
```

**Tip:** Store the `.env` file in a secure location to recover from any migration issues.

### Step 2: Back Up the System Database

Use the system database credentials from the `.env` file to create a backup:

:::info[Backup Methods by Database Type]
<Tabs>
  <TabItem value="mysql" label="MySQL">
    ```bash
    mysqldump -u root -p --databases dreamfactory --no-create-db > dump.sql
    ```
  </TabItem>
  <TabItem value="sqlserver" label="MS SQL Server">    
    Use SSMS (SQL Server Management Studio) to export the database to a file.
  </TabItem>
  <TabItem value="postgresql" label="PostgreSQL">
    ```bash
    pg_dump -U root -d dreamfactory -F p > dump.sql
    ```
  </TabItem>
  <TabItem value="sqlite" label="SQLite">
    ```bash
    sqlite3 dreamfactory.db ".dump" > dump.sql
    ```
  </TabItem>
</Tabs>
:::

Replace `root` with your database user and `dreamfactory` with your database name if different.

Transfer the backup file to a secure external location:

```bash
scp <user>@<remote-server>:/opt/dreamfactory/dump.sql .
```

### Step 3: Prepare the New DreamFactory Instance

1. Set up a new server with a clean operating system installation
2. Follow the [DreamFactory installation guide](/getting-started/installing-dreamfactory/) for your platform
3. Complete the initial setup by creating an administrator account (this will be replaced with migrated data)

### Step 4: Additional Configuration

#### MySQL Specific Configuration
If upgrading MySQL versions (e.g., 5.6 to 5.7+), you may need to disable strict mode by opening `config/database.php` and adding `'strict' => false` under the MySQL configuration section.

#### General Configuration
Ensure all system dependencies are up to date. DreamFactory 7.x requires PHP 8.3 or later.

### Step 5: Import the System Database

Transfer the `dump.sql` file to the new server:

```bash
scp dump.sql <user>@<new-server>:/opt/dreamfactory/
```

Clear the default database schema:

```bash
php artisan migrate:fresh
```

```bash
php artisan migrate:reset
```

Import the database backup:

:::info[Import Methods by Database Type]
<Tabs>
  <TabItem value="mysql" label="MySQL">
    ```bash
    mysql -u root -p dreamfactory < dump.sql
    ```
  </TabItem>
  <TabItem value="sqlserver" label="MS SQL Server">    
    Use SSMS (SQL Server Management Studio) to import the database from the file.
  </TabItem>
  <TabItem value="postgresql" label="PostgreSQL">
    ```bash
    psql -U root -d dreamfactory < dump.sql
    ```
  </TabItem>
  <TabItem value="sqlite" label="SQLite">
    ```bash
    sqlite3 dreamfactory.db < dump.sql
    ```
  </TabItem>
</Tabs>
:::

Run database migrations to apply schema updates:

```bash
php artisan migrate --seed
```

Edit the `.env` file and replace the APP_KEY with the value from your old instance:

```
APP_KEY=YOUR_OLD_APP_KEY_VALUE
```

Clear caches to finalize the configuration:

```bash
php artisan cache:clear
```

```bash
php artisan config:clear
```

## Configuration Notes for Laravel 13-Based Releases

:::warning[`config/cache.php` must allow class unserialization]
Laravel 13 added a `serializable_classes` key to `config/cache.php` and ships it as `false`, which prevents *any* PHP class from being restored from the cache. That default is unsafe for DreamFactory, which caches objects — database schema and event scripts among them.

Under `false`, cached objects come back as `__PHP_Incomplete_Class` and fail at the first property access. The symptom is distinctive: an endpoint answers **200 on the first request after a cache clear, then 500 on every request after it**, because the first request populates the cache and the second reads it back.

```php
// config/cache.php
'serializable_classes' => true,
```

This affects the `redis`, `file`, `database`, `array`, `dynamodb` and `storage` cache stores — all the ones that serialize through PHP. Switching stores is not a workaround.

DreamFactory's own `config/cache.php` sets `'serializable_classes' => true` from 7.7.0 onward, and an in-place upgrade that checks out the release tag installs that file. A `config/cache.php` without the key (as in 7.6.x and earlier) is also unaffected. Check the setting if your instance uses a `config/cache.php` that did not come from the DreamFactory release — for example a customized copy re-applied after the upgrade, or the stock Laravel 13 file.
:::

:::warning[`CACHE_STORE` must be set in `.env`]
From 7.7.0, `config/cache.php` falls back to the `database` cache store when `CACHE_STORE` is not set (7.6.x and earlier fell back to `file`). The DreamFactory system database has no `cache` table, so every request — including admin login — then fails with `SQLSTATE[42S02]: ... Table 'dreamfactory.cache' doesn't exist`.

Installer-built instances already set `CACHE_STORE=file`. If yours does not, add it (or `redis` / `memcached`) to `.env`, then run `php artisan config:clear` and restart PHP-FPM. This applies to both in-place upgrades and migrations that carry an older `.env` forward.
:::

## Migration Verification

Log in to the new DreamFactory instance using credentials from the migrated environment. Verify that:

1. **All user accounts** are present and accessible
2. **API configurations** are intact
3. **Scripts and custom logic** are functioning
4. **Database connections** work properly
5. **System settings** match your original configuration

**Congratulations!** Your DreamFactory instance has been successfully migrated.