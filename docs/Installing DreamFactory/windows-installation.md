---
sidebar_position: 4
---


# Windows Installation

This page will have Windows installation instructions.

## Prerequisites

These instructions will apply only to a fresh 64-bit Windows 2019 or 2022 Server. The server must not have any other IIS/web applications running on it in order to work with DreamFactory. You will need to be able to access the GUI of the server via something like RDP, the ability to transfer files from your client machine to the server, and it is recommended to turn IE enhanced security **off** to make downloading some of the necessary installation files easier. Other applications might be able to be ran on the same IIS instance as DreamFactory, however this is not typically supported. 

A local Administrator account is also required at minimum for testing permissions, and possibly in perpetuity for IIS permissions.  

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

Next, right click on the "sites" folder and then "Add Website". Then fill in the dialog

- Site name: typically set to "dreamfactory" but can be whatever you'd like
- Physical Path: `{dreamfactory install dir}/public` if you've been following along this should be: `C:\inetpub\wwwroot\dreamfactory\public\`
- Connect as...
 - For the default DreamFactory configuration, the "Connect As" should be set to a **local server Administrator account** set under the "Specific User" option. Other options such as domain users can be used, however you might run into permission issues that you will need to solve. DreamFactory support is able to support the local Administrator account, but is unable to help with setting domain/non local admin account permissions. 
 - Use the "Test Settings" button, and ensure you have two green check marks. 

:::note
Due to the vast diversity in Windows environments, initial testing of DreamFactory necessitates the use of the local Administrator account. If DreamFactory is accessible with the local Administrator account but encounters issues with domain or non-admin user accounts, the problem often lies within permissions. We strongly recommend and support the use of the local Administrator account. Troubleshooting permission issues will likely be required for non-admin accounts to resolve access discrepancies.
:::

### Handler mappings

Handler mappings tell IIS how/where to use the php executeables in serving DreamFactory. To start, select the server on the lefthand side of the IIS manager. Then, click on the "Handler Mappings" icon. To create a new mapping, click "Add Module Mapping" on the righthand side. 

Fill in the Add Module Mapping dialog:

- Request Path: `*.php`
- Module: `FastCgiModule`
- Executeable: `C:\php\php-cgi.exe`
- Name: `PHP_via_FastCGI`

Next, click on request restricions, and ensure the following are set:

- Mapping: file or folder
- Verbs: all
- Access: script

Click "OK" to save the handler mapping. 

### PHP Manager config

Again, from the server view on the left, but this time click on the "PHP Manager" icon. 

You will likley see a yellow notice that your PHP configuration is non optimal. Click on "View Recomendations" check the boxes and apply every available recommendation.

Test that PHP is working, click the "Check phpinfo()" link and then test using the dreamfactory site. Ensure that you see a purple and white PHP info output in this screen. If not, go back and resolve PHP installation issues. 

If your php.ini is built correctly from above, you should be able to access "Enable or disable an extention" and see them enabled. You can also enable extentions manually in the PHP Manager which will apply the appropriate edits to the `php.ini` file

### FastCGI settings

There is one small setting change to be made here to the default IIS error handling. 

From the server view, select "FastCGI Settings", then slect the handler you made earlier and then "Edit..." on the right side. 

Change "Standard Error Mode" to "IgnoreAndReturn200" and click "OK" 

### Request filtering

From the server view, select "Request Filtering" icon. Then Navigate to the "HTTP Verbs" tab. On the right side, click "Allow Verb" and add the following verbs one at a time:

- GET
- HEAD
- POST
- DELETE
- PUT
- PATCH

### URL Rewrite rules

Next, on the left hand side of the IIS management window, open the dreamfactory site, and then click on "URL Rewrite" module. To import the URL rewrite rules:

1. Click "Import Rules" on the right side 
2. Browse to the dreamfactory/public dir and open .htaccess
3. click "import"
4. If any of the imported rules have red "X"s on them, select them and remove that specific rule until everything in green checkmarks. 
5. click "apply" on the right side. 

### Directory permissions

IIS needs control over certian folders within the dreamfactory installation directory in order to function properly. Right click > properties on the following folders and give IIS_IUSRS full control over them. Additionally, be sure to unckeck the "read only" option, and apply all changes recursively if asked:

- `storage`
- `bootstrap/cache`
- `public`

:::note
Sometimes these permisions don't set correctly with the properties window. If you are having permissions issues, we have seen good results using these two commands ran from the dreamfactory install directory:

`icacls "bootstrap\cache" /grant "IIS_IUSRS:(OI)(CI)F"`

`icacls "storage" /grant "IIS_IUSRS:(OI)(CI)F"`

:::

### Accessing DreamFactory

After completing the setup, you can navigate to the server's IP address or hostname to view the DreamFactory login screen on port 80. At this stage, DreamFactory is operational. However, implementing SSL and creating a DNS entry for the server are examples of the numerous additional configuration options at your disposal. Due to the extensive variety of configurations possible beyond this point, this guide does not cover them in detail. For more advanced IIS configuration, please consult Microsoft's documentation as needed.

## Adding SSL

We typically recommend [certbot](https://certbot.eff.org/instructions?ws=other&os=windows) follow instructions there. 
