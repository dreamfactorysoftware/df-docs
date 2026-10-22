---
sidebar_position: 2
title: Updating PHP on Linux
id: updating-php-on-linux
description: "Install a PHP security release under DreamFactory on Ubuntu, Debian and RHEL-family servers, move to a supported PHP branch, and roll back if DreamFactory stops working."
keywords: [PHP update, PHP security release, PHP-FPM, Ondrej PPA, Remi, DreamFactory PHP version]
difficulty: "intermediate"
---

# Updating PHP on Linux

This guide covers PHP on Linux servers built with the DreamFactory installer or set up by hand. For Docker, see [Upgrading your Docker instance](/getting-started/installing-dreamfactory/docker-installation#upgrading-your-docker-instance). For Windows, see [Upgrading PHP on Windows](/upgrades-and-migrations/upgrading-php-on-windows).

## Which PHP versions your DreamFactory version runs on

Check this before you change PHP. If the new PHP version is outside the range for your DreamFactory version, DreamFactory stops working.

| DreamFactory version | PHP |
|---|---|
| 7.6.0 and later | 8.3 or later |
| 7.0.1 to 7.5.x | 8.3 |
| 5.0.0 to 7.0.0 | 8.1 (declared) |
| 4.x | 7.2 to 7.4 |

To find your DreamFactory version, run this from the DreamFactory root directory (usually `/opt/dreamfactory`):

```bash
grep "'version'" config/app.php
```

`php -v` shows the command line PHP. The web server can run a different build. To see the version that serves DreamFactory, see [Confirm the version your web server runs](/Security/php-cve-2026-109618-109619#confirm-the-version-your-web-server-runs).

## Install a patch release on your current branch

Use this when your PHP branch still gets security fixes, for example 8.3.35 to 8.3.36. DreamFactory does not change, and you do not need new composer files.

### Ubuntu and Debian

The DreamFactory installer gets PHP from the [Ondřej Surý PPA](https://launchpad.net/~ondrej/+archive/ubuntu/php). Update PHP and fully restart PHP-FPM. Replace `8.3` with your PHP branch:

```bash
sudo apt update
sudo apt install --only-upgrade 'php8.3*'
sudo systemctl restart php8.3-fpm
```

If your server uses Apache with `mod_php`, restart Apache instead:

```bash
sudo systemctl restart apache2
```

If `apt` times out or does not offer the new version, the PPA mirrors can lag after a security release. Wait a few minutes and run it again.

### PHP from your distribution's own repository

If your PHP comes from the standard Ubuntu, Debian or Red Hat repositories, fixes arrive as distribution security updates. These updates often keep the old version number. For example, Ubuntu 24.04 ships PHP 8.3.6 and patches it in place. Check your distribution's security notice for the fix, then install the update the same way.

### RHEL, Rocky Linux, AlmaLinux and Oracle Linux

The DreamFactory installer gets PHP from the [Remi repository](https://rpms.remirepo.net/). Use `--refresh` so `dnf` reads the latest package list instead of a cached one:

```bash
sudo dnf upgrade --refresh 'php*'
sudo systemctl restart php-fpm
```

If `dnf` times out or offers no PHP update, wait a few minutes and run it again.

If your PHP comes from the Red Hat AppStream modules instead of Remi, check with your distribution for the patch date.

:::warning[Restart, do not reload]
For PHP-FPM, a reload can leave running workers on the old code and settings. Use `restart`, then confirm the new version.
:::

## Move to a supported PHP branch

Use this when your PHP branch no longer gets security fixes, for example PHP 8.0 or 8.1, and your DreamFactory version can run on a newer branch.

1. Install PHP 8.3 or later alongside your current PHP, with the same set of PHP packages.
2. Install again any PHP extensions you added by hand, such as SQL Server or Oracle drivers, for the new PHP version. See [Installing additional drivers](/getting-started/installing-dreamfactory/installing-additional-drivers).
3. Point the web server at the new PHP. For NGINX, change the `fastcgi_pass` socket in the DreamFactory site file, for example from `unix:/var/run/php/php8.1-fpm.sock` to `unix:/var/run/php/php8.3-fpm.sock`. For Apache with `mod_php`, disable the old module and enable the new one.
4. Restart PHP-FPM and the web server, then confirm the version.
5. When DreamFactory works on the new PHP, remove the old PHP.

PHP 8.5 needs DreamFactory 7.6.0 or later. Moving to it from an earlier DreamFactory version is a DreamFactory upgrade. See [Upgrading and Migrating DreamFactory](/upgrades-and-migrations/upgrading-and-migrating-dreamfactory).

### DreamFactory 5.0.0 to 7.0.0 on PHP 8.3

These versions declare PHP 8.1. The long-term path is to upgrade DreamFactory to 7.7.1.

If you cannot upgrade DreamFactory right away, these versions can run on PHP 8.3 as a stopgap. We started DreamFactory 5.4.0 on PHP 8.3 with `composer install --ignore-platform-reqs` and confirmed that admin login and the system API work. We have not tested every connector or script type. Test your own services on a staging copy before you change production. Commercial installs need the composer files for their version; request them from DreamFactory support before you start.

### DreamFactory 4.x

DreamFactory 4.x does not run on PHP 8. Build a new DreamFactory 7.7.1 instance and move your configuration to it. See [Major Version Migration](/upgrades-and-migrations/upgrading-and-migrating-dreamfactory#migration-process).

## Roll back

If DreamFactory stops working after a PHP change, go back to the old PHP first.

- **Patch release on the same branch.** A patch release does not change what DreamFactory needs. Run `php -m` and compare the list with the extensions from before the update. Install any missing ones for the same branch, then restart PHP-FPM or Apache.
- **New branch.** Point the web server back at the old PHP-FPM socket or Apache module and restart it. Then check the table at the top of this page for a PHP version your DreamFactory version runs on.
