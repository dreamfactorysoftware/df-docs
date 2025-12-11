---
sidebar_position: 6
title: Installing Additional Drivers
id: installing-additional-drivers
---

# Installing Additional Drivers

The DreamFactory installer supports the installation of additional database drivers that are not included by default due to licensing restrictions. This guide covers how to enable Oracle and Simba Trino ODBC drivers during the installation process.

## Enabling Oracle

Selecting option 1 at the initial menu prompt will result in installation of PHP's Oracle (oci8) extension. You will need to supply commercial license files to enable this functionality. If you choose this option you'll be prompted to identify the location of the the Oracle instant client zip files by providing an absolute path. Due to licensing restrictions we are unable to include these files with the installer, however you can download these files from [here](https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html).

After navigating to the Oracle website you'll want to download the basic and sdk instant client files:

- `instantclient-basic-linux.x64-21.9.0.0.0dbru.zip`
- `instantclient-sdk-linux.x64-21.9.0.0.0dbru.zip`

For RPM based systems you'll want to download these files:

- `oracle-instantclient-basic-21.9.0.0.0-1.el8.x86_64.rpm`
- `oracle-instantclient-devel-21.9.0.0.0-1.el8.x86_64.rpm`

You should not unzip these files. Just upload them to your server and write down the absolute path to their location as you'll need to supply this path during the installation process.

The script was tested using Oracle driver versions 19.18 and 21.9.

## Enabling Oracle in Docker

To enable Oracle database connectivity in your DreamFactory Docker container, you need to install the Oracle Instant Client and PHP OCI8 extension.

:::note
These instructions are specifically for Ubuntu 24.04 base images. If you're using a different base image or PHP version, you may need to adjust package names and paths accordingly.
:::

### Method 1: Installing on a Running Container

If you need to install Oracle drivers on an already running container, you can execute the commands directly in the container.

#### Step-by-Step Installation

1. **Install dependencies**

   ```bash
   docker-compose exec web bash -c "apt-get update && apt-get install -y wget unzip libaio1t64 php8.3-dev php-pear build-essential"
   ```

2. **Download Oracle Instant Client**

   ```bash
   docker-compose exec web bash -c "cd /tmp && wget --header='Cookie: oraclelicense=accept-securebackup-cookie' https://download.oracle.com/otn_software/linux/instantclient/2350000/instantclient-basic-linux.x64-23.5.0.24.07.zip && wget --header='Cookie: oraclelicense=accept-securebackup-cookie' https://download.oracle.com/otn_software/linux/instantclient/2350000/instantclient-sdk-linux.x64-23.5.0.24.07.zip"
   ```

3. **Extract and install Oracle Instant Client**

   ```bash
   docker-compose exec web bash -c "mkdir -p /opt/oracle && cd /opt/oracle && unzip -q /tmp/instantclient-basic-linux.x64-23.5.0.24.07.zip && unzip -o -q /tmp/instantclient-sdk-linux.x64-23.5.0.24.07.zip && mv \$(ls -d /opt/oracle/instantclient_*) /opt/oracle/instantclient && cd /opt/oracle/instantclient && rm -f jdbc occi mysql *jar *.zip && ln -sf \$(ls libclntsh.so.*.* | head -1) libclntsh.so"
   ```

4. **Configure library path**

   ```bash
   docker-compose exec web bash -c "echo /opt/oracle/instantclient > /etc/ld.so.conf.d/oracle-instantclient.conf && ldconfig"
   ```

5. **Fix Ubuntu 24.04 libaio compatibility**

   ```bash
   docker-compose exec web bash -c "ln -s /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1 && ldconfig"
   ```

6. **Install PHP OCI8 extension**

   ```bash
   docker-compose exec web bash -c "echo 'instantclient,/opt/oracle/instantclient' | pecl install oci8"
   ```

7. **Enable OCI8 extension**

   ```bash
   docker-compose exec web bash -c "echo 'extension=oci8.so' > /etc/php/8.3/mods-available/oci8.ini && phpenmod oci8 && service php8.3-fpm restart"
   ```

8. **Verify installation**

   ```bash
   docker-compose exec web bash -c "php -m | grep oci8"
   docker-compose exec web bash -c "php -r \"echo 'OCI8 Version: ' . phpversion('oci8') . PHP_EOL;\""
   docker-compose exec web bash -c "php -r \"echo 'Oracle Client Version: ' . oci_client_version() . PHP_EOL;\""
   ```

#### Single Combined Command

Alternatively, you can run all commands as a single block:

```bash
docker-compose exec -T web bash -c "
apt-get update && \
apt-get install -y wget unzip libaio1t64 php8.3-dev php-pear build-essential && \
cd /tmp && \
wget --header='Cookie: oraclelicense=accept-securebackup-cookie' https://download.oracle.com/otn_software/linux/instantclient/2350000/instantclient-basic-linux.x64-23.5.0.24.07.zip && \
wget --header='Cookie: oraclelicense=accept-securebackup-cookie' https://download.oracle.com/otn_software/linux/instantclient/2350000/instantclient-sdk-linux.x64-23.5.0.24.07.zip && \
mkdir -p /opt/oracle && \
cd /opt/oracle && \
unzip -q /tmp/instantclient-basic-linux.x64-23.5.0.24.07.zip && \
unzip -o -q /tmp/instantclient-sdk-linux.x64-23.5.0.24.07.zip && \
mv \$(ls -d /opt/oracle/instantclient_*) /opt/oracle/instantclient && \
cd /opt/oracle/instantclient && \
rm -f jdbc occi mysql *jar *.zip && \
ln -sf \$(ls libclntsh.so.*.* | head -1) libclntsh.so && \
echo /opt/oracle/instantclient > /etc/ld.so.conf.d/oracle-instantclient.conf && \
ldconfig && \
ln -s /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1 && \
ldconfig && \
echo 'instantclient,/opt/oracle/instantclient' | pecl install oci8 && \
echo 'extension=oci8.so' > /etc/php/8.3/mods-available/oci8.ini && \
phpenmod oci8 && \
service php8.3-fpm restart && \
php -m | grep oci8 && \
php -r \"echo 'OCI8 Version: ' . phpversion('oci8') . PHP_EOL;\" && \
php -r \"echo 'Oracle Client Version: ' . oci_client_version() . PHP_EOL;\"
"
```

:::caution Persistence
Installations made directly in a running container will be lost if the container is rebuilt or recreated. For permanent installation, use the Dockerfile method below.
:::

### Method 2: Adding to Dockerfile (Permanent Installation)

To make the Oracle driver installation permanent across container rebuilds, add the following to your Dockerfile:

```dockerfile
# Install Oracle dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    libaio1t64 \
    php8.3-dev \
    php-pear \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Download and install Oracle Instant Client
RUN mkdir -p /opt/oracle && \
    cd /tmp && \
    wget --header="Cookie: oraclelicense=accept-securebackup-cookie" https://download.oracle.com/otn_software/linux/instantclient/2350000/instantclient-basic-linux.x64-23.5.0.24.07.zip && \
    wget --header="Cookie: oraclelicense=accept-securebackup-cookie" https://download.oracle.com/otn_software/linux/instantclient/2350000/instantclient-sdk-linux.x64-23.5.0.24.07.zip && \
    unzip -q instantclient-basic-linux.x64-23.5.0.24.07.zip -d /opt/oracle && \
    unzip -o -q instantclient-sdk-linux.x64-23.5.0.24.07.zip -d /opt/oracle && \
    mv $(ls -d /opt/oracle/instantclient_*) /opt/oracle/instantclient && \
    cd /opt/oracle/instantclient && \
    rm -f jdbc occi mysql *jar *.zip && \
    ln -sf $(ls libclntsh.so.*.* | head -1) libclntsh.so && \
    rm -f /tmp/instantclient*.zip

# Configure Oracle library path
RUN echo /opt/oracle/instantclient > /etc/ld.so.conf.d/oracle-instantclient.conf && \
    ldconfig

# Fix Ubuntu 24.04 libaio compatibility
RUN ln -s /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1 && \
    ldconfig

# Install and enable PHP OCI8 extension
RUN echo 'instantclient,/opt/oracle/instantclient' | pecl install oci8 && \
    echo 'extension=oci8.so' > /etc/php/8.3/mods-available/oci8.ini && \
    phpenmod oci8
```

### Notes for Docker Installation

- **Base Image**: These instructions are for Ubuntu 24.04 with PHP 8.3
- **Oracle Version**: Oracle Instant Client version 23.5 is used
- **PHP Version**: Adjust PHP version numbers (e.g., `php8.3-dev`, `/etc/php/8.3/`) if using a different PHP version
- **Ubuntu 24.04 Specific**: The `libaio1t64` package and symlink are specific to Ubuntu 24.04
- **Oracle License**: The `--header="Cookie: oraclelicense=accept-securebackup-cookie"` flag is required for Oracle downloads to automatically accept license terms, you should review their terms prior to installing Instant Client
- **Dynamic Detection**: The Dockerfile uses dynamic directory and library detection to remain compatible with future Oracle Instant Client versions without manual updates
- **Non-Interactive Unzip**: The `-o` flag ensures non-interactive extraction by automatically overwriting duplicate files

## Enabling Simba Trino ODBC

Selecting the Simba Trino ODBC option (when prompted during installation) will result in the installation of the Simba Trino ODBC driver. Due to licensing restrictions, we are unable to include these files with the installer. You must obtain the Simba Trino ODBC driver and license file from your vendor (e.g., insightsoftware).

After obtaining the files, upload them to your server and note the absolute path to their location. You will need to supply this path during the installation process when prompted.

You will need:

- Simba Trino ODBC driver package for your OS (e.g. `SimbaTrinoODBC-<version>.deb` or `SimbaTrinoODBC-<version>.rpm`)
- `SimbaTrinoODBCDriver.lic` license file

### Steps:

1. Download the Simba Trino ODBC driver and license file from your vendor portal.
2. Upload the `.deb` or `.rpm` file and the `SimbaTrinoODBCDriver.lic` file to your server (e.g., `/tmp`).
3. When prompted during installation, enter the absolute path to the driver package file (e.g., `/tmp/SimbaTrinoODBC-2.0.0.1000-Debian-64bit.deb`).
4. When prompted, enter the absolute path to the `SimbaTrinoODBCDriver.lic` file (e.g., `/tmp/SimbaTrinoODBCDriver.lic`).
5. The installer will install the driver and move the license file to `/opt/simba/trinoodbc/lib/64/` automatically.

### Note:

- The installer does not download the driver for you. You must obtain it from your vendor.
- The script was tested with Simba Trino ODBC driver version 2.0.0.1000 and later.
- If you encounter issues, ensure the driver and license file paths are correct and accessible.
