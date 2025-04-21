---
sidebar_position: 4
---


# Windows Installation

This page contains installation instructions for Windows.

## Prerequisites

These instructions apply only to a fresh 64-bit Windows 2019 or 2022 Server. The server must not have any other IIS/web applications running on it in order to work with DreamFactory. You must be able to access the GUI of the server using something like RDP, have the ability to transfer files from your client machine to the server, and it is recommended to turn IE enhanced security **off** to make downloading some of the necessary installation files easier. Other applications might be able to run on the same IIS instance as DreamFactory, however this is not typically supported. 

A local Administrator account is also required at minimum for testing permissions, and possibly in perpetuity for IIS permissions.  

## Server role setup

To start, set up the IIS Web server roles.

To enable the Web Server Roles:

1. Open the **Server Manager Application**.
2. Click on Option 2 **Add roles and features**.
3. Click **Next**.
4. Ensure that **Role based or feature based** is selected, and click **Next**.
5. Ensure the server you're working on is selected, click **Next**.
6. On server roles, check the **Web Server (IIS)** box, install any admin tools if asked, and click **Next**.
7. Your Web Server Role should look something like this (also outlined below): 
![Web Server Role selection](/img/windows-install/select-server-roles.png)
8. Click **Next** and then select **Install**. Let the installer run in the background, reup on coffee and start the download section below. 

### Web server roles
These are the web server roles DreamFactory recommends selecting:

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

There are a few installation files to downloade and, in some cases, installed. This section covers the downloads needed before starting the actual installation and configuration of the server. Getting all of these files on the server ahead of time ensures that the rest of the installation runs smoothly.

### DreamFactory specific files

Before starting, locate the following files on the server so they are ready to add to the installation when needed.

- Composer (license) files:
  - composer.json
  - composer.json-dist
  - composer.lock
- DreamFactory license key

:::note 
The composer files are typically grabbed from the DreamFactory SFTP server. Contact DreamFactory support if you need help accessing them. 
:::

### Git

The `git` command must be available to get the DreamFactory code later in the installation process. 

Git can be downloaded from [here](https://git-scm.com/download/win). Select the **64-bit Git for Windows Setup** version.

To install git, simply run the installer you downloaded and click **yes**/**next** on all default options. 

### Visual C++ 2015-2019

Download [here](https://aka.ms/vs/16/release/VC_redist.x64.exe)

Simply run the installer to install.

### URL rewrite module

Download [here](https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi)

Simply run the installer to install.

### PHP

PHP for Windows can be downloaded [here](https://windows.php.net/download#php-8.3). Be sure to get a 64-bit, **non-thread-safe (NTS)** version. Download the .zip file.

At the time of writing, the latest supported PHP version is 8.3.16. The 64-bit NTS version can be directly downloaded [here](https://windows.php.net/downloads/releases/php-8.3.16-nts-Win32-vs16-x64.zip).

Just get the .zip downloaded. It is installed later in the process. 

### Composer

Composer is a package manager for PHP. The installer can be directly downloaded [here](https://getcomposer.org/Composer-Setup.exe).

Just get the installer downloaded. It is run later in the process. 

### PHP Manager

PHP Manager is an IIS utility to make managing PHP and extensions much easier. 

Go to the link [here]( https://www.iis.net/downloads/community/2018/05/php-manager-150-for-iis-10) and click **Download this extension**. 

Simply run the downloaded installer while IIS is closed to complete the install.

### SQL Server drivers

If you plan to use DreamFactory to connect to a SQL Server, you must have the driver packages. 

Start with downloading the v17 and v18 drivers:

- [Version 17](https://go.microsoft.com/fwlink/?linkid=2249004)
- [Version 18](https://go.microsoft.com/fwlink/?linkid=2249006)

Run **both** downloaded installers.

For the drivers to be used, you also need the sqlsrv PHP extensions. Start by going to the releases page [here](https://github.com/microsoft/msphpsql/releases).

Find the latest release and look in the assets section. Windows packages are at the end of the list. Download the Windows_5.12.0RTW.zip for PHP v8.3.

As of this writing, the latest release of the extension package can be directly downloaded [here](https://github.com/microsoft/msphpsql/releases/download/v5.12.0/Windows_5.12.0RTW.zip).

## Getting DreamFactory running

The rest of the procedure involves two primary objectives: getting DreamFactory installed and running with the PHP development server, and then configuring IIS to serve DreamFactory. This section cover the installation and PHP development server set up. 

### Installing PHP

1. Create a new folder: `C:\php\`, grab the PHP installation .zip you gathered earlier, and extract the entire contents to the `C:\php\` folder. 

2. Duplicate (copy/paste) the `php.ini-development` file, and rename the duplicate `php.ini`.

:::note
You might need to enable file name extentions in the **View** tab of the file explorer.
:::

3. Open the newly created php.ini and copy/paste the following at the bottom of the file: 

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
4. Save and close php.ini.

:::note
You can manually add PHP to your enviornment variable path, however this is done automatically during the Composer installation. 
:::

### Installing Composer

To start, run the composer installer you downloaded earlier. 

You can select **Next** through most of the installtion. When asked to browse to your command line/CLI PHP, naviagate to: `C:\php\php.exe`. Then check the **Add to path** option. Click **Next** and wait. 

:::info
This is a great time to test both the PHP and Composer installations, open a new commmand prompt and run:

`php -v`

`composer --version`

If both of those commands are successful, you are safe to keep moving forward. 
:::

### Installing SQL Server drivers (optional)

This is an optional step dependent on if you intend to use DreamFactory with SQL Server.

The v17 and v18 drivers should have been installed during the previous steps, if not, install them now. 

Open the Windows_5.12.0RTW.zip downloaded earlier, in the x64 folder there should be 4 .dll files. Copy/paste the **two** nts (Non Thread Safe) .dll into your php ext folder (`C:\php\ext\`)

Then, rename both files removing the "_83_nts" at the end of the filename. The files are named:

- php_pdo_sqlsrv.dll
- php_sqlsrv.dll

### Get (git) DreamFactory code

Next, get the DreamFactory code by opening a command prompt, and running:

`cd C:\inetpub\wwwroot\`

`git clone https://github.com/dreamfactorysoftware/dreamfactory`

This creates a `C:\inetpub\wwwroot\dreamfactory` folder on the server, refered to as the **DreamFactory installation folder** in this and other documentation.

### Install DreamFactory dependencies

DreamFactory uses Composer to handle all PHP dependencies, if you haven't installed Composer from the installation section above, do so now. 

First, take your 3 composer/license files (`composer.json`, `composer.json-dist`, `composer.lock`) and add them to the DreamFactory installation directory, overwriting the existing composer files in that directory. Then, open a command prompt, cd into the dreamfactory installation directory and run:

`composer install --no-dev --ignore-platform-reqs --verbose`

Sometimes this command takes a while to run, if it feels hung, hit enter a couple times in the command prompt. 

### Build DreamFactory system database and root admin

Once the composer install finishes, we can finalize the DreamFactory setup. In your command prompt, cd into the dreamfactory installation directory. Start by running: 
`php artisan df:env --df_install=Windows`.

This command defines the system database for the DreamFactory enviornment. For initial installation, it is recommended to start with option [0], Sqlite. If you run into problems during the installation, starting with sqlite eliminates database/networking issues from the troubleshooting process. This database can be changed at a later date, and any configurations you build in sqlite can be exported and imported into another instance later. 

When selecting a database name and user, it is recommended to stick with the default "dreamfactory" and "dfadmin" respectively. 

Once the df:env command finishes, run:
`php artisan df:setup`
This command prompts you to create your first admin user. This email and password are used to log in to the UI later. The root admin account details can be changed later.

Finally, add your license key to the end of the .env file located in the dreamfactory instalaltion directory. You can add it to the bottom of the file like:
`DF_LICENSE_KEY={YOUR LICENSE KEY}`

:::note Ensure that you remove curly brackets seen in the example above.:::

### Test DreamFactory

In order to run a test/development Laravel server, from the dreamfactory installation directory run:
`php artisan serve`

This starts a web server at http://127.0.0.1:8000. If you can navigate to this url, login to the UI with the root admin created earlier. If you **don't** have a red banner at the top of the UI, you have done everything correctly. If the red banner is still visible, go back and check for any steps you may have missed before moving forward. 

From here, DreamFactory is installed, the next section focuses on getting IIS to serve DreamFactory on port 80.

## Serving DreamFactory with IIS

This section highlights the IIS configuration needed to serve DreamFactory. 

:::note
We at DreamFactory are not Windows experts. The guidance provided here outlines a basic, default IIS configuration that has been tested and is known to work with DreamFactory on Windows environments. This setup is intended as a foundation for your DreamFactory installation. It's important to understand that while this configuration works for us and is supported by our team, Windows and IIS are versatile platforms. As such, there may be alternative configurations that also work well, depending on your specific needs and environment. We encourage you to use this as a guide, but feel free to explore and implement what works best for your situation.
:::

To begin, open the IIS manager, most of the steps here take place in the IIS manager. 

### Create DreamFactory site

In the left panel of the IIS manager UI, open **sites**, right click, and select **remove the default site**.

Next, right click on the **sites** folder and select **Add Website**. Then fill in the dialog:

- Site name: typically set to "dreamfactory" but can be whatever you'd like
- Physical Path: `{dreamfactory install dir}/public` if you've been following along this should be: `C:\inetpub\wwwroot\dreamfactory\public\`
- Connect as...
  - For the default DreamFactory configuration, the "Connect As" should be set to a **local server Administrator account** set under the **Specific User** option. Other options such as domain users can be used, however you might run into permission issues that will need to be solved. DreamFactory support is able to support the local Administrator account, but is unable to help with setting domain/non-local admin account permissions. 
  - Use the "Test Settings" button, and ensure you have two green check marks. 

:::note
Due to the vast diversity in Windows environments, initial testing of DreamFactory necessitates the use of the local Administrator account. If DreamFactory is accessible with the local Administrator account but encounters issues with domain or non-admin user accounts, the problem often stems from permissions issues. We strongly recommend and support the use of the local Administrator account. Troubleshooting permission issues is often required for non-admin accounts to resolve access discrepancies.
:::

### Handler mappings

Handler mappings tell IIS how/where to use the php executables in serving DreamFactory. Select the server on the left side of the IIS manager and click on the **Handler Mappings** icon. To create a new mapping, on the right side of the page, click **Add Module Mapping**. 

Fill in the **Add Module Mapping** dialog:

- Request Path: `*.php`
- Module: `FastCgiModule`
- Executable: `C:\php\php-cgi.exe`
- Name: `PHP_via_FastCGI`

Next, click on request restricions, and ensure the following are set:

- Mapping: file or folder
- Verbs: all
- Access: script

Click **OK** to save the handler mapping. 

### PHP manager config

Again, from the server view on the left, click on the **PHP Manager** icon. 

Generally a yellow notice that your PHP configuration is non optimal is displayed. Click on **View Recomendations**, check the boxes and apply every available recommendation.

Test that PHP is working, click the **Check phpinfo()** link and then test using the DreamFactory site. Ensure that you see a purple and white PHP info output in this screen. If not, go back and resolve any PHP installation issues. 

If your php.ini is built correctly you should be able to access **Enable or disable an extention** and see them enabled. You can also enable extentions manually in the PHP Manager which applies the appropriate edits to the `php.ini` file.

### FastCGI settings

There is one setting change to be made to the default IIS error handling. 

From the server view, select **FastCGI Settings**, then select the handler you made earlier and click **Edit...**. 

Change **Standard Error Mode** to **IgnoreAndReturn200** and click **OK**. 

### Request filtering

From the server view, select the **Request Filtering** icon. Then Navigate to the **HTTP Verbs** tab. On the right side, click **Allow Verb** and add the following verbs one at a time:

- GET
- HEAD
- POST
- DELETE
- PUT
- PATCH

### URL rewrite rules

On the left side of the IIS management window, open the DreamFactory site, and select the **URL Rewrite** module. To import the URL rewrite rules:

1. on the right side of the page, click **Import Rules**. 
2. Browse to the dreamfactory/public dir and open **.htaccess**.
3. Click **Import**.
4. If any of the imported rules have red **X**s on them, select them and remove that specific rule until everything shows a green checkmark. 
5. Click **Apply** to complete the process. 

### Directory permissions

IIS needs control over certian folders within the DreamFactory installation directory in order to function properly. Right click and select **Properties** on the following folders and give IIS_IUSRS full control over them. Additionally, be sure to unckeck the **read only** option, and apply all changes recursively if asked:

- `storage`
- `bootstrap/cache`
- `public`

:::note
Sometimes these permisions don't set correctly with the properties window. If you are having permissions issues, we have seen good results by running these two commands from the DreamFactory install directory:

`icacls "bootstrap\cache" /grant "IIS_IUSRS:(OI)(CI)F"`

`icacls "storage" /grant "IIS_IUSRS:(OI)(CI)F"`

:::

### Accessing DreamFactory

After completing the setup, you can navigate to the server's IP address or hostname to view the DreamFactory login screen on port 80. At this stage, DreamFactory is operational. However, implementing SSL and creating a DNS entry for the server are some of the many additional configuration options at your disposal. Due to the extensive variety of configurations possible beyond this point, this guide does not cover them in detail. For more advanced IIS configuration, consult Microsoft's documentation as needed.

## Adding SSL

For details on adding SSL, DreamFactory recommends using [certbot](https://certbot.eff.org/instructions?ws=other&os=windows). Follow the instructions from the provided link to help you through the process. 

## Installing Oracle Driver
The process of installing Oracle drivers is a more manual process than with our Linux installers. To begin you will need to download 3 things:
- The Oracle "Basic" Instant Client package from [Oracle's Website](https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html) (Example file instantclient-basic-windows.x64-23.7.0.25.01.zip)
- The Oracle “SDK” Instant Client Package from [Oracle's Website](https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html) (Example file instantclient-sdk-windows.x64-23.7.0.25.01.zip)
- The PHP oci8 extension (DLL) available at [Pecl PHP Site](https://pecl.php.net/package/oci8) By default, DreamFactory runs on PHP 8.1 so you will want the x64 package of that (version 3.2.1). If you are running DreamFactory using IIS as your webserver you will most likely be using the non thread safe version of PHP.

![Web Server Role selection](/img/windows-install/PeclDLLPage.png)
- `Note you will want to click on the DLL button under downloads on the Pecl site for windows .dll files`
- `Unless you have good reason, choose the appropriate DLLs with the NTS tag`

- Next you will create a folder where the Oracle drivers will be kept, for example `C:\oracledrivers` and extract the Oracle "Basic" Instant Client there. The files will be extracted into a subdirectory called `instantclient_<version>.` Example:

`C:\oracledrivers\instantclient23_7`

- Next we will extract the "SDK" Instant Client to the same folder i.e. `C:\oracledrivers`. We want the SDK package to extract into the same subdirectory as in the previous step, not a new folder. Your driver folder should look like this:

![Web Server Role selection](/img/windows-install/instant-client-folder.png)

- and the subdirectory should look like:

![Web Server Role selection](/img/windows-install/instant-client-subdirectory.png)

- Note that there is now an `SDK` folder inside.

Next, we need to add the full path of the Instant Client to the environment variables OCI_LIB64 and PATH. The quickest way to get to Environment Variables is to use the windows search bar and search for "environment" click on Environment Variables and then:

1. Under System Variables, create OCI_LIB64 if it does not already exist. Set the value of OCI_LIB64 to the full path of the location of Instant Client.

![Web Server Role selection](/img/windows-install/env-variable-path.png)
![Web Server Role selection](/img/windows-install/oci-env-path.png)

2.Under System Variables, edit PATH to include the same (C:\oracledrivers\instantclient_23_7)

`When utilizing the IIS web server, it is essential to include a new variable PATH in your FastCGI environment.`

`For example, a new variable could be: %PATH%;C:\oracledrivers\instantclient_23_7.`

The fastCGI path is located in the IIS Manager > Your Server > fastCGI Settings > Full Path > Edit > 3 dots next to collections

![Web Server Role selection](/img/windows-install/fastcgi-path.png)

Almost there! Now, the last thing to do is to extract our PHP OCI8 extension package (It will be named along the lines of php_oci8-3.2.1-8.1-nts-vc15-x64) and move the php_oci8.dll file to the ext directory where PHP is located on your system (e.g PHP\v8.1\ext). Once that is done add extension=php_oci8.dll to your php.ini file and then restart the server (use php -m to make sure that the oci8 extension is installed). Congratulations!

