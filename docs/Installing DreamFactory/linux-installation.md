---
sidebar_position: 2
---

# Linux Installation

DreamFactory can be installed using our automated installer or manually from source code on multiple Linux platforms.  This guide contains information on both installation methods.

## Supported Operating Systems

At the time of writing DreamFactory is supported on the following flavors of Linux:

- CentOS 7
- RHEL 7/8
- Oracle Linux 7/8
- Debian 10/11
- Fedora 36/37
- Ubuntu 20/22

## Automated installer

DreamFactory has an automated installer to make Linux installs a breeze. The installer can be found in our Github repo [here](https://github.com/dreamfactorysoftware/dreamfactory/tree/master/installers)

To execute the script on your Linux machine, simply:

1. Download the script from GitHub:
    
    `wget https://github.com/dreamfactorysoftware/dreamfactory/raw/master/installers/dfsetup.run`

2. Make the installer executeable:

    `chmod +x dfsetup.run`

3. Run the installer as sudo:

    `sudo ./dfsetup.run`

### Using the installer

Once the installer has started, you'll be greeted by an interactive menu:
![linux installer start](/img/linux-install/df-linux-installer-start.png)

The most typical installation will use options 0, 5, and 7 for a default installation of the latest version of DreamFactory with NGINX as a web server, installing and configuring MariaDB as the system database, and providing a debug log in the `/tmp/` directory.

The installer will verify the Linux platform is supported and begin installing dependencies. As each dependency is installed, you'll see a progress bar (...) and any issues that may come up. You can also tail the log file in the `/tmp` directory if needed.
![linux installer installing](/img/linux-install/df-linux-installer-installing.png)

The rest of the installer's process will provide prompts for things like the location of commercial license files, database settings, and initial admin user information. Once these prompts are complete, the installer will exit. Take note of the system DB details before closing the terminal.
![linux installer complete](/img/linux-install/df-linux-installer-complete.png)

You should now be able to access the DreamFactory UI via a web browser by pointing to the server IP address and using the credentials you entered earlier in the installer process.
![DreamFactory login page](/img/common/df-login-page.png)

## Manual Installation

TODO: Add manual steps

## About The System Database

During the installation, you will point DreamFactory's installation to a system database. This database will hold the entire configuration for your DreamFactory instance and can be used to replicate, restore, or upgrade an instance in the future. While the default configuration above will set up a system database on localhost, many users, especially those at scale, will want the system database to be hosted elsewhere. This configuration can be (re)entered by running the following command from the `/opt/dreamfactory/` directory:

`php artisan df:env`

The configuration can also be changed manually by editing `/opt/dreamfactory/.env`. For more information, refer to our [DreamFactory Basic Configuration](../DreamFactory%20Configuration/configuration) documentation.

### Supported System Databases

Currently, the supported system database types are:

- Sqlite
- MySQL (MariaDB)
- Postgres
- SQL Server