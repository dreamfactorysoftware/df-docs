---
sidebar_position: 1
title: Upgrading and Migrating DreamFactory
id: upgrading-and-migrating-dreamfactory
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Upgrading and Migrating DreamFactory

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
- **Permissions**: Proper file permissions on storage and cache directories

## Upgrade Process

### Step 1: Create Backups

Navigate to one level above your DreamFactory directory (typically `/opt/dreamfactory`) and create a file backup:

```bash
cd /opt
cp -r dreamfactory dreamfactory.backup
```

Create a database backup, reference for methods found [here](#step-2-back-up-the-system-database).

### Step 2: Prepare for Upgrade

Navigate to your DreamFactory installation directory:

```bash
cd /opt/dreamfactory
```

Stash any local changes to preserve modifications:

```bash
git stash
```

### Step 3: Update Source Code

Switch to the master branch:

```bash
git checkout master
```

Pull the latest version:

```bash
git pull origin master
```

### Step 4: Update Dependencies and Permissions

Set proper permissions on cache directories. Replace `{web-service-user}` with your web server user (e.g., `www-data`, `dreamfactory`) and `{your-user-group}` with your user group:

```bash
sudo chown -R {web-service-user}:{your-user-group} storage/ bootstrap/cache/
```
*e.g., `sudo chown -R dreamfactory:dreamfactory storage/ bootstrap/cache/`*

```bash
sudo chmod -R 2775 storage/ bootstrap/cache/
```

Update Composer dependencies:

```bash
composer install --no-dev --ignore-platform-reqs
```

Run database migrations:

```bash
php artisan migrate --seed
```

Clear application cache and config:

```bash
php artisan cache:clear
```
```bash
php artisan config:clear
```

### Step 5: Restart Web Server

For Nginx (DreamFactory default)

```bash
sudo systemctl restart nginx
```

For Apache:
```bash
sudo systemctl restart apache2
```

## Troubleshooting

### Composer Install Errors

Clear Composer cache:

```bash
composer clear-cache
```

Remove vendor directory and reinstall:

```bash
rm -rf vendor/
```

```bash
composer install --no-dev --ignore-platform-reqs
```

### Permission Issues

Reset permissions on critical directories:

```bash
sudo chown -R {web-service-user}:{your-user-group} storage/ bootstrap/cache/
```
*e.g., `sudo chown -R dreamfactory:dreamfactory storage/ bootstrap/cache/`*

```bash
sudo chmod -R 2775 storage/ bootstrap/cache/
```

### Migration Command Not Found

Clear compiled cache files:

```bash
rm -rf bootstrap/cache/compiled.php storage/framework/cache/*
```

Retry the composer install:

```bash
composer install --no-dev --ignore-platform-reqs
```

## Verification

After completing the upgrade:

1. **Check DreamFactory version** in the admin interface
2. **Test your APIs** to ensure they're functioning correctly  
3. **Verify user access** and permissions are intact
4. **Check system logs** for any errors

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
Ensure all system dependencies are up to date. DreamFactory supports PHP 8.1 or later.

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

## Migration Verification

Log in to the new DreamFactory instance using credentials from the migrated environment. Verify that:

1. **All user accounts** are present and accessible
2. **API configurations** are intact
3. **Scripts and custom logic** are functioning
4. **Database connections** work properly
5. **System settings** match your original configuration

**Congratulations!** Your DreamFactory instance has been successfully migrated.