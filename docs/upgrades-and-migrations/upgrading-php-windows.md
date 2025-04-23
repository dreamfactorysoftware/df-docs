---
sidebar_position: 3
title: Upgrading PHP On Windows
id: upgrading-php-on-windows
---

# Upgrading PHP on Windows

This guide walks through the process of updating the PHP version on a Windows server running DreamFactory. Follow these steps carefully to ensure a smooth upgrade process.

## Prerequisites

Before beginning the update process ensure you have backed up:

- Your existing PHP folder
- Your system database
- A copy of your `.env` file


## Installation Steps

### 1. Download PHP

1. Visit the official [PHP for Windows](https://windows.php.net/download/) website
2. Download the **Non-Thread-Safe (NTS)** version for your architecture (x64 or x86)
   - Example: `php-8.2.25-nts-Win32-vs16-x64.zip`

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
   - If you are on the same major versio nof PHP you can copy your existing `php.ini` from the previous installation, OR
   - Create new from `php.ini-production`:
     ```
     copy php.ini-production php.ini
     ```

2. Enable required extensions in `php.ini`:
   - See [PHP Extensions Guide](/Installing%20DreamFactory/windows-installation#php-extensions) for the complete list
   - Ensure SQL Server extensions are properly configured if using [SQL Server](/Installing%20DreamFactory/windows-installation#installing-sql-server-drivers)

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
   - Check the [System Information](/Administering%20DreamFactory/system-info) page
   - Verify all services are functioning

## Troubleshooting

If you encounter issues:

1. **Check PHP Version**:
   - Ensure you're using NTS version
   - Verify architecture matches (x64/x86)

2. **Verify Extensions**:
   - Review [required extensions](/Installing%20DreamFactory/windows-installation#php-extensions)
   - Check extension paths in `php.ini`

3. **Review Logs**:
   - Check PHP error logs
   - Review IIS logs
   - Examine DreamFactory logs

For additional help, see our [Troubleshooting Guide](/Troubleshooting/common-issues) or contact [DreamFactory Support](https://www.dreamfactory.com/support).

## Related Documentation

- [Windows Installation Guide](/Installing%20DreamFactory/windows-installation)
- [PHP Requirements](/Installing%20DreamFactory/requirements#php-requirements)
- [Upgrading to PHP 8.1](/DreamFactory%20Upgrades%20and%20Migrations/upgrading-to-php-8_1)
- [System Configuration](/Configuring%20DreamFactory/config-options)

