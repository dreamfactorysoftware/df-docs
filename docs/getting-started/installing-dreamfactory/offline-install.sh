#!/usr/bin/env bash
# DreamFactory air-gapped offline installer (Oracle Linux 9).
# Runs on a disconnected target built from the SAME OL9 base image as the builder.
# Requires the bundle mounted (ISO/USB). No internet access used at any point.
set -euo pipefail

BUNDLE="${BUNDLE:-/mnt/df-bundle}"
DF_ADMIN_EMAIL="${DF_ADMIN_EMAIL:?set DF_ADMIN_EMAIL=you@yourco.com}"
DF_ADMIN_PASSWORD="${DF_ADMIN_PASSWORD:?set DF_ADMIN_PASSWORD (16+ chars)}"
DF_DB="${DF_DB:-dreamfactory}"
DF_DB_USER="${DF_DB_USER:-dfadmin}"
DF_DB_PASS="${DF_DB_PASS:-$(openssl rand -hex 16)}"   # openssl: no SIGPIPE under set -o pipefail
log(){ echo -e "\n=== $* ==="; }

log "0/8 install order note"
# The bundle repo carries BOTH the DF closure AND the OS-update delta so the target
# reaches the same patch level as the builder offline. Installing the whole repo in one
# dnf transaction upgrades selinux-policy etc. AND installs mariadb-server together,
# so the (mysql-selinux if selinux-policy-targeted) rich dep resolves.

log "1/8 local repo only (no internet)"
cat >/etc/yum.repos.d/df-airgap.repo <<EOF
[df-airgap]
name=DF Airgap Bundle
baseurl=file://$BUNDLE/repo
enabled=1
gpgcheck=0
EOF
# install the entire captured closure straight from the bundle RPMs, online repos disabled.
# ACCEPT_EULA=Y: mssql-tools18's PREIN scriptlet prompts on /dev/tty and fails headless without it.
ACCEPT_EULA=Y dnf install -y --disablerepo='*' --setopt=strict=0 "$BUNDLE"/repo/*.rpm

log "2/8 lay down DreamFactory app (source + prebuilt vendor)"
tar xzf "$BUNDLE/dreamfactory-app.tar.gz" -C /opt
# NOTE: no -m. useradd -m clamps /opt/dreamfactory to 0700 -> nginx can't traverse it.
id dreamfactory &>/dev/null || useradd -r -d /opt/dreamfactory -s /sbin/nologin dreamfactory
rm -f /opt/dreamfactory/.env    # drop the builder's .env so df:env writes fresh TARGET db creds
chmod 755 /opt/dreamfactory     # nginx must traverse to public/

log "3/8 oci8 extension (prebuilt .so + Instant Client libs from repo)"
EXTDIR="$(php -r 'echo ini_get("extension_dir");')"   # php-cli only; no php-devel on target
cp "$BUNDLE/oci8/oci8.so" "$EXTDIR/oci8.so"
cp "$BUNDLE"/configs/phpd/*.ini /etc/php.d/        # includes 20-oci8.ini + all extensions
cp "$BUNDLE/oci8/oracle-instantclient.conf" /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
php -m | grep -qi oci8 && echo "oci8 loaded" || { echo "oci8 NOT loaded"; exit 1; }

log "4/8 web stack config (the builder's working nginx + php-fpm)"
cp "$BUNDLE/configs/nginx/dreamfactory.conf" /etc/nginx/conf.d/dreamfactory.conf
cp "$BUNDLE/configs/phpfpm/www.conf" /etc/php-fpm.d/www.conf
rm -f /etc/nginx/default.d/php.conf

log "5/8 MariaDB meta database"
systemctl enable --now mariadb
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`$DF_DB\` CHARACTER SET utf8 COLLATE utf8_unicode_ci;
CREATE USER IF NOT EXISTS '$DF_DB_USER'@'localhost' IDENTIFIED BY '$DF_DB_PASS';
GRANT ALL PRIVILEGES ON \`$DF_DB\`.* TO '$DF_DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL

log "6/8 DreamFactory env + bootstrap (offline artisan)"
cd /opt/dreamfactory
chown -R dreamfactory:dreamfactory /opt/dreamfactory
sudo -u dreamfactory php artisan df:env -q \
  --db_connection=mysql --db_host=127.0.0.1 --db_port=3306 \
  --db_database="$DF_DB" --db_username="$DF_DB_USER" --db_password="$DF_DB_PASS" \
  --df_install=Linux
sed -i 's/#DB_CHARSET=/DB_CHARSET=utf8/; s/#DB_COLLATION=/DB_COLLATION=utf8_unicode_ci/' .env
sudo -u dreamfactory php artisan df:setup --force --no-interaction \
  --admin_first_name=DreamFactory --admin_last_name=Admin --admin_phone=555-0100 \
  --admin_email="$DF_ADMIN_EMAIL" --admin_password="$DF_ADMIN_PASSWORD"
sudo -u dreamfactory php artisan migrate --seed --force
sudo -u dreamfactory php artisan config:clear -q
sudo -u dreamfactory php artisan cache:clear -q

log "7/8 permissions + SELinux + services"
chown -R dreamfactory:dreamfactory /opt/dreamfactory/storage /opt/dreamfactory/bootstrap/cache
chmod -R 2775 /opt/dreamfactory/storage /opt/dreamfactory/bootstrap/cache
# SELinux (enforcing on OL9): label writable dirs + allow php-fpm->mysql, or DF 500s.
if [ "$(getenforce 2>/dev/null)" != "Disabled" ]; then
  semanage fcontext -a -t httpd_sys_rw_content_t "/opt/dreamfactory/storage(/.*)?" 2>/dev/null || true
  semanage fcontext -a -t httpd_sys_rw_content_t "/opt/dreamfactory/bootstrap/cache(/.*)?" 2>/dev/null || true
  restorecon -R /opt/dreamfactory/storage /opt/dreamfactory/bootstrap/cache 2>/dev/null || true
  setsebool -P httpd_can_network_connect_db on   # one boolean per call; multi-arg silently no-ops
  setsebool -P httpd_can_network_connect on
fi
systemctl enable --now php-fpm nginx
systemctl restart php-fpm nginx
sleep 3

log "8/8 verify (no internet used)"
code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/api/v2/system/environment)"
echo "API /api/v2/system/environment -> HTTP $code"
echo "DB password: $DF_DB_PASS"
[ "$code" = "200" ] && echo "OFFLINE INSTALL OK" || { echo "FAILED"; exit 1; }
