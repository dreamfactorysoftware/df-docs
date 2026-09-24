---
sidebar_position: 6
title: "Deploy DreamFactory on OpenShift"
id: openshift-installation
description: "Run DreamFactory on Red Hat OpenShift under the restricted SCC: non-root image, port 8080, Helm values, Routes, and what to change from the standard Docker image."
keywords: [DreamFactory OpenShift, OpenShift API platform, restricted SCC, non-root container, Red Hat OpenShift DreamFactory, OCP Helm, DreamFactory Kubernetes]
---

# Deploy DreamFactory on OpenShift

:::caution Preview
The image in this guide is verified to run as an arbitrary non-root UID in group 0 (what OpenShift's restricted SCC enforces) on Docker, against the DreamFactory 7.7 image. It has not yet been validated on a live OpenShift cluster. Follow it, tell us what broke, and we will fix the guide. Support: support@dreamfactory.com
:::

OpenShift runs pods under a stricter policy than stock Kubernetes. Under the default `restricted-v2` Security Context Constraint (SCC):

- the container runs as a **random high UID**, not root and not the UID in your Dockerfile
- that UID is always a member of **group 0** (root group)
- **no privileged ports** (below 1024)
- **no privilege escalation** and no `chown` at runtime

The standard `dreamfactorysoftware/df-docker` image runs nginx and PHP-FPM as root on port 80, so it is refused as-is. This guide gives you a derived image that satisfies the SCC, plus the Helm values and OpenShift objects to run it.

## What changes from the Docker image

| Standard image | OpenShift image |
|---|---|
| nginx listens on 80 | listens on **8080** |
| nginx pid and temp paths under `/run` and `/var/lib/nginx` | under **`/tmp`** |
| `user www-data;` in nginx.conf | removed (non-root nginx cannot switch user) |
| PHP-FPM pool `user = www-data`, socket in `/run/php` | user/group removed, socket at **`/tmp/php-fpm.sock`** |
| entrypoint runs `chown -R www-data` on storage | removed; ownership fixed at **build time** with `chgrp 0` + `chmod g=u` |
| entrypoint starts PHP-FPM and cron via `service` | PHP-FPM started directly; **cron disabled** (use a CronJob for df-scheduler) |
| `USER root` (implicit) | `USER 1001` (any non-root UID; OpenShift overrides it anyway) |

Nothing about DreamFactory itself changes: same code, same system database, same license files, same admin UI.

## 1. Build the image

Start from a `df-docker` checkout with your three commercial composer files (`composer.json`, `composer.json-dist`, `composer.lock`) in place, as described in [Activating your license](./activating-your-license).

Add this `Dockerfile.openshift` next to the standard `Dockerfile` (also in the [df-docker repo](https://github.com/dreamfactorysoftware/df-docker)):

```dockerfile
# DreamFactory on OpenShift: non-root image and runtime configuration.
#
# Extends the standard df-docker image so it runs under OpenShift's
# `restricted` / `restricted-v2` SCC: arbitrary non-root UID, GID 0,
# no privileged ports, no chown at runtime.
#
# Build (from a df-docker checkout that already has your commercial
# composer files in place, after building the standard image):
#   docker build -f Dockerfile.openshift --build-arg BASE=df-docker-web:latest -t dreamfactory:7.7-openshift .
#
# Verified 2026-09-24 on plain Docker as `-u 123456:0` (what OpenShift does).
# Not yet run on a live OpenShift cluster.

ARG BASE=dreamfactorysoftware/df-docker:latest
FROM ${BASE}

USER root

# PHP version is discovered at build time; the 7.7 entrypoint defaults to 8.3 if unset.
RUN PHPV=$(ls /etc/php | sort -V | tail -1) && echo "$PHPV" > /etc/php-version && echo "PHP $PHPV"
ENV PHP_VERSION=8.5

# 1. nginx: unprivileged port, writable pid/temp paths, no user directive
RUN sed -i 's/listen 80;/listen 8080;/' /etc/nginx/sites-available/dreamfactory.conf \
 && sed -i 's|^pid /run/nginx.pid;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf \
 && sed -i 's/^user www-data;/# user directive removed: non-root/' /etc/nginx/nginx.conf \
 && sed -i '/^http {/a \    client_body_temp_path /tmp/nginx-client-body;\n    proxy_temp_path /tmp/nginx-proxy;\n    fastcgi_temp_path /tmp/nginx-fastcgi;\n    uwsgi_temp_path /tmp/nginx-uwsgi;\n    scgi_temp_path /tmp/nginx-scgi;' /etc/nginx/nginx.conf

# 2. php-fpm: cannot switch user when not root, so drop user/group and use a writable socket path
RUN PHPV=$(cat /etc/php-version) \
 && sed -i 's/^user = www-data/; user = (non-root)/; s/^group = www-data/; group = (non-root)/' /etc/php/$PHPV/fpm/pool.d/www.conf \
 && sed -i "s|^listen = /run/php/php$PHPV-fpm.sock|listen = /var/tmp/php-fpm.sock|" /etc/php/$PHPV/fpm/pool.d/www.conf \
 && sed -i 's/^;\?listen.owner = .*/;listen.owner/; s/^;\?listen.group = .*/;listen.group/' /etc/php/$PHPV/fpm/pool.d/www.conf \
 && sed -i 's|^pid = .*|pid = /tmp/php-fpm.pid|; s|^error_log = .*|error_log = /proc/self/fd/2|' /etc/php/$PHPV/fpm/php-fpm.conf \
 && sed -i "s|unix:/var/run/php/php[^;]*-fpm.sock|unix:/var/tmp/php-fpm.sock|g; s|unix:/run/php/php[^;]*-fpm.sock|unix:/var/tmp/php-fpm.sock|g" /etc/nginx/sites-available/dreamfactory.conf \
 && grep -q "unix:/var/tmp/php-fpm.sock" /etc/nginx/sites-available/dreamfactory.conf

# 3. Group-0 ownership on everything written at runtime. OpenShift assigns a random UID
#    that is always a member of GID 0, so g=u is the whole trick.
RUN for d in /opt/dreamfactory/storage /opt/dreamfactory/bootstrap/cache /opt/dreamfactory/.env /opt/dreamfactory/public \
             /var/lib/nginx /var/log/nginx /etc/nginx /etc/php /run /var/spool/cron /etc/cron.d /etc/ssmtp /var/tmp; do \
      [ -e "$d" ] && chgrp -R 0 "$d" && chmod -R g=u "$d"; done; \
    chgrp 0 /opt/dreamfactory && chmod g=u /opt/dreamfactory; \
    touch /opt/dreamfactory/storage/logs/dreamfactory.log \
 && chgrp 0 /opt/dreamfactory/storage/logs/dreamfactory.log && chmod g=u /opt/dreamfactory/storage/logs/dreamfactory.log

# 4. Entrypoint: no runtime chown (fails as non-root), no `service` (needs root/init).
#    Start php-fpm directly, skip cron (run df-scheduler as a CronJob instead).
RUN sed -i 's/^\(\s*\)chown -R www-data:www-data .*$/\1: # chown removed for OpenShift/' /docker-entrypoint.sh \
 && sed -i 's|^service "php${PHP_VERSION}-fpm" start|/usr/sbin/php-fpm${PHP_VERSION} --nodaemonize --fpm-config /etc/php/${PHP_VERSION}/fpm/php-fpm.conf \&|' /docker-entrypoint.sh \
 && sed -i 's|^service "\$PHP_FPM_SERVICE" start|/usr/sbin/php-fpm${PHP_VERSION} --nodaemonize --fpm-config /etc/php/${PHP_VERSION}/fpm/php-fpm.conf \&|' /docker-entrypoint.sh \
 && sed -i 's|^service cron start.*|: # cron disabled under non-root; run df-scheduler as a CronJob instead|' /docker-entrypoint.sh \
 && sed -i 's|^\(\s*\)runuser -u www-data -- "\$@"|\1if [ "$(id -u)" = "0" ]; then runuser -u www-data -- "$@"; else "$@"; fi|' /docker-entrypoint.sh \
 && sed -i 's|^\(\s*\)su -s /bin/bash www-data -c "\$(printf .%q . "\$@")"|\1"$@"|' /docker-entrypoint.sh \
 && grep -qE "php-fpm\S* --nodaemonize" /docker-entrypoint.sh \
 && grep -q 'id -u' /docker-entrypoint.sh

EXPOSE 8080
USER 1001
```

Build and push to a registry your cluster can pull from (the internal OpenShift registry, Quay, or your own):

```bash
docker build -f Dockerfile.openshift --build-arg BASE=df-docker-web:latest -t <registry>/dreamfactory:7.7-openshift .
docker push <registry>/dreamfactory:7.7-openshift
```

:::tip Test on plain Docker first
You can prove the non-root part without a cluster. This simulates what OpenShift does:
```bash
docker run --rm -u 123456:0 -p 8080:8080 \
  -e APP_KEY=base64:$(openssl rand -base64 32) \
  -e DB_CONNECTION=mysql -e DB_HOST=<mysql> -e DB_DATABASE=dreamfactory -e DB_USERNAME=<u> -e DB_PASSWORD=<p> \
  <registry>/dreamfactory:7.7-openshift
```
If the admin UI comes up at `http://localhost:8080` under UID 123456, the image is SCC-ready. `test-openshift.sh` in the df-docker repo does this end to end with a throwaway MySQL.
:::

## 2. Deploy with Helm

Use the [official Helm chart](https://github.com/dreamfactorysoftware/df-helm) with these overrides. Save as `values-openshift.yaml`:

```yaml
dreamfactory:
  image:
    repository: <registry>/dreamfactory
    tag: 7.7-openshift
  service:
    port: 8080
    targetPort: 8080
  securityContext:
    runAsNonRoot: true
    allowPrivilegeEscalation: false
    capabilities:
      drop: ["ALL"]
    seccompProfile:
      type: RuntimeDefault
  # Do NOT set runAsUser or fsGroup. OpenShift assigns both from the namespace range.
  env:
    APP_KEY: "base64:<generate once with: openssl rand -base64 32>"
    DF_LICENSE_KEY: "<your license key>"
    DB_CONNECTION: mysql
    DB_HOST: <your-mysql-host>
    DB_PORT: "3306"
    DB_DATABASE: dreamfactory
    DB_USERNAME: dreamfactory
    DB_PASSWORD: <from a Secret>
    REDIS_HOST: <your-redis-host>
    CACHE_DRIVER: redis
    SESSION_DRIVER: redis

# The chart's bundled MySQL and Redis also run as root. Disable them and
# bring your own (an OpenShift-provided MySQL, Redis Operator, or external).
mysql:
  enabled: false
redis:
  enabled: false

# Ingress is not used on OpenShift; a Route is created in step 3.
ingress:
  enabled: false
```

:::note APP_KEY
Set `APP_KEY` explicitly and keep it in a Secret. On the Docker image the entrypoint generates one on first boot, but with several replicas each pod would generate its own and the encrypted credentials in the system database would not decrypt ("The MAC is invalid"). One key, set once, shared by every replica.
:::

Install:

```bash
oc new-project dreamfactory
helm install dreamfactory ./df-helm -f values-openshift.yaml -n dreamfactory
oc get pods -n dreamfactory -w
```

If the chart version you have does not expose a `securityContext` value, add it directly to `templates/dreamfactory-deployment.yaml` under the container spec, or apply a `PodSecurityContext` with `oc patch`.

## 3. Expose it with a Route

OpenShift uses Routes instead of Ingress. Edge TLS termination at the router is the simplest and keeps certificates out of the container:

```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: dreamfactory
  namespace: dreamfactory
spec:
  host: dreamfactory.apps.<your-cluster-domain>
  to:
    kind: Service
    name: dreamfactory
  port:
    targetPort: 8080
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
```

```bash
oc apply -f route.yaml
oc get route dreamfactory -n dreamfactory
```

Because TLS terminates at the router, set `HTTPS_HEADER=on` in the DreamFactory environment (the entrypoint reads it) so generated links and CORS use `https`. See [CORS and SSL](../../system-settings/config/cors-ssl).

## 4. First admin user and license check

Browse to the Route host and create the first admin, exactly as in the [Docker guide](./docker-installation). Then confirm the license took:

```bash
oc exec deploy/dreamfactory -n dreamfactory -- php artisan df:env 2>/dev/null | grep -i license
```

or in the admin UI under System Settings, the license level should read your tier, not `OPEN SOURCE`.

## 5. Scheduler (df-scheduler)

The standard image runs cron inside the container for the scheduler service. Cron needs root, so the OpenShift image disables it. Run the scheduler as a Kubernetes CronJob instead:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: dreamfactory-scheduler
  namespace: dreamfactory
spec:
  schedule: "* * * * *"
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: scheduler
              image: <registry>/dreamfactory:7.7-openshift
              command: ["php", "/opt/dreamfactory/artisan", "schedule:run"]
              envFrom:
                - secretRef:
                    name: dreamfactory-env
```

Skip this if you do not use scheduled tasks.

## 6. Scaling

The DreamFactory container is stateless. The system database and Redis hold all shared state, so:

```bash
oc scale deploy/dreamfactory --replicas=3 -n dreamfactory
```

or add a HorizontalPodAutoscaler on CPU. Nothing else changes.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Pod `CrashLoopBackOff`, log says `nginx: [emerg] bind() to 0.0.0.0:80 failed (13: Permission denied)` | still using the standard image or `listen 80` | use the OpenShift image; check `listen 8080` |
| `nginx: [emerg] open() "/run/nginx.pid" failed (13)` | pid path not moved to `/tmp` | check the nginx.conf `pid` line |
| `ERROR: [pool www] failed to open error_log` or `unable to bind listening socket` | PHP-FPM socket or log path not writable | socket must be under `/tmp`; check `listen =` in `www.conf` |
| `chown: changing ownership ... Operation not permitted` on startup | entrypoint still runs `chown` | confirm the sed in the Dockerfile applied; `grep chown /docker-entrypoint.sh` should show only comments |
| `The MAC is invalid` after scaling or restart | replicas have different `APP_KEY` | set one `APP_KEY` in the Secret for all pods |
| `Permission denied` writing `storage/logs/dreamfactory.log` | storage not group-writable | rebuild; the `chgrp 0 && chmod g=u` step must cover `/opt/dreamfactory/storage` |
| Pod stays `Pending`, event says `unable to validate against any security context constraint` | `runAsUser` or `fsGroup` set in values | remove them; let OpenShift assign |
| Admin UI loads over `http` links behind an `https` Route | `HTTPS_HEADER` unset | set `HTTPS_HEADER=on` |

If you need to confirm which SCC admitted the pod:

```bash
oc get pod <pod> -n dreamfactory -o jsonpath='{.metadata.annotations.openshift\.io/scc}'
```

`restricted-v2` is the goal. If you see `anyuid`, someone granted the service account a broader SCC; the image above does not need it.

## Related

- [Helm chart installation](./helm-installation) for the base chart and commercial image build
- [Docker installation](./docker-installation)
- [Activating your license](./activating-your-license)
- [CORS and SSL](../../system-settings/config/cors-ssl)
