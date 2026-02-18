---
sidebar_position: 5
title: SQL Server Windows Authentication Setup
id: sqlsrv-config
description: Configure Windows Authentication for DreamFactory's SQL Server connector using IIS application pool identity and Active Directory.
keywords: [SQL Server Windows authentication, DreamFactory SQL Server, IIS application pool, Active Directory SQL, Windows integrated auth, SSPI, Kerberos SQL Server, sql server management studio windows authentication, active directory SQL server documentation]
---

# Configuring Windows Authentication for SQL Server

## Overview

Simple steps to setup Windows Authentication for the SQL Server connector.

## Prerequisites

DreamFactory and SQL Server must be installed on the same Windows Server.

It might be possible to achieve the same result if SQL Server is installed on Linux. However, this would require adding the Linux server to an Active Directory Domain. More detailed information can be found [here](https://blog.netwrix.com/2022/11/01/join-linux-hosts-to-active-directory-domain/).

## SQL Server Connector Configuration

To enable Windows Authentication, leave the `Username` and `Password` fields empty.

If something goes wrong at this step, try adding DreamFactory's IIS application pool identity to SQL Server by running the following query in SQL Server Management Studio (SSMS). Make sure to replace `YourDatabase` with the actual database you want to grant access to.

```sql
CREATE LOGIN [IIS APPPOOL\dreamfactory] FROM WINDOWS;
USE [YourDatabase];
CREATE USER [IIS APPPOOL\dreamfactory] FOR LOGIN [IIS APPPOOL\dreamfactory];
ALTER ROLE db_datareader ADD MEMBER [IIS APPPOOL\dreamfactory];
ALTER ROLE db_datawriter ADD MEMBER [IIS APPPOOL\dreamfactory];
```

---

## Configuring SQL Server Windows Authentication (SSPI) with DreamFactory

Windows Authentication (also called Integrated Security or SSPI) uses the operating system's Kerberos or NTLM security token to authenticate to SQL Server rather than a SQL login with username and password. When Windows Authentication is configured, SQL Server does not maintain its own credential store for the connection — it trusts the OS-level identity of the process making the request.

**When to use Windows Authentication:**
- DreamFactory and SQL Server are both joined to the same Active Directory domain
- Your security policy prohibits storing SQL credentials in application configuration files
- You are in a domain environment and want to leverage existing AD service accounts for auditing and access control
- SQL Server is configured with `Windows Authentication Mode` only (not Mixed Mode)

**Prerequisites:**
- The server running DreamFactory must be domain-joined or have a service account in the same AD domain as the SQL Server instance
- The IIS application pool identity (for Windows installs) or the process user (for Linux installs) must have a corresponding SQL Server login

### PHP sqlsrv Driver Configuration for Windows Auth

In DreamFactory's Admin panel, navigate to **API Generation & Connections → Services → Add Service → Database → SQL Server**. Configure the service as follows:

- **Host**: your SQL Server hostname or IP
- **Database**: the target database name
- **Username**: leave **blank**
- **Password**: leave **blank**
- **Options**: add `Trusted_Connection=yes` in the connection options field

The full connection string DreamFactory constructs will resemble:

```
Server=SQLSERVER\INSTANCE;Database=mydb;Trusted_Connection=yes;TrustServerCertificate=yes
```

The `TrustServerCertificate=yes` option is needed if your SQL Server uses a self-signed TLS certificate (common in internal environments). Remove it if you have a properly signed certificate installed.

**Granting the IIS Application Pool Identity access in SQL Server Management Studio:**

When DreamFactory runs under IIS, it executes as the IIS application pool identity. Run the following in SSMS to grant that identity access to your database:

```sql
-- Create a SQL Server login for the IIS app pool identity
CREATE LOGIN [IIS APPPOOL\dreamfactory] FROM WINDOWS;

-- Switch to the target database
USE [YourDatabase];

-- Create a database user linked to the login
CREATE USER [IIS APPPOOL\dreamfactory] FOR LOGIN [IIS APPPOOL\dreamfactory];

-- Grant appropriate permissions (adjust as needed)
ALTER ROLE db_datareader ADD MEMBER [IIS APPPOOL\dreamfactory];
ALTER ROLE db_datawriter ADD MEMBER [IIS APPPOOL\dreamfactory];
```

Replace `dreamfactory` with your actual IIS application pool name if it differs.

---

### Linux Host with Windows Authentication (Kerberos)

Connecting from a Linux DreamFactory host to SQL Server using Windows Authentication requires configuring Kerberos on the Linux server. This is the most complex configuration path but is the correct approach for Linux-based DreamFactory deployments in AD-integrated environments.

**Step 1: Install required packages**

```bash
# Ubuntu / Debian
sudo apt install -y krb5-user libkrb5-dev

# Install the Microsoft ODBC driver for SQL Server (version 18 recommended)
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list \
  | sudo tee /etc/apt/sources.list.d/mssql-release.list
sudo apt update
sudo ACCEPT_EULA=Y apt install -y msodbcsql18 unixodbc-dev
```

**Step 2: Configure `/etc/krb5.conf`**

Replace `EXAMPLE.COM` with your actual AD realm (typically the uppercase version of your domain):

```ini
[libdefaults]
    default_realm = EXAMPLE.COM
    dns_lookup_realm = true
    dns_lookup_kdc = true
    ticket_lifetime = 24h
    renew_lifetime = 7d
    forwardable = true

[realms]
    EXAMPLE.COM = {
        kdc = dc01.example.com
        admin_server = dc01.example.com
    }

[domain_realm]
    .example.com = EXAMPLE.COM
    example.com = EXAMPLE.COM
```

**Step 3: Obtain a Kerberos ticket**

Use a service account that has SQL Server access:

```bash
kinit svc-dreamfactory@EXAMPLE.COM
# Enter the service account password when prompted

# Verify the ticket was issued
klist
# Should show a ticket for svc-dreamfactory@EXAMPLE.COM
```

For production, use a keytab file so DreamFactory can authenticate without a stored password:

```bash
ktutil
# In the ktutil prompt:
addent -password -p svc-dreamfactory@EXAMPLE.COM -k 1 -e aes256-cts
# Enter password
write_kt /etc/dreamfactory/dreamfactory.keytab
quit

# Initialize from keytab (add to startup script or systemd unit)
kinit -k -t /etc/dreamfactory/dreamfactory.keytab svc-dreamfactory@EXAMPLE.COM
```

**Step 4: Configure the ODBC data source**

Add an entry to `/etc/odbc.ini`:

```ini
[DreamFactorySQL]
Driver = ODBC Driver 18 for SQL Server
Server = SQLSERVER\INSTANCE
Database = mydb
Trusted_Connection = yes
```

**Step 5: DreamFactory connection string for AD authentication**

In DreamFactory's SQL Server service configuration, set the connection string options to use Active Directory Integrated authentication:

```
Authentication=ActiveDirectoryIntegrated;Encrypt=yes;TrustServerCertificate=yes
```

Alternatively, for username/password-based AD authentication (without Kerberos tickets):

```
Authentication=ActiveDirectoryPassword;UID=svc-dreamfactory@EXAMPLE.COM;PWD=yourpassword;Encrypt=yes
```

---

## Troubleshooting SQL Server Authentication Errors

### "Login failed for user '(null)'"

**Cause**: `Trusted_Connection=yes` is set but the process is running on a non-domain-joined host or the Kerberos ticket has expired.

**Fix**:
- On Linux, run `klist` to verify a valid Kerberos ticket exists. If expired, re-run `kinit`.
- Verify the Linux server can reach the domain controller: `ping dc01.example.com`
- Check that the service account has a login in SQL Server: `SELECT name FROM sys.server_principals WHERE type IN ('U','G')`

### "Cannot generate SSPI context"

**Cause**: The SQL Server service's Service Principal Name (SPN) is not registered in Active Directory, so Kerberos cannot obtain a service ticket for the SQL Server.

**Fix**: On a domain-joined Windows machine with Domain Admin rights, register the SPN for the SQL Server service account:

```cmd
setspn -A MSSQLSvc/sqlserver.example.com:1433 DOMAIN\sqlservice-account
setspn -A MSSQLSvc/sqlserver.example.com DOMAIN\sqlservice-account
```

Verify SPNs are registered:

```cmd
setspn -L DOMAIN\sqlservice-account
```

After registering SPNs, restart the SQL Server service. Kerberos authentication should now succeed.

### SSL/TLS Certificate Errors

**Symptom**: `SSL Provider: The certificate chain was issued by an authority that is not trusted`

**Fix**: Add `TrustServerCertificate=yes` to the DreamFactory connection string options. This bypasses certificate chain validation and is appropriate for internal SQL Server instances using self-signed certificates. For production environments exposed to untrusted networks, install a properly signed TLS certificate on the SQL Server instead.

### "Named Pipes Provider: Could not open a connection to SQL Server"

**Cause**: SQL Server is not listening on TCP/IP, or a firewall is blocking port 1433.

**Fix**:
1. In SQL Server Configuration Manager, enable TCP/IP under `SQL Server Network Configuration → Protocols for MSSQLSERVER`.
2. Ensure port 1433 is open in Windows Firewall: `netsh advfirewall firewall add rule name="SQL Server" protocol=TCP dir=in localport=1433 action=allow`
3. Restart the SQL Server service after enabling TCP/IP.

For more on securing DreamFactory's database connections, see [Role-Based Access Control](/Security/role-based-access) and [Authentication APIs](/Security/authenticating-your-apis).
