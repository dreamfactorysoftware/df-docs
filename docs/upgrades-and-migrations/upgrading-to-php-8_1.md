---
sidebar_position: 2
title: Upgrading to PHP 8.1
id: upgrading-to-php-8.1
---

# Upgrading to PHP 8.1

:::info 
Estimated Upgrade Time: 1.5 Hours
:::

DreamFactory is committed to making the shift from PHP 7.2 to PHP 8.1 as simple as possible. Some services have undergone significant changes as a result of third-party API providers. We have compiled a list of all services that have experienced noticeable changes, which you can find below. While it's not necessary to update all of these services, if you are using any of them, we recommend that you review the relevant section to expedite the development of your dream API.

:::warning
This article assumes that you are not using our automatic installers. However, if you have a different operating system or prefer not to handle the installation process manually, you can refer to the relevant guide [here](/getting-started/installing-dreamfactory/). Note that these steps are intended for those using the [_Supported Ubuntu Release_](https://wiki.ubuntu.com/Releases).
:::

## Switch to PHP 8.1
This section demonstrates how to migrate from PHP 7.4 to PHP 8.1 on Ubuntu 20.04.

1. Add PPA:

```bash
sudo add-apt-repository ppa:ondrej/php -y
```

2. Install PHP 8.1 and the required dependencies:

```bash
sudo apt-get install -y php8.1-common \
php8.1-xml \
php8.1-cli \
php8.1-fpm \
php8.1-curl \
php8.1-mysqlnd \
php8.1-sqlite \
php8.1-soap \
php8.1-mbstring \
php8.1-zip \
php8.1-bcmath \
php8.1-dev \
php8.1-ldap \
php8.1-pgsql \
php8.1-interbase \
php8.1-gd \
php8.1-sybase
```

3. After successful installation, manually switch to PHP 8.1:

```bash
sudo update-alternatives --set php /usr/bin/php8.1 \
sudo update-alternatives --set phar /usr/bin/phar8.1 \
sudo update-alternatives --set phar.phar /usr/bin/phar.phar8.1 \
```

4. Select the version of PHP you need by using:

```bash
sudo update-alternatives --config php
```

:::warning
If you would like to know how to install the dependencies for the DreamFactory packages that you are interested in, you can refer to the table of contents below for guidance.

Command `pecl install` may fail with a message like:

`pecl/sqlsrv is already installed and is the same as the released version 5.10.1 install failed`

In this case use force install: `pecl install -f <extension_name>`
:::

### Configure NGINX
If you are using FastCGI Process Manager (FPM) with NGINX or Apache, you must update your DreamFactory installation's host configuration. To update the configuration for NGINX, modify the version of PHP specified in the Nginx server configuration file, which is located at `/etc/nginx/sites-available/default`.

```diff
-fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
+fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
```

Now you can update your DreamFactory instance to the latest version. 

1. Use the `git pull` command from the DreamFactory root directory. 
2. Next, run the `composer install` command. 
3. To complete the process, restart `fpm` and `nginx`:

```bash
sudo service php8.1-fpm restart && service nginx restart
```

## Table of contents

#### Free Plan
* [Cassandra](#cassandra)
* [Couchbase](#couchbase)
* [Email](#email)
* [Firebird](#firebird)
* [GitHub](#github)
* [Mongo logs](#mongo-logs)

#### Paid Plan
* [Apache Hive](#apache-hive)
* [Azure Active Directory](#azure-active-directory)
* [IBM Db2](#ibm-db2)
* [IBM Informix](#ibm-informix)
* [LDAP & Active Directory](#ldap--active-directory)
* [MQTT](#mqtt)
* [Oracle](#oracle)
* [SAP SQL Anywhere](#sap-sql-anywhere)
* [Snowflake](#snowflake)
* [SQL Server](#microsoft-sql-server)

### Cassandra
**Likelihood Of Impact: High**

To use the Cassandra service, you must recompile the driver and install the client library if you haven’t already.

[Download](https://github.com/datastax/cpp-driver/releases/tag/2.16.2) and extract the client library for Apache Cassandra. From the downloaded repository, run the following commands:

```bash
sudo apt install -y --no-install-recommends libgmp-dev libpcre3-dev libssl-dev libuv1-dev cmake
```

```bash
mkdir build       &&\
pushd build       &&\
cmake ..          &&\
make              &&\
sudo make install &&\
popd
```

[Download](https://github.com/nano-interactive/ext-cassandra/tree/v1.3.x) the DataStax PHP Driver for Apache Cassandra. **Make sure that you are on the 1.3.x branch.** From the downloaded repository, run the following command:

```bash
# Currently, we are using a specific version of the repository that is still functional, 
# as the recent efforts to enhance the installation process do not work properly.
git checkout 1cf12c5ce49ed43a2c449bee4b7b23ce02a37bf0 &&\
pushd ext         &&\
phpize            &&\
popd              &&\
mkdir build       &&\
pushd build       &&\
../ext/configure  &&\
make              &&\
sudo make install &&\
popd
```

Make sure `cassandra.so` is built.

```
find /usr/lib/php/20210902/cassandra.so
```

If `cassandra.so` exists, connect it to PHP's modules.

```
echo 'extension=cassandra.so' | sudo tee /etc/php/8.1/mods-available/cassandra.ini
sudo phpenmod -v 8.1 -s ALL cassandra
```

### Couchbase
**Likelihood Of Impact: High**

With the new release of DreamFactory, we removed Couchbase from the list of supported services. There is a possibility that support for Couchbase may be reinstated in a future release.

### Email
**Likelihood Of Impact: Low**

The Mandrill & SparkPost mail drivers have been [removed from Laravel 6](https://laravel.com/docs/6.x/upgrade). These services have technically not been supported by DreamFactory since its migration to Laravel 6. For this reasone these services are no longer displayed in the **Services** tab.

### Firebird
**Likelihood Of Impact: High**

If you are using Firebird with major version 3, then it must be at least version 3.0.4. This is due to usage of the [LOCALTIMESTAMP parameter](https://firebirdsql.org/file/documentation/chunk/en/refdocs/fblangref40/fblangref40-contextvars-localtimestamp.html).

To use the Firebird service, you need to install/recompile a driver compatible with PHP 8.1. Use [`--with-pdo-firebird`](https://www.php.net/manual/en/ref.pdo-firebird.php) to install the PDO Firebird extension or install `php81-interbase` package from [ppa:ondrej/php](#installing-the-php-extension).

### GitHub
**Likelihood Of Impact: Medium**

DreamFactory provided the ability to authenticate through the REST API using an account password or personal access token to perform authenticated API operations on GitHub.com. Beginning November 13th, 2020, GitHub announced that they no longer accept account passwords when authenticating via the REST API and require the use of token-based authentication. If you have a registered DreamFactory GitHub service, ensure to specify a personal access token. For more information, follow the Deprecating password authentication information found [here](https://developer.github.com/changes/2020-02-14-deprecating-password-auth/).

### Mongo logs
**Likelihood Of Impact: Low**

DreamFactory supports a very simple solution for logging all requests. All records requested in the API are written to the database. The implication is that DreamFactory relies on [MongoDB PHP driver](https://www.mongodb.com/docs/drivers/php/). You can easily install the required dependency with [pecl](https://pecl.php.net/package/mongodb). After that, run these two commands:

```bash
echo 'extension=mongodb.so' | sudo tee /etc/php/8.1/mods-available/mongodb.ini
sudo phpenmod -s ALL mongodb
```
### Apache Hive
**Likelihood Of Impact: High**

In order to use the service, you must have both the [PDO](https://www.php.net/manual/en/pdo.installation.php) and [ODBC](https://www.php.net/manual/en/odbc.installation.php) PHP extensions installed, which are available for download from [this PPA](#installing-the-php-extension) with the names `php8.1-pdo` and `php8.1-odbc`, respectively. Additionally, the MapR ODBC Driver must be installed, which you can obtain by downloading from this [link](https://docs.datafabric.hpe.com/70/Hive/install-hive_odbc_connector_linux.html) or through the Amazon cloud, as we do. To install MapR ODBC Driver run:

```bash
cd /opt \
&& sudo curl --fail -O https://odbc-drivers.s3.amazonaws.com/apache-hive/maprhiveodbc_2.6.1.1001-2_amd64.deb \
&& sudo dpkg -i maprhiveodbc_2.6.1.1001-2_amd64.deb \
&& test -f /opt/mapr/hiveodbc/lib/64/libmaprhiveodbc64.so \
&& rm maprhiveodbc_2.6.1.1001-2_amd64.deb
```

Note that it's crucial to install the extension using a specific path. So the full path to the driver must be - `/opt/mapr/hiveodbc/lib/64/libmaprhiveodbc64.so`

### Azure Active Directory
**Likelihood Of Impact: Low**

Microsoft announced that Azure AD Graph has been deprecated as of June 30, 2023. For this reason, DreamFactory migrated towards Microsoft Graph. For more information, follow the details available [here](https://techcommunity.microsoft.com/t5/microsoft-entra-azure-ad-blog/microsoft-entra-change-announcements-september-2022-train/ba-p/2967454).

### IBM Db2
**Likelihood Of Impact: High**

DreamFactory services that work with IBM databases use software that can be loaded from [ibm.com](https://www.ibm.com/us-en/). This section is appointed for a self-hosted environment. To make DreamFactory work with the IBM Db2, you need to complete the following steps:

Sign in to your [IBM](https://www.ibm.com/us-en/) account, or create a new one. Download the client driver package:

https://epwt-www.mybluemix.net/software/support/trial/cst/programwebsite.wss?siteId=853&h=null&p=null

Extract the downloaded file. From the “dsdriver” subdirectory, generate “*db2profile*” and “*db2cshrc*” script files:

```bash
sudo -s \
&& tar -xvf ibm_data_server_driver_package_linuxx64_v11.5.tar.gz -C /opt/ \
&& cd /opt/dsdriver \
&& apt install -y ksh \
&& ./installDSDriver
```

Set the environment variables using:

```
source db2profile (for the Bash or Korn shell)
source db2cshrc (for the C shell)
```

Clone the PDO_IBM [source code from GitHub](https://github.com/php/pecl-database-pdo_ibm). **Note that this must be done from the same terminal since db2profile | db2cshrc sets the environment variables in the current terminal session.**

```bash
git clone https://github.com/php/pecl-database-pdo_ibm /opt/PDO_IBM && \
cd /opt/PDO_IBM
```

From the cloned repository run:

```bash
export CPATH=/opt/dsdriver/include
```

```bash
phpize \
&& ./configure --with-pdo-ibm=/opt/dsdriver \
&& make \
&& make install \
&& exit
```

Check for the presence of `pdo_ibm.so`:

```bash
find "/usr/lib/php/20210902/pdo_ibm.so"
```

If `pdo_ibm.so` exists, connect it to PHP's modules:

```bash
echo 'extension=pdo_ibm.so' | sudo tee /etc/php/8.1/mods-available/pdo_ibm.ini && \
sudo phpenmod -v 8.1 -s ALL pdo_ibm
```

### IBM Informix
**Likelihood Of Impact: High**

DreamFactory services that work with IBM databases use software that can be loaded from [ibm.com](https://www.ibm.com/us-en/). This section is appointed for a self-hosted environment. To make DreamFactory work with the IBM Informix, you need to take the following steps:

Sign in to your [IBM](https://www.ibm.com/us-en/) account or create a new one. Download the [Informix Client SDK](https://www.ibm.com/support/pages/informix-client-software-development-kit-client-sdk-and-informix-connect-system-requirements).

<u>Download Informix Client SDK</u> ➜ <u>IBM Informix Client SDK downloads</u> ➜ *Fill out the form* ➜ *Select appropriate version* ➜ *Download tar file*

SDK may require you to install `libncurses.so.5`:

```
sudo add-apt-repository universe
sudo apt update
sudo apt install libncurses5 libncurses5:i386
```

Extract and install the SDK:

```
sudo -s
tar -xvf your_archive
./installclientsdk
```

Now we have two options to install `pdo_informix.so`: using `pecl` or by building it manually. We prefer the second method since we have had limited success with the `pecl` method.

Download the [PDO_INFORMIX](https://pecl.php.net/package/pdo_informix) archive and extract it. From the extracted _PDO_INFORMIX-1.3.x_ folder run:

```bash
phpize \
&& ./configure --with-pdo-informix=/opt/IBM/Informix_Client-SDK \
&& make \
&& make install \
&& exit
```

If you decide to test your luck, and install [PDO_INFORMIX](https://pecl.php.net/package/pdo_informix) using `pecl`, run:

```bash
sudo pecl install PDO_INFORMIX
```

Set the environment variables in `.profile`, and open the file for editing with:

```bash
sudo nano ~/.profile
```

Add the following lines to the bottom of the file:

```
export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:/opt/IBM/Informix_Client-SDK/lib:/opt/IBM/Informix_Client-SDK/lib/esql" 
export INFORMIXDIR="/opt/IBM/Informix_Client-SDK"
```

Make sure `pdo_informix.so` is built using:

```bash
find /usr/lib/php/20210902/pdo_informix.so
```

If `pdo_informix.so` exists, connect it to PHP's modules with:

```bash
echo 'extension=pdo_informix.so' | sudo tee /etc/php/8.1/mods-available/pdo_informix.ini && \
sudo phpenmod -v 8.1 -s ALL pdo_informix
```

### LDAP & Active Directory
**Likelihood Of Impact: Low**

DreamFactory uses [Lightweight Directory Access Protocol](https://www.php.net/manual/en/book.ldap.php) to lookup information or devices within a network. Therefore, to continue working with these services, you need to install the LDAP [extension](https://www.php.net/manual/en/ldap.installation.php) for the new version of PHP. For a quick setup, see the ['Installing the PHP extension'](#installing-the-php-extension) section.

### MQTT
**Likelihood Of Impact: Low**

Previously, the MQTT service relied on the [Mosquitto-PHP](https://github.com/mgdm/Mosquitto-PHP) extension, which in turn relies upon the [libmosquitto](https://mosquitto.org/) library. This service no longer depends on the system's needs and contains everything needed to work on its own.

### Oracle
**Likelihood Of Impact: High**

:::tip
This section shows the minimum number of steps to set up required dependencies so that DreamFactory can work with Oracle. For a complete setup, follow the [official guide](https://www.oracle.com/database/technologies/releasenote-odbc-ic.html).
:::

To use the Oracle service, you need to install the new version of the `oci8` extension compatible with PHP 8.1. You can seamlessly install the required extension version you need via [pecl](https://pecl.php.net/package/oci8). But before installation, you need to go through a few more steps:

Download the desired Instant Client and the corresponding SDK Package. This example uses the RPM packages.

https://www.oracle.com/database/technologies/instant-client/downloads.html

Install the necessary dependencies using:

```bash
sudo apt install -y alien libaio1
```

Install the Oracle client packages, which can take a few minutes, with this command:

```
sudo alien -i oracle-instantclient-basic-21.9.0.0.0-1.el8.x86_64.rpm
sudo alien -i oracle-instantclient-devel-21.9.0.0.0-1.el8.x86_64.rpm
```

Now you are ready to install the `oci8` extension. The latest version is compatible with PHP 8.1 at present, but you may need to specify the version explicitly.

```
sudo pecl install oci8 (php 8.1 exactly what we need)
sudo pecl install oci8-2.2.0 (php 7)
```

Once complete, make sure that OCI is loaded:

```bash
php -m | grep oci8

#oci8
```

If you do not see `oci8` in PHP's modules, ensure that the configuration file and the OCI shared library file are plugged in.

Check for the presence of `osi8.so`:

```bash
find "/usr/lib/php/20210902/oci8.so"
```

If `osi8.so` exists, connect it to PHP's modules by running:

```bash
echo 'extension=oci8.so' | sudo tee /etc/php/8.1/mods-available/oci8.ini && \
sudo phpenmod -v 8.1 -s ALL oci8
```

### SAP SQL Anywhere
**Likelihood Of Impact: High**

To complete this process, install the Sybase module from PPA. See the [how to add PPA to your Apt repositories](#installing-the-php-extension) section. This package provides `php8.1-pdo-dblib`, which is what is needed.

```bash
sudo apt install php8.1-sybase
```

Once complete, make sure that the driver is installed successfully. Confirm both PDO and the pdo_dblib extensions are present:

```bash
php -m
...
#PDO
#pdo_dblib
...
```

### Snowflake
**Likelihood Of Impact: High**

To use the Snowflake service, you need to recompile the `pdo_snowflake` driver using the new PHP version. After completion, make sure the module is installed into the proper extensions directory. For more infomation you can access the official guide [here](https://github.com/snowflakedb/pdo_snowflake).

### Microsoft SQL Server
**Likelihood Of Impact: High**

> To use a Microsoft SQL Server database, you should ensure that you have the sqlsrv and pdo_sqlsrv PHP extensions installed, as well as any dependencies they may require such as the Microsoft SQL ODBC driver.

Install ODBC libraries for UNIX from the [Microsoft repository](https://learn.microsoft.com/en-us/windows-server/administration/linux-package-repository-for-microsoft-software):

```bash
sudo apt install -y unixodbc-dev
```

If you are encountering issues with the `unixodbc-dev` package, it may be due to a recent release. As a workaround, you can lock the package version to a stable one (e.g. v2.3.7) until a fix is released. For more details, refer to the relevant [issue](https://github.com/microsoft/linux-package-repositories/issues/36).

Install [sqlsrv](https://pecl.php.net/package/sqlsrv) and [pdo_sqlsrv](https://pecl.php.net/package/pdo_sqlsrv) from pecl:

```
sudo pecl install sqlsrv
sudo pecl install pdo_sqlsrv
```

Check for the presence of `sqlsrv` and `pdo_sqlsrv`:

```
find "/usr/lib/php/20210902/sqlsrv.so"
find "/usr/lib/php/20210902/pdo_sqlsrv.so"
```

If you get both SO files, connect it to PHP's modules:

```
echo 'extension=sqlsrv.so' | sudo tee /etc/php/8.1/mods-available/sqlsrv.ini
sudo phpenmod -v 8.1 -s ALL sqlsrv

echo 'extension=pdo_sqlsrv.so' | sudo tee /etc/php/8.1/mods-available/pdo_sqlsrv.ini
sudo phpenmod -v 8.1 -s ALL pdo_sqlsrv
```

Finally, install the Microsoft ODBC driver for SQL Server following the [official guide](https://learn.microsoft.com/en-us/sql/connect/odbc/linux-mac/installing-the-microsoft-odbc-driver-for-sql-server?view=sql-server-ver16#ubuntu18), or using the [Microsoft repository](https://pkgs.org/search/?q=msodbcsql).

### Installing the PHP extension

Installation of the necessary dependencies can be quite an agonizing process, so concerned people make this process as painless as possible. [Ondřej Surý](https://deb.sury.org/) maintains the repository with PHP packages and is a very well-respected contributor to the PHP community. See how you can install the required PHP dependencies in three easy steps.

First add [`ppa:ondrej/php`](https://launchpad.net/~ondrej/+archive/ubuntu/php) to our APT repositories with:

```bash
sudo add-apt-repository ppa:ondrej/php
```

Update list of available packages:

```bash
sudo apt update
```

Install the required dependency. In this example, we demonstrate the installation of the [LDAP](https://www.php.net/manual/en/book.ldap.php) extension:

```bash
sudo apt install php8.1-ldap
```