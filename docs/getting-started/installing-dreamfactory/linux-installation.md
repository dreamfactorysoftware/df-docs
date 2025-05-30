---
sidebar_position: 2
title: Linux Installation
id: linux-installation
---

# Linux installation

DreamFactory can be installed on most common Linux platforms using our automated installer. The installer is designed to deploy DreamFactory as the primary application on the server (the site is published on port 80 of the local host).  This guide provides instructions for downloading and running the installer on a new Linux server.

## Supported operating Systems

DreamFactory currently supports the following flavors of Linux:

- CentOS 7
- RHEL 7/8/9
- Oracle Linux 7/8
- Debian 10/11
- Fedora 36/37
- Ubuntu 22/24

## Automated installer

The installer can be found in [DreamFactory's GitHub repository](https://github.com/dreamfactorysoftware/dreamfactory/tree/master/installers).

Follow these steps to execute the script on your Linux machine:

1. Download the script from GitHub:
    
    `wget https://github.com/dreamfactorysoftware/dreamfactory/raw/master/installers/dfsetup.run`

2. Make the installer executable:

    `chmod +x dfsetup.run`

3. Run the installer as sudo:

    `sudo ./dfsetup.run`

### Using the installer

Once the installer opens, an interactive menu displays:

![linux installer start](/img/linux-install/df-linux-installer-start.png)

A typical installation uses options 0, 5, and 7 for a default build of the latest version of DreamFactory with NGINX as a web server. MariaDB is installed and configured as the system database, and a debug log is available in the `/tmp/` directory.

The installer verifies the Linux platform is supported and then begins installing dependencies. As each dependency is installed, a progress bar (...) is visible along with any issues that are encountered. You can also tail the log file in the `/tmp` directory if needed.

![linux installer installing](/img/linux-install/df-linux-installer-installing.png)

The rest of the installer's process provides prompts for you to enter the location of commercial license files, database settings, and initial admin user information. Ensure that you record the system DB details before closing the terminal.

![linux installer complete](/img/linux-install/df-linux-installer-complete.png)

You can now access the DreamFactory UI from a web browser by pointing to the server IP address and using the credentials created during the installer process.

![DreamFactory login page](/img/common/df-login-page.png)

## About The system database

During the installation, you must point DreamFactory's installation to a system database. This database holds the entire configuration for your DreamFactory instance and can be used to replicate, restore, or upgrade an instance in the future. While the default configuration above can set up a system database on localhost, many users, especially those at scale, prefer the system database to be hosted elsewhere. This configuration can be (re)entered by running the following command from the `/opt/dreamfactory/` directory:

`php artisan df:env`

The configuration can also be changed manually by editing `/opt/dreamfactory/.env`. For more information, refer to our [DreamFactory Basic Configuration](/getting-started/dreamfactory-configuration/basic-configuration) documentation.

### Supported system databases

Currently, the supported system database types are:

- SQLite
- MySQL (MariaDB)
- PostgreSQL
- SQL Server
