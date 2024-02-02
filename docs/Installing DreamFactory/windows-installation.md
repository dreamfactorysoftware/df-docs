---
sidebar_position: 4
---


# Windows Installation

This page will have Windows installation instructions.

## Prerequisites

These instructions will apply only to a fresh 64-bit Windows 2019 or 2022 Server. The server must not have any other IIS/web applications running on it in order to work with DreamFactory. You will need to be able to access the GUI of the server via something like RDP, the ability to transfer files from your client machine to the server, and it is recommended to turn IE enhanced security **off** to make downloading some of the necessary installation files easier. 

## Server Role setup

To start, you will need to set up the IIS Web server roles.

To enable the Web Server Roles:

1. Open the Server Manager Application.
2. Click on Option 2 "Add roles and features".
3. Click Next.
4. Ensure that "Role based or feature based" is selected, and click Next.
5. Ensure the server you're working on is selected, click Next.
6. Check the "Web Server (IIS)" box on server roles, install any admin tools if asked. Click Next.
7. Your Web Server Role should look something like this (also outlined below): 
![Web Server Role selection](/img/windows-install/select-server-roles.png)
8. Click Next and then Install, let the installer run in the background, reup on coffee and start the download section below. 

### Web server Roles
These are the web server roles you'll want to check:

- Web Server (IIS)
    - Common HTTP Features
        - Default Document
        - Directory Browsing
        - HTTP Errors
        - Static Content
        - HTTP Redirection
    - Health and Diagnostics
        - HTTP Logging
    - Performance
        - Static Content Compression
    - Security
        - Request Filtering
    - Application Development
        - CGI

## Downloads

There are a few installation files that will need to be downloaded and, in some cases, installed. This section will cover the downloads needed before starting the actual installation and configuration of the server. Getting all of these files on the server ahead of time will keep the rest of the installation going smoothly. 

### DreamFactory specific files

Before starting, you will need the following files on the server ready to add to the installation when needed.

- Composer (license) files:
  - composer.json
  - composer.json-dist
  - composer.lock
- DreamFactory license key

:::note 
The composer files are typically grabbed from the DreamFactory SFTP server. Contact DreamFactory support if you need help accessing them. 
:::

### Git

We will need the `git` command available to get the DreamFactory code later. 

Git can be downloaded from [here](https://git-scm.com/download/win). Get the "64-bit Git for Windows Setup" version.

To install git, simply run the installer you downloaded and click yes/next on all default options. 

### Visual C++ 2015-2019

Download [here](https://aka.ms/vs/16/release/VC_redist.x64.exe)

Simply run the installer to install.

### URL rewrite module

Download [here](https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi)

Simply run the installer to install.

### PHP

PHP for Windows can be downloaded from [here](https://windows.php.net/download#php-8.1). Be sure to get a 64-bit, **non-thread-safe (NTS)** version. Download the .zip

At the time of writing, the latest supported PHP version is 8.1.27. The 64-bit NTS version can be directly downloaded from [here](https://windows.php.net/downloads/releases/php-8.1.27-nts-Win32-vs16-x64.zip)

Just get the .zip downloaded. You will install it later. 

### Composer

Composer is a package manager for PHP. The installer can be directly downloaded from [here](https://getcomposer.org/Composer-Setup.exe).

Just get the installer downloaded. You will run it later. 

### PHP Manager

PHP Manager is an IIS utility to make managing PHP and extensions much easier. 

Go to the link [here]( https://www.iis.net/downloads/community/2018/05/php-manager-150-for-iis-10) and click "Download this extension". 

Simply run the downloaded installer while IIS is closed to install.

### SQL Server Drivers

If you plan to use DreamFactory to connect to SQL Server, you will need the driver packages. 

Start with downloading the v17 and v18 drivers:

- [Version 17](https://go.microsoft.com/fwlink/?linkid=2249004)
- [Version 18](https://go.microsoft.com/fwlink/?linkid=2249006)

Run **both** downloaded installers.

For the drivers to be used, you'll also need the sqlsrv PHP extensions. Start by going to the releases page [here](https://github.com/microsoft/msphpsql/releases)

Find the latest release and look in the assets section. Windows packages will be at the end of the list. Download the Windows-8.1.zip for PHP v8.1

As of this writing, the latest release of the extension package can be directly downloaded from [here](https://github.com/microsoft/msphpsql/releases/download/v5.12.0/Windows-8.1.zip)

## Getting DreamFactory running

The rest of the procedure will involve two primary objectives: getting DreamFactory installed and running with the PHP development server, and then configuring IIS to serve DreamFactory. This section will cover the former. 

### Installing PHP

To begin, create a new folder: `C:\php\`
Next, grab the PHP installation .zip you gathered earlier. Extract the entire contents to the `C:\php\` folder. 

Duplicate (copy/paste) the `php.ini-development` file, rename the duplicate `php.ini`

:::note
You might need to enable file name extentions in the "view" tab of the file explorer
:::

Open the newly created php.ini and copy/paste the following at the bottom of the file: 

```
extension=ldap
extension=curl
extension=ffi
extension=ftp
extension=fileinfo
extension=gd
extension=intl
extension=mbstring
extension=exif
extension=mysqli
extension=odbc
extension=openssl
extension=pdo_mysql
extension=pdo_odbc
extension=pdo_pgsql
extension=pdo_sqlite
extension=pgsql
extension=shmop
extension=soap
extension=sockets
extension=sodium
extension=sqlite3
extension=tidy
extension=xsl
extension=php_pdo_sqlsrv.dll
extension=php_sqlsrv.dll

zend_extension=opcache

opcache.enable=1
```
Save and close php.ini

:::note
You can manually add PHP to your enviornment variable path, however this will be done automatically for us during the Composer installation. 
:::

### Installing Composer

To start, run the composer installer you downloaded earlier. 

You will mostly hit "next" through most of the installtion. When asked to browse to your command line/CLI PHP naviagate to: `C:\php\php.exe`. Then check the "Add to path" option. Click Next and wait. 

:::info
This is a great time to test both the PHP and Composer installations, open a new commmand prompt and run:

`php -v`

`composer --version`

If both of those commands are sucessful, you are safe to keep moving forward. 
:::

### Installing SQL Server drivers (optional)

This again is an optional step dependent on if you intend to use DreamFactory with SQL Server.

The v17 and v18 drivers should have been installed during the previous steps, if not, install them now. 

Open the Windows-8.1.zip you downloaded earlier, in the x64 folder there should be  4 .dll files. Copy/paste the **two** nts (Non Thread Safe) .dll into your php ext folder (`C:\php\ext\`)

Then, rename both files removing the "_81_nts" at the end of the filename. The files will be named:

- php_pdo_sqlsrv.dll
- php_sqlsrv.dll

### Get (git) DreamFactory code

Next, we will get the DreamFactory code itself, to begin open a command prompt, then run:

`cd C:\inetpub\wwwroot\`

`git clone https://github.com/dreamfactorysoftware/dreamfactory`

This will create a `C:\inetpub\wwwroot\dreamfactory` folder on the server which will be refered to as the DreamFactory installation folder in this and other documentation. 

:::warning
At this time, the newest supported version of DreamFactory on Windows is v5.4.1
Version 6+ is not currently supported so the following commands will also need to be ran:

`cd C:\inetpub\wwwroot\dreamfactory`

`git checkout 5.4.1`

Once the new UI in v6 is made compatible with Windows, this notice will be removed and this checkout step will no longer be needed. 
:::

### Install DreamFactory dependencies

DreamFactory uses Composer to handle all PHP dependencies, if you haven't installed Composer from the installation section above, do that now. 

First, take your 3 composer/license files (`composer.json`, `composer.json-dist`, `composer.lock`) and add them to the DreamFactory installation directory, overwriting the existing composer files in that directory. Then, open a command prompt, cd into the dreamfactory installation directory and run:

`composer install --no-dev --ignore-platform-reqs --verbose`

Sometimes this command can take quite a while to run, if it feels hung, hit enter a couple times in the command prompt. 

### Build DreamFactory system database and root admin

Once the composer install finishes, we will finalize the DreamFactory setup, in your command prompt, cd into the dreamfactory installatoin directory. Start by running: 
`php artisan df:env`
This command will define the system database for the DreamFactory enviornment. For inital installation, it is recommended to start with option [0], Sqlite. If you run into problems during the installation, starting with sqlite will eliminate database/networking issues from having to troubleshoot. This database can be changed at a later date, and any configurations you build in sqlite can be exported and imported into another instance later. 

When selecting a database name and user, it is recommended to stick with the default "dreamfactory" and "dfadmin" respectively. 

Once the df:env command finishes, run:
`php artisan df:setup`
This command will prompt you to create your first admin user. This email and password will be used to login to the UI later. The root admin account details can be changed later.

Finally, add your license key to the end of the .env file located in the dreamfactory instalaltion directory. You can add it to the bottom of the file like:
`DF_LICENSE_KEY={YOUR LICENSE KEY}`
> without the curly brackets

### Test DreamFactory

In order to run a test/development Laravel server, from the dreamfactory installation direfctory run:
`php artisan serve`

This will start a web server at http://127.0.0.1:8000 If you can navigate to this url, login to the UI with the root admin created earlier, and you **don't** have a red banner at the top of the UI, you have done everything correctly. If not, go back and check the steps you missed before moving forward. 

From here, DreamFactory is installed, the next section will focus on getting IIS to serve DreamFactory on port 80

## Serving DreamFactory with IIS

This section will highlight the IIS configuration needed to serve DreamFactory. 

:::note
Please note that we at DreamFactory are not Windows experts. The guidance provided herein outlines a basic, default IIS configuration that has been tested and is known to work with DreamFactory on Windows environments. This setup is intended as a foundation or starting point for your DreamFactory installation. It's important to understand that while this configuration works for us and is supported by our team, Windows and IIS are versatile platforms. As such, there may be alternative configurations that also work well, depending on your specific needs and environment. We encourage you to use this as a guide, but feel free to explore and implement what works best for your situation.
:::

To begin, open the IIS manager, most of the steps here will take place in the IIS manager. 

### Create DreamFactory site

In the left panel of the IIS manager UI, open "sites" and right click > remove the default site.



### Handler mappings

### PHP Manager config
    check php info
    check ext
### FastCGI settings

### reuest filtering

### check applicationhost.config

### url rewrite import
- site not server
### Directory permissions


## Adding SSL

## Notes

![Locale Dropdown](/img/tutorial/localeDropdown.png)