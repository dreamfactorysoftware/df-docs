---
sidebar_position: 2
---

# Linux Installation

This page will have linux install stuff on it. 

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

To get the installation script locally, you can run:

`wget https://github.com/dreamfactorysoftware/dreamfactory/raw/master/installers/dfsetup.run`

Then, ensure the installer is executeable: 

`chmod +x dfsetup.run`

Run the installer:

`sudo ./dfsetup.run`

## Using the installer

Once the installer has started, you'll be greeted by an interactive menu. The most typical installation will use options 0, 5, and 7 for a default installation of the latest version of DreamFactory with NGINX as a web server, installing and configuring MariaDB as the system database, and providing a debug log in the `/tmp/` directory. 

The rest of the installer's process will provide prompts for things like the location of commercial license files, database settings, and initial admin user information. Once these prompts are complete and the installer exits, you should see the DreamFactory UI on port 80 on the server when accessed via web browser. 

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

