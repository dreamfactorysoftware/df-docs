---
sidebar_position: 3
title: Upgrading PHP On Windows
id: upgrading-php-on-windows
description: "Steps to upgrade the PHP version on a Windows server running DreamFactory, covering backups, the NTS build, installation, and troubleshooting."
---

# Upgrading PHP on Windows

This guide walks through the process of updating the PHP version on a Windows server running DreamFactory. Follow these steps carefully to ensure a smooth upgrade process.

:::danger[Check your DreamFactory version first]
DreamFactory 4.x runs only on PHP 7.2 to 7.4. DreamFactory 5.0.0 to 7.0.0 declare PHP 8.1. DreamFactory 7.0.1 and later need PHP 8.3 or later. If the new PHP version is outside the range for your DreamFactory version, DreamFactory stops working. Read [Step 2 of the PHP security advisory](/Security/php-cve-2026-109618-109619#step-2-find-your-upgrade-path) before you start.
:::

## Prerequisites

Before beginning the update process ensure you have backed up:

- Your existing PHP folder
- Your system database
- A copy of your `.env` file


## Installation Steps

### 1. Download PHP

1. Visit the official [PHP for Windows](https://windows.php.net/download/) website
2. Download the **Non-Thread-Safe (NTS)** version for your architecture (x64 or x86)
   - Example: `php-8.3.36-nts-Win32-vs16-x64.zip`

:::tip Important
Always use the Non-Thread-Safe (NTS) version of PHP with DreamFactory on Windows.
:::

### 2. Install PHP

1. Create a new directory: `C:\PHP\php-X.X.X` (replace X.X.X with version number)
2. Extract the downloaded ZIP contents to this directory
3. Create a symlink from `C:\php` to your version-specific directory (optional, but recommended for easier management)

### 3. Configure Environment Variables

1. Open System Properties:
   ```
   Win + R → sysdm.cpl → Enter
   ```
2. Navigate to: Advanced tab → Environment Variables
3. Under System Variables:
   - Edit `Path`
   - Add new PHP directory path (e.g., `C:\PHP\php`)
   - Remove old PHP path if present
4. Verify installation:
   ```
   php -v
   ```

### 4. Configure PHP

1. Configure `php.ini`:
   - If you stay on the same PHP branch (for example 8.3), copy your existing `php.ini` from the previous installation, OR
   - Create new from `php.ini-production`:
     ```
     copy php.ini-production php.ini
     ```

2. Copy the extension DLLs you added by hand, such as `php_sqlsrv.dll`, `php_pdo_sqlsrv.dll` or `php_oci8.dll`, from the old `ext` folder. On a new PHP branch, download the builds for that branch instead.

3. Check that DreamFactory can run on the new PHP. From the DreamFactory root directory, run Composer with the new `php.exe`:
   ```
   C:\PHP\php-X.X.X\php.exe C:\ProgramData\ComposerSetup\bin\composer.phar check-platform-reqs
   ```
   Every line must report `success`. If the `php` line reports `failed`, your DreamFactory version cannot run on this PHP version. Do not switch IIS to it.

4. Enable required extensions in `php.ini`:
   - See [PHP Extensions Guide](/getting-started/installing-dreamfactory/windows-installation#installing-php) for the complete list
   - Ensure SQL Server extensions are properly configured if using [SQL Server](/getting-started/installing-dreamfactory/windows-installation#installing-sql-server-drivers-optional)

### 5. Configure IIS

1. Open IIS Manager
2. Access PHP Manager:
   - Register new PHP version: `C:\php\php-cgi.exe`
   - Verify extensions are enabled
   - Check PHP configuration status

3. Restart Services:
   ```
   iisreset
   ```

### 6. Verify Installation

1. Check PHP configuration:
   - Use PHP Manager's "Check phpinfo()"
   - Verify PHP version
   - Confirm required extensions are loaded

2. Test DreamFactory:
   - Access your DreamFactory instance
   - Check the [System Information](/getting-started/dreamfactory-configuration/basic-configuration) page
   - Verify all services are functioning

## Troubleshooting

If DreamFactory stops working after the switch, roll back first: register the `php-cgi.exe` from your old PHP folder in PHP Manager, restore the old `Path` entry and run `iisreset`.

If you encounter issues:

1. **Check PHP Version**:
   - Ensure you're using NTS version
   - Verify architecture matches (x64/x86)

2. **Verify Extensions**:
   - Review [required extensions](/getting-started/installing-dreamfactory/windows-installation#installing-php)
   - Check extension paths in `php.ini`

3. **Review Logs**:
   - Check PHP error logs
   - Review IIS logs
   - Examine DreamFactory logs

For additional help, contact [DreamFactory Support](https://www.dreamfactory.com/support).

## Related Documentation

- [Windows Installation Guide](/getting-started/installing-dreamfactory/windows-installation)
- [PHP security advisory: CVE-2026-109618 and CVE-2026-109619](/Security/php-cve-2026-109618-109619)
- [System Configuration](/getting-started/dreamfactory-configuration/basic-configuration)

