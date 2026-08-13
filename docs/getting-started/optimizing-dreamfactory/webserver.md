---
sidebar_position: 2
title: Optimizing the Web Server for DreamFactory
sidebar_label: "Web Server"
id: web-server
description: Tune NGINX for DreamFactory, covering upload limits, FastCGI timeouts, admin UI caching, compression, and logging.
keywords: [DreamFactory NGINX, web server tuning, client_max_body_size, fastcgi timeout, NGINX PHP-FPM, DreamFactory performance]
difficulty: "intermediate"
---

# Web Server

DreamFactory is usually served by NGINX in front of PHP-FPM, and that is the configuration this page covers. The installer writes a working virtual host for you. What follows is what each part does and when you should change it.

## The Shipped Virtual Host

The essentials of the configuration DreamFactory installs:

```nginx
upstream php_handler {
    server unix:/var/run/php/php8.5-fpm.sock;
}

server {
    listen 80;
    server_name your.host.name;
    root "/opt/dreamfactory/public";
    index index.html index.htm index.php;
    charset utf-8;
    client_max_body_size 100m;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        try_files $uri /index.php?$query_string;
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass php_handler;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_connect_timeout 60;
        fastcgi_send_timeout 180;
        fastcgi_read_timeout 180;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

Two things are load-bearing. The document root is `public`, never the application directory itself, which keeps `.env` and the source tree outside the web root. And the `try_files` fallback routes every unmatched path into `index.php`, which is how Laravel's router sees the request at all.

## Upload Limits

`client_max_body_size 100m` caps the request body NGINX will accept. Exceed it and the client gets a `413`, from NGINX, before PHP is ever involved.

This value must be kept in step with PHP. Raising uploads means changing all three:

- NGINX `client_max_body_size`
- PHP `upload_max_filesize`
- PHP `post_max_size`

The effective limit is the smallest of the three, which is why raising one and forgetting the others produces a limit nobody can find in the config they just edited. See [PHP and Laravel](php-laravel.md).

## FastCGI Timeouts

```nginx
fastcgi_connect_timeout 60;
fastcgi_send_timeout 180;
fastcgi_read_timeout 180;
```

`fastcgi_read_timeout` is the one you will meet. It is how long NGINX waits for PHP to respond, and when it expires the client gets a `504 Gateway Timeout` even though PHP is still working on the request.

Raise it when you have legitimately slow operations: a scripted service calling a slow third-party API, a large export, a bulk import. Raise PHP's `max_execution_time` to match, or you have simply moved the failure from NGINX to PHP.

Before raising either, check whether the request is slow for a fixable reason. A `504` on a database endpoint is usually a missing index, not a timeout that needs to be longer. See [Optimizing Database APIs](database.md).

## Never Cache the Admin UI Entry Point

```nginx
location = /dreamfactory/dist/index.html {
    add_header Cache-Control "no-store" always;
}
```

Keep this rule. The admin interface is an Angular application with content-hashed chunk filenames. Those hashed assets are safe to cache aggressively and should be. `index.html` is the file that points at them, so a cached copy pins users to an old build indefinitely, and the symptom is bizarre: a browser that keeps loading a version of the UI that no longer exists on the server, fixed only by a hard refresh that most users will never think to try.

If you put a CDN or reverse proxy in front of DreamFactory, carry the same rule forward there.

## Compression

JSON API responses compress extremely well, often to a fraction of their original size, and enabling compression is one of the cheapest wins available on a slow or metered network.

```nginx
gzip on;
gzip_types application/json application/javascript text/css text/plain;
gzip_min_length 1024;
```

Do not compress everything indiscriminately. Very small responses get larger, not smaller, once framing overhead is counted, which is what `gzip_min_length` guards against. Already-compressed payloads such as images or archives gain nothing and cost CPU.

## Logging

The shipped configuration sets `access_log off` and logs only errors. That is a deliberate trade: on a busy API gateway, access logging every request is a meaningful amount of disk I/O for data most operators never read.

Turn it on when you are diagnosing something:

```nginx
access_log /var/log/nginx/dreamfactory-access.log;
```

Then turn it back off, or rotate it aggressively. An API that never sleeps fills a disk faster than most people expect, and a full disk takes the instance down.

## TLS

Terminate TLS at NGINX or at a load balancer in front of it. When something else terminates TLS and forwards over plain HTTP, DreamFactory needs to be told, or it will build URLs with the wrong scheme in redirects and in generated API documentation. The shipped virtual host passes an `HTTPS` FastCGI parameter for exactly this reason.

Certificate setup is covered in [CORS and SSL](../../system-settings/config/cors-ssl.md).

## Related Reading

- [PHP and Laravel](php-laravel.md)
- [Optimizing Database APIs](database.md)
- [CORS and SSL](../../system-settings/config/cors-ssl.md)
