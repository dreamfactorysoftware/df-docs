---
sidebar_position: 4
---

# Raspberry PI installation

DreamFactory has been tested for install on Raspberry Pi 4 with 4GB of ram using the Raspberry Pi lite OS 64bit (Bookworm release 12). The install process focuses on an Nginx web server with MySql as the default database (the site is published on port 80 of the localhost).  This guide provides instructions for downloading, installing and running the necessary packages to host DreamFactory.

## Update pre-installed packages
```bash
sudo apt update
sudo apt upgrade -y
```

## Install PHP and Dependencies

First, install the lsb-release package which is needed for PHP installation (likely installed by default):
```bash
sudo apt install lsb-release
```

Add the PHP repository:
```bash
curl https://packages.sury.org/php/apt.gpg | sudo tee /usr/share/keyrings/suryphp-archive-keyring.gpg >/dev/null
```

Create the source file:
```bash
echo "deb [signed-by=/usr/share/keyrings/suryphp-archive-keyring.gpg] https://packages.sury.org/php/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/sury-php.list
```

Update the package list:
```bash
sudo apt update
```

Install required system packages:
```bash
sudo apt-get install git curl zip unzip
```

Install PHP 8.3 and required extensions:
```bash
sudo apt-get install -y php8.3-common \
    php8.3-xml \
    php8.3-cli \
    php8.3-curl \
    php8.3-mysqlnd \
    php8.3-sqlite \
    php8.3-soap \
    php8.3-mbstring \
    php8.3-zip \
    php8.3-bcmath \
    php8.3-dev \
    php8.3-ldap \
    php8.3-pgsql \
    php8.3-interbase \
    php8.3-gd \
    php8.3-sybase
```

Install Nginx and PHP-FPM:
```bash
sudo apt-get install -y nginx php8.3-fpm
```

## Configuring PHP-FPM

You will need a text editor for this task. The instructions use Nano which comes installed on RPi.

1. Edit the php-fpm php.ini file:
    ```bash
    sudo nano /etc/php/8.3/fpm/php.ini
    ```
    
2. Find the line that reads `;cgi.fix_pathinfo=1`
3. Change it to read `cgi.fix_pathinfo=0`
4. Save and exit (Ctrl+x, Y, Enter)

## Installing Additional Dependencies

Install MongoDB dependencies and extension:
```bash
sudo apt-get install php8.3-dev php-pear build-essential libssl-dev libcurl4-openssl-dev pkg-config
sudo pecl install mongodb
sudo sh -c 'echo "extension=mongodb.so" > /etc/php/8.3/mods-available/mongodb.ini'
sudo phpenmod mongodb
```
Accept all the defaults for mongodb unless you have specific reasons not to. The defaults are all proven to currently work.

Add MongoDB extension to PHP configuration:
1. Edit the php.ini file:
    ```bash
    sudo nano /etc/php/8.3/fpm/php.ini
    ```
2. Add the line `extension=mongodb` at the bottom of the file (without a preceding semicolon)

## Installing Composer

Set up Composer:
```bash
cd ~
mkdir bin
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
```

```bash
php composer-setup.php --install-dir=~/bin --filename=composer
```

After installing Composer, restart your terminal or log out and back in to ensure the changes take effect.

## Installing MariaDB

Install MariaDB server (this will be out default MySQL database):
```bash
sudo apt-get install mariadb-server -y
```

## Configuring MariaDB

1. Log into MariaDB as root:
    ```bash
    sudo mysql -uroot
    ```

2. Set the root password and create the DreamFactory database:
    ```sql
    ALTER USER 'root'@'localhost' IDENTIFIED BY '<Your password here>';
    ```
    ```sql
    FLUSH PRIVILEGES;
    ```
    ```sql
    CREATE DATABASE dreamfactory;
    ```
    Create a user to interface with the DB (default is dfadmin:dfadmin) and give them appropriate permissions:
    ```sql
    CREATE USER 'dfadmin'@localhost IDENTIFIED BY 'dfadmin';
    ```
    ```sql
    GRANT ALL PRIVILEGES ON dreamfactory.* TO 'dfadmin'@localhost IDENTIFIED BY 'dfadmin';
    ```
    ```sql
    FLUSH PRIVILEGES;
    ```
The user you create for the dreamfactory DB will need to be used when setting up dreamfactory, the default is dfadmin:dfadmin

## Installing DreamFactory

1. Create and set up the DreamFactory directory (change dfuser to your user):
    ```bash
    sudo mkdir /opt/dreamfactory
    sudo chown -R dfuser /opt/dreamfactory
    ```

2. Clone the DreamFactory repository and install dependencies:
    ```bash
    cd /opt/dreamfactory/
    git clone https://github.com/dreamfactorysoftware/dreamfactory.git ./
    composer install --no-dev --ignore-platform-reqs
    ```

3. Configure the environment:
    ```bash
    php artisan df:env
    ```
    If you are following this guide choose option "1" for mysql (mariadb).

    ![Default Database Selection](/img/rpi-install/df-installer-database.png)
    
    Fill in your first and last name, email, phone number and create user login credentials for the Web UI (**this password must be 16 characters or longer**)

    ![WEB Interface User Creation](/img/rpi-install/df-installer-user-creation.png)

4. Edit the .env file:
    ```bash
    nano .env
    ```
    - Uncomment (remove the ##) the two lines that read:
      ```
      ##DB_CHARSET=utf8
      ##DB_COLLATION=utf8_unicode_ci
      ```
    - Set the following values:
      ```
      APP_DEBUG=true
      APP_LOG_LEVEL=debug
      DF_INSTALL=rpi
      ```

5. Run the DreamFactory setup:
    ```bash
    php artisan df:setup
    ```

6. Set proper permissions (change dfuser to your user):
    ```bash
    sudo chown -R www-data:dfuser storage/ bootstrap/cache/
    sudo chmod -R 2775 storage/ bootstrap/cache/
    ```

7. Clear the cache:
    ```bash
    php artisan cache:clear
    ```
## Setting up Nginx Config

```bash
cd /etc/nginx/sites-available/
sudo cp default default.bak
sudo nano default
```

Remove all the contents located in default and replace them with:

```nginx
# Default API call rate -> Here is set to 1 per second, and is later defined in the location /api/v2 section
limit_req_zone $binary_remote_addr zone=mylimit:10m rate=1r/s;

server {
    listen 80 default_server;
    listen [::]:80 default_server ipv6only=on;
    root /opt/dreamfactory/public;
    index index.php index.html index.htm;
    
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;

    location = /50x.html {
        root /usr/share/nginx/html;
    }

    location ~ \.php$ {
        try_files $uri =404;
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }

    location ~ /web.config {
        deny all;
    }

    #By default we will limit login calls here using the limit_req_zone set above. The below will allow 1 per second over
    # 5 seconds (so 5 in 5 seconds)from a single IP  before returning a 429 too many requests. Adjust as needed.
    location /api/v2/user/session {
        try_files $uri $uri/ /index.php?$args;
        limit_req zone=mylimit burst=5 nodelay;
        limit_req_status 429;
    }

    location /api/v2/system/admin/session {
        try_files $uri $uri/ /index.php?$args;
        limit_req zone=mylimit burst=5 nodelay;
        limit_req_status 429;
    }
}
```
Restart Nginx and PHP
```bash
sudo systemctl restart nginx php8.3-fpm.service
```

## Access your new DreamFactory instance

After the services are restarted your web server should be ready to access. Go ahead and in your preffered browser type in the ip address of your Raspberry Pi and you should see the login page of the DreamFactory Web UI. To find your ip address on Raspberry Pi easily type in the command line ```hostname -I```