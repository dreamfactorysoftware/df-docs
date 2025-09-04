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
