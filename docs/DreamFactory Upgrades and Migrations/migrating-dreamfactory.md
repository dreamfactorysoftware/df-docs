---
id: migrating-dreamfactory
title: Migrating DreamFactory
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::warning

This page is under construction.

:::
# Migrating Your DreamFactory Instance

DreamFactory often acts as a reliable "set it and forget it" platform, running seamlessly for extended periods with minimal maintenance. However, there may be scenarios where you need to migrate your DreamFactory instance to a new server or environment. This guide outlines the migration process, focusing on two critical components: the `.env` file and the DreamFactory system database.

## Why Are the `.env` File and System Database Important?

### `.env` File
The `.env` file contains essential configuration settings for your DreamFactory instance, including:
- The APP_KEY
- Database credentials
- Caching preferences
- API keys
- Other environmental settings

### DreamFactory System Database
The DreamFactory system database stores:
- User accounts
- Scripts
- API configurations
- System-level metadata

Migrating these ensures your new DreamFactory instance contains all your original configurations and data, eliminating the need for manual recreation of your environment.

---

## Step-by-Step Migration Guide

### Step 1: Back Up the `.env` File

1. Navigate to the DreamFactory root directory:  
   `cd /opt/dreamfactory`

2. Copy the `.env` file to a secure location:  
   `cp .env ~/.env`

3. Use SFTP or another tool to transfer the `.env` file to an external location for safekeeping.

**Tip:** Storing a copy of the `.env` file off-server ensures you can recover from any issues during the migration.

---

### Step 2: Back Up the System Database

1. Use the system database credentials from the `.env` file to back up the system database.

:::info[Backup Method by Database Type]
<Tabs>
  <TabItem value="mysql" label="MySQL">
    ```bash
    mysqldump -u df_admin -p --databases dreamfactory --no-create-db > ~/dump.sql
    ```
  </TabItem>
  <TabItem value="sqlserver" label="MS SQL Server">    
    ```bash
    TODO: Add MS SQL Server backup instructions
    ```
  </TabItem>
  <TabItem value="postgresql" label="PostgreSQL">
    ```bash
    pg_dump -U df_admin -d dreamfactory -F p > ~/dump.sql
    ```
  </TabItem>
  <TabItem value="sqlite" label="SQLite">
    ```bash
    sqlite3 dreamfactory.db ".dump" > ~/dump.sql
    ```
  </TabItem>
</Tabs>
:::

2. Replace `df_admin` with your database user, and `dreamfactory` with your database name (if different).

3. Transfer the backup file (`dump.sql`) to a secure external location, just as you did with the `.env` file.

---

### Step 3: Prepare the New Host Server

1. Set up a new server with a clean installation of your operating system (CentOS, Debian, Fedora, or Ubuntu).  
2. Download and run the DreamFactory Automated Installer. Follow instructions in the [installation guide](../Installing-DreamFactory/installation.md).  
3. Complete the initial setup by creating an administrator account. This account will be replaced with imported data.

---

### Step 4: Configure the New Server

#### MySQL Specific Configuration
If your old instance used MySQL and you are upgrading versions (e.g., MySQL 5.6 to 5.7+), you may need to disable strict mode:  
1. Open the `config/database.php` file.  
2. Add `'strict' => false` under the MySQL configuration section.  

#### General Configuration
Ensure all system dependencies, such as PHP, are up to date. DreamFactory supports PHP 8.1 or later.

---

### Step 5: Import the System Database Backup

1. Transfer the `dump.sql` file to the new server.  
2. Clear the default database schema:  
   - `php artisan migrate:fresh`  
   - `php artisan migrate:reset`

3. Import the database backup:  
   `mysql -u new_user -p new_database < dump.sql`

4. Run database migrations to apply schema updates:  
   `php artisan migrate --seed`

5. Clear caches to finalize the configuration:  
   - `php artisan cache:clear`  
   - `php artisan config:clear`

---

## Final Steps

Log in to the new DreamFactory instance using credentials from the migrated environment. Confirm all APIs, configurations, and users have been successfully restored.

**Congratulations!** Your DreamFactory instance has been migrated successfully.