---
sidebar_position: 5
title: Configuring Windows Authentication for SQL Server
id: sqlsrv-config
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
