---
sidebar_position: 2
title: Choosing and Changing the System Database
id: system-database
description: "Choose a DreamFactory system database (SQLite, MySQL/MariaDB, PostgreSQL, SQL Server), configure it in .env, and move an existing SQLite install to a production database."
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Choosing and Changing the System Database

The system database holds your DreamFactory configuration: services, roles, apps, users, scripts, and settings. It is separate from the databases you connect as services.

## Which engine should I use?

Use **SQLite for trials and development only**. For production, use **MySQL/MariaDB**, **PostgreSQL**, or **SQL Server**. SQLite is a single file with file-level locking, so concurrent writes queue up, it cannot be shared between nodes in a multi-node or HA setup, and backups mean copying a file while the application may be writing to it. A server database avoids all three problems.

MySQL/MariaDB is the engine the installer sets up by default.

## Supported engines

| Engine | `DB_CONNECTION` | Default port | PHP driver |
|---|---|---|---|
| SQLite | `sqlite` | n/a (file) | `pdo_sqlite` |
| MySQL / MariaDB | `mysql` | 3306 | `pdo_mysql` |
| PostgreSQL | `pgsql` | 5432 | `pdo_pgsql` |
| SQL Server | `sqlsrv` | 1433 | `pdo_sqlsrv` and the Microsoft ODBC driver (`msodbcsql18`) |

If the driver is missing, see [Installing Additional Drivers](/getting-started/installing-dreamfactory/installing-additional-drivers).

## Configure the `.env` file

Edit the `.env` file in the `dreamfactory` directory. Use your own host and a strong password; the values below are placeholders.

<Tabs groupId="system-db">
<TabItem value="mysql" label="MySQL / MariaDB" default>

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dreamfactory
DB_USERNAME=dfuser
DB_PASSWORD=change-me
```

</TabItem>
<TabItem value="pgsql" label="PostgreSQL">

```ini
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=dreamfactory
DB_USERNAME=dfuser
DB_PASSWORD=change-me
```

</TabItem>
<TabItem value="sqlsrv" label="SQL Server">

```ini
DB_CONNECTION=sqlsrv
DB_HOST=127.0.0.1
DB_PORT=1433
DB_DATABASE=dreamfactory
DB_USERNAME=dfuser
DB_PASSWORD=change-me
```

SQL Server needs extra steps on a new install: set `CACHE_STORE=file` before the first `php artisan` command, add `'trust_server_certificate' => true,` to the `sqlsrv` connection in `config/database.php` if the server uses a self-signed certificate, and run the migration as `db_owner`. See [Order of steps with SQL Server](/getting-started/installing-dreamfactory/air-gapped-installation#order-of-steps-with-sql-server).

</TabItem>
<TabItem value="sqlite" label="SQLite">

```ini
DB_CONNECTION=sqlite
DB_DATABASE=/opt/dreamfactory/storage/databases/database.sqlite
```

`DB_DATABASE` is the path to the file. `DF_SQLITE_STORAGE` sets the default storage location for SQLite files.

</TabItem>
</Tabs>

Optional keys: `DB_URL`, `DB_PREFIX`, and `DB_CHARSET` (not read for SQLite). MySQL only: `DB_COLLATION`, `DB_SOCKET`, `DB_READ_HOST`, `DB_WRITE_HOST`, and `MYSQL_ATTR_SSL_CA`. See [Basic Configuration](/getting-started/dreamfactory-configuration/basic-configuration) for the full parameter reference.

You can also write these values without editing the file:

```bash
php artisan df:env --db_connection=mysql --db_host=127.0.0.1 --db_port=3306 \
  --db_database=dreamfactory --db_username=dfuser --db_password='change-me'
```

## Create the empty database and user

Create the database and user on your database server before pointing DreamFactory at it.

<Tabs groupId="system-db">
<TabItem value="mysql" label="MySQL / MariaDB" default>

```sql
CREATE DATABASE dreamfactory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dfuser'@'%' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON dreamfactory.* TO 'dfuser'@'%';
FLUSH PRIVILEGES;
```

</TabItem>
<TabItem value="pgsql" label="PostgreSQL">

```sql
CREATE USER dfuser WITH PASSWORD 'change-me';
CREATE DATABASE dreamfactory OWNER dfuser;
```

</TabItem>
<TabItem value="sqlsrv" label="SQL Server">

```sql
CREATE DATABASE dreamfactory;
CREATE LOGIN dfuser WITH PASSWORD = 'change-me';
USE dreamfactory;
CREATE USER dfuser FOR LOGIN dfuser;
ALTER ROLE db_owner ADD MEMBER dfuser;
```

</TabItem>
</Tabs>

## Apply the change

On a new, empty database:

1. Update `.env` (or run `php artisan df:env`) as shown above.
2. Clear the cached configuration so the new connection is used: `php artisan config:clear`.
3. Create the schema and the first admin user: `php artisan df:setup`. (`php artisan migrate --seed` creates the schema without prompting for an admin.)
4. Clear all caches: `php artisan optimize:clear`.
5. Restart PHP-FPM and the web server. For Docker, run `docker compose up -d` so changed environment values are re-read.

## Move an existing install from SQLite to another engine

You cannot load a SQLite dump into MySQL, PostgreSQL, or SQL Server. Instead, build a fresh system database and carry your configuration across with a DreamFactory package.

1. **Export a secured package.** In the admin UI, export your services, roles, apps, users, and settings, and protect the package with a password. A secured package encrypts the system and service configuration. Keep the password; you need it to import.
2. **Back up.** Copy the `.env` file and the `.sqlite` file to a safe place.
3. **Point `.env` at the new database.** Keep the same `APP_KEY`. Do not generate a new one.
4. **Clear the cached configuration:** `php artisan config:clear`. Skip this and DreamFactory keeps using the old SQLite connection, and `df:setup` reports that the instance is already set up.
5. **Create the schema and first admin** with `php artisan df:setup`. Use a temporary admin email that is not in the package. The import skips any admin whose email already exists, so the old password would not be carried for a matching email.
6. **Import the package.** Use the admin UI, or run `php artisan df:import-pkg /path/to/package.zip --password='package-password'`.
7. **Clear the cache and restart:** `php artisan optimize:clear`, then restart PHP-FPM and the web server.

### What to check afterwards

Package export and import covers services, roles, role service access, apps, users, admins, custom settings, CORS, email templates, lookups, limits, event scripts, and files. It does not carry the `.env` file, your license, caches, logs, or anything stored outside the system database.

After the import, check each of these:

- **Service credentials.** Open each database service and confirm it connects. If it does not, re-enter the service password.
- **User passwords.** Sign in as a non-admin user. If the password does not work, reset it.
- **App API keys.** Compare each app's API key with the old one. Update any client that still uses an old key.
- **Scripts and lookups.** Confirm your event scripts and lookups arrived.

:::note
The export includes user and admin password hashes, but these checks are deliberately conservative: treat service credentials and user passwords as needing re-entry or reset until you have confirmed otherwise on your own instance. An unsecured package holds those password hashes unencrypted, so always export a secured package.
:::

## Roll back

If something goes wrong, put the original `.env` back, run `php artisan optimize:clear`, and restart PHP-FPM and the web server. The SQLite file is not modified by the move, so your original install is intact.

## Next steps

Once the new system database is running, build your first endpoint or review the upgrade guide:

- [API Builder](/api-generation-and-connections/api-builder)
- [Upgrading and Migrating DreamFactory](/upgrades-and-migrations/upgrading-and-migrating-dreamfactory)
