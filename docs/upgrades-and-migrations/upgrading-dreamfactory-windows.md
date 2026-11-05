---
sidebar_position: 2
title: Upgrading DreamFactory on Windows
id: upgrading-dreamfactory-on-windows
description: "In-place upgrade of a DreamFactory 7.x installation on Windows Server with IIS: backups, Git checkout, commercial composer files, Composer, migrations, .env changes, permissions and IIS restart."
keywords: [DreamFactory upgrade, Windows Server, IIS, in-place upgrade, 7.7.1, composer, migrate]
difficulty: "intermediate"
---

# Upgrading DreamFactory on Windows

This guide upgrades an existing DreamFactory 7.x installation on Windows Server with IIS to a newer 7.x release, in place. The commands are the same ones the [Linux upgrade guide](/upgrades-and-migrations/upgrading-and-migrating-dreamfactory#upgrade-process) uses; what differs is everything around them: no `sudo` or file owner, IIS permissions instead of `chown`, and `iisreset` instead of PHP-FPM.

The procedure was validated by upgrading a commercial (Gold) 7.3.1 install to 7.7.1 on Windows Server 2025 with IIS 10, PHP 8.3.36 NTS over FastCGI and a SQLite system database, installed as described in the [Windows Installation](/getting-started/installing-dreamfactory/windows-installation) guide. The whole upgrade took about ten minutes, almost all of it in `composer install`.

:::info[Scope]
- Use this guide for **7.x to 7.x** upgrades only (for example 7.3.1 to 7.7.1). Instances on 6.x or older move to a new 7.7.1 instance with the [Major Version Migration](/upgrades-and-migrations/upgrading-and-migrating-dreamfactory#migration-process) process.
- To change only the PHP build under an existing install, for example for a PHP security release, follow [Upgrading PHP on Windows](/upgrades-and-migrations/upgrading-php-on-windows) instead.
- Read the [Upgrading to 7.7.x](/upgrades-and-migrations/upgrading-and-migrating-dreamfactory#upgrading-to-77x) notes before you start. They apply on every platform.
:::

## Prerequisites

- **PHP 8.3 or later.** 7.7.x runs on Laravel 13, which needs PHP 8.3+. Check with `php -v`; if you are on an older branch, [upgrade PHP](/upgrades-and-migrations/upgrading-php-on-windows) first and confirm DreamFactory still works before you continue.
- **Git.** The installation folder must be a Git clone (the Windows install guide creates it with `git clone`), and `git` must be on the `PATH`.
- **Composer**, installed as in the Windows install guide.
- **Commercial installs: the composer files for the target version.** Request the `composer.json`, `composer.json-dist` and `composer.lock` for the version you are upgrading *to* from DreamFactory support. Your current files define your current version only. Without the new set, `composer install` installs the open source edition and the license shows `OPEN SOURCE`.
- **An elevated prompt.** Run every command below from a **Command Prompt or PowerShell started as Administrator**, in the DreamFactory installation folder (`C:\inetpub\wwwroot\dreamfactory` in the install guide). The examples use that path; substitute yours.

Work through the [Pre-Upgrade Checklist](/upgrades-and-migrations/upgrading-and-migrating-dreamfactory#pre-upgrade-checklist) as well. The backup steps from it are repeated here in Windows form.

## Upgrade Process

### Step 1: Back Up

Copy the whole installation folder. This is the fastest rollback, because it also preserves `vendor\` and your current commercial composer files:

```powershell
robocopy C:\inetpub\wwwroot\dreamfactory C:\inetpub\wwwroot\dreamfactory.backup /E /COPYALL /R:1 /W:1 /NFL /NDL
```

`robocopy` reports exit code 1 when it copied files successfully; only codes of 8 or higher mean something failed.

Back up the system database with your database's own tool:

- **SQL Server:** SQL Server Management Studio > right-click the database > Tasks > Back Up, or `sqlcmd` with `BACKUP DATABASE`.
- **MySQL / MariaDB:** `mysqldump -u root -p dreamfactory > dreamfactory.sql`
- **SQLite:** the folder copy above already contains `database\database.sqlite`.

Then keep a separate copy of `.env`:

```powershell
copy .env .env.backup
```

### Step 2: Stop the Site (optional)

Composer replaces files under `vendor\` one package at a time, so a request that arrives mid-way can hit a mix of old and new code. Stopping the application pool avoids that at the cost of a few minutes of downtime. Replace `dreamfactory` with your pool's name:

```powershell
Import-Module WebAdministration
Stop-WebAppPool dreamfactory
```

In the validation run the site was left running during the whole upgrade and Composer did not hit any locked files, so this step is a precaution rather than a requirement.

### Step 3: Update the Source Code

Stash local changes, fetch the release tags, and check out the target version:

```powershell
cd C:\inetpub\wwwroot\dreamfactory
git stash
git fetch origin --tags
git checkout 7.7.1
```

Replace `7.7.1` with the version you are upgrading to. Checking out a tag works on every install and lets you move one version at a time if you need to.

`git stash` may print `LF will be replaced by CRLF` warnings for the composer files. They are harmless.

:::note
On a commercial install `git stash` also stashes the commercial `composer.json`, `composer.json-dist` and `composer.lock`, because they replace the open source versions tracked in the repository. That is expected; you copy in the files for the new version in the next step. Do not run `git stash pop` afterwards.
:::

### Step 4: Install the Commercial Composer Files (commercial installs only)

Copy the three files DreamFactory provided for the target version over the ones in the installation folder:

```powershell
copy C:\path\to\license-files\composer.json .
copy C:\path\to\license-files\composer.json-dist .
copy C:\path\to\license-files\composer.lock .
```

:::warning
Skip this and `composer install` quietly installs the **open source** edition: the commercial connectors (Oracle, SQL Server, Snowflake, SAML, Limits, Agents and others) disappear and **System > Config > System Info** shows the license as `OPEN SOURCE`. Copying the correct files in and re-running Step 5 restores them.
:::

### Step 5: Update Dependencies and Run Migrations

```powershell
composer install --no-dev --ignore-platform-reqs
```

```powershell
php artisan migrate --seed --force
```

`--force` is needed when `APP_ENV=production`; without it Laravel asks for confirmation and a non-interactive session cancels the migration silently.

Then clear the cached configuration, routes and views:

```powershell
php artisan optimize:clear
```

### Step 6: Update `.env`

Compare your `.env` with the `.env-dist` file of the new release and add any settings you need. One is required from 7.7.0 on:

- **`CACHE_STORE`**: Laravel 13 falls back to the `database` cache store when it is not set, and the DreamFactory system database has no `cache` table, so every request, including admin login, fails with `Table 'dreamfactory.cache' doesn't exist`. Check for it:

  ```powershell
  findstr /B CACHE_STORE .env
  ```

  If nothing is printed, add `CACHE_STORE=file` (or `redis` / `memcached` if you use one of those). A `.env` written by `php artisan df:env` on 7.3.1 or later already contains `CACHE_STORE=file`; older ones may not.

The 7.7.1 `.env-dist` adds no other keys that a 7.3.1 `.env` lacks. After editing `.env`, run `php artisan config:clear`.

### Step 7: Check Directory Permissions

Files created by `git checkout` and `composer install` inherit the permissions of their folders, so the `IIS_IUSRS` grant from the installation carries over (in the validation run, the new `vendor\` packages and `storage\framework\cache` had the inherited grant without any extra step). Re-applying it is harmless and clears up HTTP 500 errors on `storage\framework\cache` if the inheritance was ever broken:

```powershell
icacls storage /grant "IIS_IUSRS:(OI)(CI)F" /T /Q
icacls bootstrap\cache /grant "IIS_IUSRS:(OI)(CI)F" /T /Q
icacls public /grant "IIS_IUSRS:(OI)(CI)F" /T /Q
```

If the system database is SQLite, `database\` needs the same grant.

### Step 8: Restart IIS

```powershell
iisreset
```

`iisreset` restarts the application pool (including one you stopped in Step 2) and discards PHP's OPcache, so IIS serves the new code immediately. With `opcache.validate_timestamps=0` in `php.ini`, PHP keeps serving the previous version until it is restarted, and the API keeps reporting the old version number.

## Verification

1. Log in and open **System > Config > System Info**. The version should be the one you checked out, and a commercial instance should show the same license level as before (for example `GOLD`). The same values come back from `GET /api/v2/system/environment` with an admin session token.
2. Confirm nothing is left to migrate:

   ```powershell
   php artisan migrate:status | findstr Pending
   ```

   No output means every migration ran.
3. Test a few of your APIs and a user login.
4. Check `storage\logs\dreamfactory.log` for errors.

## After the Upgrade

- **Scheduled tasks** that run `php artisan schedule:run` or the scripting cleanup keep working unchanged, because the installation folder did not move.
- **MCP daemons (7.7.x).** 7.7.1 adds the System API MCP daemon (`system_mcp` service type) alongside the data MCP daemon (`mcp` service type), and both run on Node.js. Nothing else in DreamFactory depends on them; until a daemon is started, requests to its service type return a 503 with setup instructions. If you use either service type:

  1. Install a supported Node.js release. Node.js 22.23.4 or later is required, because older releases carry the Brotli decoder flaw [CVE-2026-111497](https://nvd.nist.gov/vuln/detail/CVE-2026-111497) that will not be fixed in Node.js 20 and earlier. The 64-bit MSI from [nodejs.org](https://nodejs.org/en/download) with default options is enough; open a new prompt afterwards so `node` is on the `PATH`.
  2. Start the System API daemon. It builds itself on first run and listens on `127.0.0.1:3700`:

     ```powershell
     cd C:\inetpub\wwwroot\dreamfactory\vendor\dreamfactory\df-mcp-server\scripts
     .\start-system-daemon-win.ps1
     Invoke-WebRequest -Uri http://127.0.0.1:3700/health -UseBasicParsing
     ```

  3. Start the data daemon on `127.0.0.1:8006`. The `start-daemon-win.ps1` script shipped with 7.7.1 launches `npx` with `Start-Process`, which on a standard Node.js install resolves to the extension-less `npx` shell script and opens it in Notepad instead of running it. The script still prints `Daemon started`, but nothing listens on port 8006. Until a fixed script ships, start it with `npx.cmd` from the daemon folder:

     ```powershell
     cd C:\inetpub\wwwroot\dreamfactory\vendor\dreamfactory\df-mcp-server\daemon
     npm install
     Start-Process npx.cmd -ArgumentList "tsx src/server.ts" -WorkingDirectory (Get-Location) -WindowStyle Hidden
     Invoke-WebRequest -Uri http://127.0.0.1:8006/health -UseBasicParsing
     ```

  Both daemons stop when the server restarts. To keep them running, wrap each start command in a scheduled task that runs at startup, as the install guide does for the scheduler.

## Rolling Back

Stop the application pool and any MCP daemons, rename the upgraded folder aside, and put the backup copy from Step 1 back in its place:

```powershell
Import-Module WebAdministration
Stop-WebAppPool dreamfactory
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
ren C:\inetpub\wwwroot\dreamfactory dreamfactory.failed
ren C:\inetpub\wwwroot\dreamfactory.backup dreamfactory
```

While a daemon (or any other program) holds files open under the folder, the rename fails with `Access to the path ... is denied`; stop it and retry.

Restore the system database from the backup you took (not needed for SQLite, the file came back with the folder), then run `iisreset`. Verify the version on **System > Config > System Info**. This rollback was exercised in the validation run: the restored 7.3.1 tree served the admin login and reported its original version and license straight away.

## Troubleshooting

### `Table 'dreamfactory.cache' doesn't exist`

`CACHE_STORE` is not set in `.env`. See [Step 6](#step-6-update-env), then run `php artisan config:clear` and `iisreset`.

### `composer install` fails with `Could not delete` or `Permission denied` under `vendor\`

A process still has a file open: the application pool is running, or the folder is open in an editor or Explorer. Stop the pool ([Step 2](#step-2-stop-the-site-optional)), close the other programs and run `composer install` again.

### `fatal: detected dubious ownership in repository`

The folder is owned by a different Windows account than the one running `git`. Mark it as safe and retry:

```powershell
git config --global --add safe.directory C:/inetpub/wwwroot/dreamfactory
```

### The old version is still reported after upgrading

PHP is still serving cached bytecode. Run `iisreset` ([Step 8](#step-8-restart-iis)).

### `Daemon started` but `/health` on the MCP port does not answer

The data daemon's `start-daemon-win.ps1` opened `npx` in Notepad instead of running it. Close the stray Notepad windows and start the daemon with `npx.cmd` as shown in [After the Upgrade](#after-the-upgrade).

### HTTP 500 with `Failed to open stream` under `storage\framework\cache`

The IIS identity cannot write to `storage\`. Re-apply the grants in [Step 7](#step-7-check-directory-permissions). On installs where the site's anonymous authentication uses a specific user rather than the application pool identity, that user also needs the grant.

## Related Documentation

- [Upgrading and Migrating DreamFactory](/upgrades-and-migrations/upgrading-and-migrating-dreamfactory): release notes for 7.7.x, pre-upgrade checklist, migration process
- [Upgrading PHP on Windows](/upgrades-and-migrations/upgrading-php-on-windows)
- [Windows Installation](/getting-started/installing-dreamfactory/windows-installation)
- [PHP security advisory: CVE-2026-109618 and CVE-2026-109619](/Security/php-cve-2026-109618-109619)
