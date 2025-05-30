---
sidebar_position: 1
title: Upgrading and Migrating DreamFactory
id: upgrading-and-migrating-dreamfactory
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

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
The primary component of the `.env` file that we're interested in is the `APP_KEY`. Once we've migrated the system database, we can initilize the new DreamFactory instance with the `APP_KEY` from the old instance.

### DreamFactory System Database
The DreamFactory system database stores:
- User accounts
- Scripts
- API configurations
- System-level metadata

Migrating these ensures your new DreamFactory instance contains all your original configurations and data, eliminating the need for manual recreation of your environment.

### File Transfer Reference
:::info[CLI File Transfer Method by Deployment]
<Tabs>
  <TabItem value="vm/linux" label="VM/Linux">    
    **FROM remote TO local**
    ```bash
    scp <user>@<remote-server>:/path/to/file local-destination/
    ```
    *ex. `scp root@192.168.1.100:/opt/dreamfactory/.env .`*
    
    **FROM local TO remote**
    ```bash
    scp local-source <user>@<remote-server>:/path/to/destination/
    ```
    *ex. `scp dump.sql root@192.168.1.100:/opt/dreamfactory/`*
  </TabItem>
  <TabItem value="docker" label="Docker">
    **FROM container TO local**
    ```bash
    docker cp <container_name_or_id>:/path/to/file local-destination/
    ```
    *ex. `docker cp df-docker-web-1:/opt/dreamfactory/.env .`*

    **FROM local TO container**
    ```bash
    docker cp local-source <container_name_or_id>:/path/to/destination/
    ```
    *ex. `docker cp dump.sql df-docker-web-1:/opt/dreamfactory/`*
  </TabItem>
  <TabItem value="kubernetes" label="Kubernetes">
    **FROM pod TO local**
    ```bash
    kubectl cp <namespace>/<pod-name>:/path/to/file local-destination/
    ```
    *ex. `kubectl cp df-namespace/df-pod:/opt/dreamfactory/.env .`*

    **FROM local TO pod**
    ```bash
    kubectl cp local-source <namespace>/<pod-name>:/path/to/destination/
    ```
    *ex. `kubectl cp dump.sql df-namespace/df-pod:/opt/dreamfactory/`*
  </TabItem>
</Tabs>
:::

---

## Step-by-Step Migration Guide

### Step 1: Back Up the `.env` File

1. **Navigate to the DreamFactory root directory:**  
   ```bash
   cd /opt/dreamfactory
   ```

2. **Copy the `.env` file to a secure location/your local machine:**
   ```bash
   scp <user>@<remote-server>:/opt/dreamfactory/.env .
   ```
   *For more information on file transfer methods, see [File Transfer Reference](#file-transfer-reference)*

**Tip:** Storing a copy of the `.env` file off-server ensures you can recover from any issues during the migration.

---

### Step 2: Back Up the System Database

1. Use the system database credentials from the `.env` file to back up the system database.
    :::info[Backup Method by Database Type]
    <Tabs>
      <TabItem value="mysql" label="MySQL">
        ```bash
        mysqldump -u root -p --databases dreamfactory --no-create-db > dump.sql
        ```
      </TabItem>
      <TabItem value="sqlserver" label="MS SQL Server">    
        ```bash
        Use SSMS (SQL Server Management Studio) to export the database to a file.
        ```
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

2. Replace `root` with a different database user if desired, and `dreamfactory` with your database name (if different).

3. **Transfer the backup file (`dump.sql`) to a secure external location:**
    ```bash
    scp <user>@<remote-server>:/opt/dreamfactory/dump.sql .
    ```
    *For more information on file transfer methods, see [File Transfer Reference](#file-transfer-reference)*

---

### Step 3: Prepare the New DreamFactory Instance

1. Set up a new server with a clean installation of your operating system (Linux, Docker, Windows, etc.)
2. Follow the corresponding DreamFactory installation instructions for your operating system found in the [install guide](/getting-started/installing-dreamfactory/).  
3. Complete the initial setup by creating an administrator account. This account will be replaced with imported data.

---

### Step 4: Additional Configuration

#### MySQL Specific Configuration
If your old instance used MySQL and you are upgrading versions (e.g., MySQL 5.6 to 5.7+), you may need to disable strict mode:  
1. Open the `config/database.php` file.  
2. Add `'strict' => false` under the MySQL configuration section.  

#### General Configuration
Ensure all system dependencies, such as PHP, are up to date. DreamFactory supports PHP 8.1 or later.

---

### Step 5: Import the System Database Backup

1. **Transfer the `dump.sql` file to the new server.**
    ```bash
    scp dump.sql <user>@<new-server>:/opt/dreamfactory/
    ```
    *For more information on file transfer methods, see [File Transfer Reference](#file-transfer-reference)*

2. **Clear the default database schema:**
   ```bash
   php artisan migrate:fresh
   ```
   ```bash
   php artisan migrate:reset
   ```

3. **Import the database backup:**
    :::info[Import Method by Database Type]
    <Tabs>
      <TabItem value="mysql" label="MySQL">
        ```bash
        mysql -u root -p dreamfactory < dump.sql
        ```
      </TabItem>
      <TabItem value="sqlserver" label="MS SQL Server">    
        ```bash
        Use SSMS (SQL Server Management Studio) to import the database from the file.
        ```
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

4. **Run database migrations to apply schema updates:**
   ```bash
   php artisan migrate --seed
   ```

5. **Replace the `APP_KEY` in the `.env` file:**
   ```bash
   APP_KEY=APP_KEY_FROM_OLD_INSTANCE
   ```

6. **Clear caches to finalize the configuration:**
   ```bash
   php artisan cache:clear
   ```
   ```bash
   php artisan config:clear
   ```

---

## Final Steps

Log in to the new DreamFactory instance using credentials from the migrated environment. Confirm all APIs, configurations, and users have been successfully restored.

**Congratulations!** Your DreamFactory instance has been migrated successfully.
