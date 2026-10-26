---
sidebar_position: 3
title: "Air-Gapped / Offline Installation Guide"
id: air-gapped-installation
description: Install DreamFactory on a server with no internet access. Pre-stage all dependencies on a connected builder machine and install fully offline.
keywords: [DreamFactory offline install, air-gapped installation, isolated network, no internet install, RHEL offline install, Oracle Linux DreamFactory]
---

# Air-Gapped / Offline Installation

> Verified end-to-end on Oracle Linux 9 (RHEL 9 family) on a
> network-isolated VM with SELinux enforcing. The same procedure applies to
> other RHEL-family releases (e.g. RHEL 8.x) — the critical requirement is
> that the builder machine matches the target OS and patch level exactly.
> Ubuntu/Windows variants to follow.

## Who this is for

Environments where the DreamFactory server has **no outbound internet access**
(security policy, classified networks, locked-down enterprise). The installer's
normal flow reaches the internet in several places; this guide pre-stages every
one of those dependencies on a connected "builder" machine, bundles them, and
installs on the disconnected "target" with zero egress.

## What normally needs the internet

| Phase | Normal source | Offline plan |
|-------|---------------|--------------|
| DF source / installer | `wget` from GitHub | ship in the bundle |
| Licensed composer files | DF SFTP | obtain ahead of time (existing process) |
| Composer `vendor/` | Packagist | pre-build on the builder, ship the dir |
| OS + PHP packages | dnf/yum repos | pre-download RPMs + deps, ship them |
| Oracle Instant Client (oci8) | Oracle | ship the RPM (needed for Oracle data sources) |
| Admin UI | prebuilt in distro | nothing — no npm on the target |

The whole trick: a **connected builder that matches the target OS exactly**
produces one bundle; you carry it across the gap on media; the target installs
with its NIC unable to reach the internet.

---

## Procedure

### 1. Builder: stage everything

On an **internet-connected machine running the same OS as the target** (here:
Oracle Linux 9). All commands verified on OL 9.7/9.8.

**1a. Do a normal online install first.** This resolves the full dependency
set, builds Composer's `vendor/`, and gives you a known-good tree to harvest.
```
# non-interactive contract: admin email is required, passwords auto-generate
sudo DF_ADMIN_EMAIL=you@yourco.com DF_ADMIN_PASSWORD='<16+ chars>' \
  bash setup.sh --with-mysql
```
> **Post-install fix (OL9):** the installer leaves the php-fpm socket owned by
> `dreamfactory` while nginx runs as `nginx`, and a stock `default.d/php.conf`
> conflicts — the web UI 500s until you align them:
> ```
> sudo sed -i 's/^listen.owner = .*/listen.owner = nginx/; s/^listen.group = .*/listen.group = nginx/' /etc/php-fpm.d/www.conf
> sudo rm -f /etc/nginx/default.d/php.conf
> sudo systemctl restart php-fpm nginx
> ```
> Verify: `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/api/v2/system/environment` → `200`.

**1b. Harvest the RPM dependency closure into a local repo.**
```
sudo dnf install -y createrepo_c dnf-plugins-core
mkdir -p bundle/repo
# every package the install added, in the install time-window:
rpm -qa --qf '%{INSTALLTIME} %{NAME}\n' | awk -v s=<start> -v e=<end> '$1>=s&&$1<=e{print $2}' | sort -u > bundle/pkglist.txt
echo -e 'epel-release\nremi-release' >> bundle/pkglist.txt   # repo-release rpms the target will need
# pull each package + ALL transitive deps (safe even if target base differs):
sudo dnf download --resolve --alldeps --destdir bundle/repo $(cat bundle/pkglist.txt)
createrepo_c bundle/repo
```

**1c. Harvest the built application** (source + `vendor/`):
```
sudo tar czf bundle/dreamfactory-app.tar.gz -C /opt \
  --exclude='dreamfactory/storage/logs/*' --exclude='dreamfactory/storage/framework/cache/*' \
  dreamfactory
```

**1d. Oracle Instant Client + oci8** (only if connecting Oracle data sources).
On OL9, Instant Client comes from Oracle's own public repo (no Oracle login):
```
sudo dnf install -y oracle-instantclient-release-23ai-el9
sudo dnf download --destdir bundle/repo oracle-instantclient-basic oracle-instantclient-devel
```
`oci8` is a PECL extension that normally compiles online. For the air gap it is
**pre-compiled on the builder** and the resulting `oci8.so` is shipped in the
bundle (the target never runs `pecl`).
> Installer note: `install_oracle()` only matches Instant Client **19/21**; with
> current IC **23.x** the glob must be widened (tracked separately).

### 2. Bundle + transfer media

Add the offline install script to the bundle root. It is published alongside
this guide: [`offline-install.sh`](https://github.com/dreamfactorysoftware/df-docs/blob/main/docs/getting-started/installing-dreamfactory/offline-install.sh)
```
curl -fLo bundle/offline-install.sh https://raw.githubusercontent.com/dreamfactorysoftware/df-docs/main/docs/getting-started/installing-dreamfactory/offline-install.sh
```

The whole `bundle/` (local repo, app tarball, installer source, `oci8.so`,
`offline-install.sh`) is written to an ISO and carried across the gap:
```
genisoimage -o df-airgap-bundle.iso -R -J -V DF_AIRGAP bundle/
```
On the target this mounts read-only as virtual media (or a burned disc / USB).

### 3. Target: offline install

On the disconnected target, built from the **same OL9 base image** as the
builder, with the bundle media attached. No internet is used.

```
sudo mount -o ro /dev/sr0 /mnt/df-bundle          # the bundle ISO/USB
sudo env BUNDLE=/mnt/df-bundle \
     DF_ADMIN_EMAIL=you@yourco.com DF_ADMIN_PASSWORD='<16+ chars>' \
     bash /mnt/df-bundle/offline-install.sh
```

`offline-install.sh` (shipped in the bundle) does, in order:
1. Point dnf at a `file://` repo and **disable all online repos**.
2. `ACCEPT_EULA=Y dnf install --disablerepo='*' repo/*.rpm` — installs the whole
   closure **and** the OS-update delta in one transaction. `ACCEPT_EULA=Y` is
   required or `mssql-tools18`'s PREIN scriptlet fails on `/dev/tty`.
3. Untar the app (prebuilt `vendor/`); create the `dreamfactory` user **without
   `-m`** (`-m` clamps `/opt/dreamfactory` to 0700 and nginx can't traverse it);
   delete the builder's `.env` so fresh target DB creds are written.
4. Drop the prebuilt `oci8.so` + Instant Client libs (`ldconfig`); copy the
   builder's working nginx + php-fpm configs.
5. Create the MariaDB meta DB + user.
6. `df:env` → `df:setup` (admin) → `migrate --seed` — all offline.
7. Permissions + **SELinux** (enforcing on OL9):
   - Make `/opt/dreamfactory` and `/opt/dreamfactory/public` traversable/readable
     by nginx (`chmod 755` on both, `chmod -R a+rX public/`). Keep `.env`
     private (`0640` is fine).
   - Label `/opt/dreamfactory(/.*)?` as `httpd_sys_content_t`.
   - Label `storage/` and `bootstrap/cache` as `httpd_sys_rw_content_t` +
     `restorecon`.
   - Enable `httpd_can_network_connect_db` and `httpd_can_network_connect` (one
     `setsebool -P` per boolean — multi-arg silently no-ops).
   Without the readable app-tree label and public-dir mode fix, nginx 500s with
   `stat() "/opt/dreamfactory/public/index.php" failed (13: Permission denied)`.
   Without the writable labels/booleans, the API 500s on a Monolog write or DB
   connect.
8. Start php-fpm + nginx; verify.

> **Critical parity requirement:** the builder must be at the **same OS patch
> level** as the target. The DF installer's "Updating System" step can bump the
> builder ahead (e.g. OL9.7 → 9.8); the harvested closure then expects packages
> the target lacks (`mariadb-server` → `mysql-selinux` → a newer `selinux-policy`)
> and the install silently skips them. This guide solves it by bundling the OS
> update delta (step 1b) so the target updates itself offline.

### 4. Verify (all confirmed on a network-isolated OL9.7 VM, SELinux **Enforcing**)

- Air gap: target has **no default route** and cannot reach the internet
  (`curl https://1.1.1.1` → no route).
- `curl http://127.0.0.1/api/v2/system/environment` → **HTTP 200**.
- Admin login (`POST /api/v2/system/admin/session`) → **returns a JWT session token**.
- `php -m | grep oci8` → loaded (compiled against Instant Client 23, ready for
  Oracle data sources).

Status: **VERIFIED end-to-end, fully offline, SELinux enforcing.**

---

## Commercial installs from a prebuilt bundle (SQL Server system database)

> Verified on AlmaLinux 9.8 (SELinux enforcing) with DreamFactory 7.7.1, PHP 8.3 from
> Remi, NGINX and PHP-FPM, SQL Server 2022 as the system database, `sqlsrv`/`pdo_sqlsrv`
> 5.11.1 and `oci8` 3.4.1 built with `pecl`, and two nodes sharing one system database.

For commercial customers without internet access, DreamFactory support can provide a
prebuilt set instead of a builder machine: the DreamFactory source tarball, a `vendor/`
tarball built from your licensed composer files, the Admin UI tarball
(`public/dreamfactory/`) and the matching `composer.json` and `composer.lock`. The target
needs no Composer, npm or internet access. Install PHP, the database drivers, NGINX and
PHP-FPM first, the same way as for any RHEL install.

### Building the drivers on RHEL 9

If you compile `sqlsrv`/`pdo_sqlsrv` and `oci8` yourself, these packages are needed besides
`php-devel`, `gcc` and `make`:

| Driver | Also needs |
|--------|------------|
| `sqlsrv`, `pdo_sqlsrv` | `unixODBC-devel` and `libtool-ltdl-devel` (from the CRB repository). Without `libtool-ltdl-devel` the link step fails. |
| `oci8` with Remi PHP | `systemtap-sdt-devel`, and `export PHP_DTRACE=yes` before `pecl install oci8` |
| Oracle Instant Client 19 | `libnsl` |

### Order of steps with SQL Server

Each of these was a failure in testing when done in a different order:

1. **Set `CACHE_STORE=file` in `.env` before the first `php artisan` command.** Without it,
   Laravel uses the database cache, and on an empty system database `optimize:clear` fails
   with `Invalid object name 'cache'` before the tables exist.
2. **If SQL Server uses a self-signed certificate, add `'trust_server_certificate' => true,`
   to the `sqlsrv` connection in `config/database.php` before `php artisan key:generate`.**
   `key:generate` connects to the database. Run first, it fails with
   `certificate verify failed` and leaves `APP_KEY` empty.
3. **Run `php artisan migrate --seed` with an account that can create tables (`db_owner`),
   then switch `.env` to the runtime account** (`db_datareader` + `db_datawriter`) and run
   `php artisan config:clear`. With the runtime account the migration stops at
   `CREATE TABLE permission denied`, and the site stays down until a migration with
   `db_owner` completes. Every later upgrade that adds tables or columns needs `db_owner`
   again for the migration.
4. **Set file ownership and the SELinux labels before you open `/setup`.** On a new path,
   `restorecon` alone does not label `storage/` and `bootstrap/cache` as writable. Add the
   rules first:
   ```bash
   semanage fcontext -a -t httpd_sys_rw_content_t "/opt/dreamfactory/storage(/.*)?"
   semanage fcontext -a -t httpd_sys_rw_content_t "/opt/dreamfactory/bootstrap/cache(/.*)?"
   restorecon -R /opt/dreamfactory
   setsebool -P httpd_can_network_connect_db 1
   ```
   Otherwise every page returns HTTP 500 (`dreamfactory.log could not be opened in append
   mode: Permission denied`).
5. **Create the first admin at `/setup`.** The username needs at least 6 characters and the
   password at least 16.

### Multiple nodes

- **Every node needs the same `APP_KEY`.** Run `key:generate` on the first node only and
  copy the `APP_KEY` line to the others. A node with a different key cannot read stored
  service passwords ("The MAC is invalid").
- **Run the migration and `/setup` on one node only.** The other nodes only need the files,
  `.env`, ownership and SELinux steps.
- **Each node has its own file cache.** A change made through one node (a service password,
  a service or role edit, a package import) is not seen by the other nodes until their cache
  is cleared. In testing, node 2 kept returning HTTP 500 for a service whose password had
  been entered on node 1. After every configuration change, on every other node, run:
  ```bash
  cd /opt/dreamfactory && runuser -u <web-user> -- php artisan cache:clear
  ```
  A shared cache for all nodes (`CACHE_STORE=redis`) removes this step.

### Moving configuration from an older instance with a package

When the old instance cannot be reached from the new one, the usual route is a system
package: `GET /api/v2/system/package?system_only=true` on the old instance, set
`secured: true` and a password, `POST` it, then import the zip on the new instance. Tested
from DreamFactory 4.14.1 to 7.7.1:

- **Service passwords are never in a package, secured or not.** They export masked as
  `**********`. A secured package protects the admin and user password hashes only.
- **On 7.7.1, an Oracle service without a password aborts the whole import** with
  `Yajra\Pdo\Oci8::connectOracle(): Argument #3 ($password) must be of type string, null given`.
  Nothing from that attempt is saved. This order works:
  1. `php artisan cache:clear`. A failed attempt leaves the service cached with no password,
     and a service you then create by hand fails the same way until the cache is cleared.
  2. Create the services with stored passwords by hand, with exactly the same names and the
     real passwords.
  3. Import the package with overwrite off. Existing services are skipped by name, and roles
     attach to them.
- **Check role access after the import.** Import roles together with the services they use,
  with overwrite off, into a server where those roles do not exist yet. Then confirm that
  every row points to the intended service:
  ```sql
  SELECT r.name AS role, a.id, a.service_id, s.name AS service, a.component
  FROM role_service_access a JOIN role r ON r.id = a.role_id
  LEFT JOIN service s ON s.id = a.service_id ORDER BY r.name, a.id;
  ```
- **Keep imported passwords working.** Accounts from older versions have password hashes
  with a lower bcrypt cost. On 7.7.1, their first login replaces the password with an
  unusable value ([df-core#189](https://github.com/dreamfactorysoftware/df-core/issues/189)).
  Before any imported admin or user logs in, create `config/hashing.php`:
  ```php
  <?php
  return ['rehash_on_login' => false];
  ```
  Do not set `BCRYPT_ROUNDS` instead. That breaks the accounts created on the new instance.
- **Passwords without SMTP.** New passwords need at least 16 characters. An administrator
  can set one directly: Admin Settings > Users (or Admins) > the account > **Set Password**,
  or `PATCH /api/v2/system/user/<id>` with `{"password": "..."}`. The emailed-code reset
  needs a working email service.
