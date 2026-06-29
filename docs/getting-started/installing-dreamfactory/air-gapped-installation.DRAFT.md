# Air-Gapped / Offline Installation (DRAFT — verified on Oracle Linux 9)

> Status: DRAFT. Being written by verifying every step on a genuinely
> network-isolated VM. Do not publish until the "Verified" checklist at the
> bottom is complete. Target OS for this first pass: Oracle Linux 9 (RHEL 9
> family). Ubuntu/Windows variants come later.

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

## Procedure (filled in as each step is verified)

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
bundle (the target never runs `pecl`). _[exact steps appended after verification]_
> Installer note: `install_oracle()` only matches Instant Client **19/21**; with
> current IC **23.x** the glob must be widened (tracked separately).

### 2. Bundle + transfer media
The whole `bundle/` (local repo, app tarball, installer source, `oci8.so`,
install script) is written to an ISO and carried across the gap:
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

## Appendix A — Verification test rig (internal; not customer-facing)

Reproducible air-gap proof on `proxmox01`:

- **Isolated bridge** `vmbr9`: `bridge-ports none` (no uplink) = the air gap.
  Added to `/etc/network/interfaces` (backup: `interfaces.bak.airgap`), brought
  up with `ifup vmbr9` only — does not touch `vmbr0`.
- **Builder VM 280** (`df-airgap-builder`): OL9U7 cloud image, `vmbr0`
  (internet), cloud-init user `ol`. 2 cores / 4 GB.
- **Target VM 281** (`df-airgap-target`): OL9, `vmbr9` (no internet),
  `10.9.9.2/24`; verified API 200 + admin login + `oci8`.
- **Fresh re-test 2026-06-29**:
  - Builder VM 282 (`df-airgap-builder-fresh`), `vmbr0`, DHCP
    `192.168.76.121`.
  - Target VM 283 (`df-airgap-target-fresh`), `vmbr9`, static `10.9.9.3/24`,
    `df-airgap-bundle.iso` attached as virtual CD.
  - Target route table had only `10.9.9.0/24`; `curl -m 5 https://1.1.1.1`
    exited `7` (no internet path).
  - Offline install completed package install, app bootstrap, migrations, seed,
    `oci8`, and admin creation. Initial verify returned HTTP 500 until public
    directory mode and SELinux app-tree labels were corrected in
    `offline-install.sh`.
  - Final checks: `/api/v2/system/environment` HTTP 200, admin session returns
    `session_token`, `php -m | grep oci8` loaded, SELinux `Enforcing`, nginx /
    php-fpm / MariaDB active.
- **Patched script re-test 2026-06-29**:
  - Rebuilt ISO as `df-airgap-bundle-patched-20260629.iso` with SHA256
    `4a5d0a08e3d097507d072d71888be56230458a84ad51fc1a837d53a7530e2ddf`.
  - Target VM 284 (`df-airgap-target-patched`), `vmbr9`, static `10.9.9.4/24`,
    attached to the patched ISO.
  - `offline-install.sh` completed without manual repair:
    `/api/v2/system/environment` HTTP 200 and `OFFLINE INSTALL OK`.
  - Independent final checks: route table contained only `10.9.9.0/24`,
    `curl -m 5 https://1.1.1.1` exited `7`, admin session returned
    `session_token`, `php -m | grep oci8` loaded, SELinux `Enforcing`,
    `httpd_can_network_connect_db` and `httpd_can_network_connect` enabled,
    nginx / php-fpm / MariaDB active.
- **Transfer**: bundle burned to ISO (`genisoimage`), attached to target as
  virtual CD — sneakernet, read-only, realistic.

### Gotcha: harmless-looking i686 dependency noise
The 2026-06-29 bundle contained some `i686` RPMs from the builder's dependency
closure. On the fresh target, `dnf install --setopt=strict=0 "$BUNDLE"/repo/*.rpm`
printed missing 32-bit dependency messages and then skipped those `i686`
packages while installing the required `x86_64` transaction. The DreamFactory
install still verified cleanly. For customer-facing bundles, prefer filtering
unneeded `i686` packages during bundle creation so the offline install output is
less alarming.

### Gotcha: OL9/RHEL9 cloud image kernel-panics on default CPU type
Default Proxmox `kvm64`/`qemu64` lacks the **x86-64-v2** baseline that OL9's UEK
kernel + glibc hard-require. Symptom: instant `Fatal glibc error: CPU does not
support x86-64-v2` → `Kernel panic - Attempted to kill init`, which masquerades
as a network failure (no DHCP, no L2 frames — nothing reached userspace).

Fix:
```
qm set <vmid> --cpu host    # or a v2-capable model, e.g. x86-64-v2-AES
qm stop <vmid> && qm start <vmid>
```
Diagnose boot issues via serial:
```
qm set <vmid> --serial0 socket && qm stop <vmid> && qm start <vmid>
socat -u UNIX-CONNECT:/var/run/qemu-server/<vmid>.serial0 -
```
