---
sidebar_position: 2
title: CORS and SSL
id: cors-and-ssl
draft: true
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# CORS and SSL

This chapter covers two critical security aspects of your DreamFactory environment: Cross-Origin Resource Sharing (CORS) configuration and securing your web traffic with SSL certificates using Certbot.

## CORS Security

CORS (Cross-Origin Resource Sharing) is a mechanism that allows a client to interact with an API endpoint which hails from a different domain, subdomain, port, or protocol. DreamFactory is configured by default to disallow all outside requests, so before you can integrate a third-party client such as a web or mobile application, you'll need to enable CORS.

### Configuring CORS in DreamFactory

To modify your CORS settings, log in to your DreamFactory instance using an administrator account and select the System Settings tab. Next navigate to `Config > CORS`, and then click the purple plus button to establish a new connection:

![cors config creation](/img/system-settings/config/cors-ssl/cors-config-creation.png)

From there, you'll then be presented with the following screen:

![cors setting config](/img/system-settings/config/cors-ssl/cors-setting-config.png)

The CORS configuration screen provides several fields to customize your CORS settings:

| Field | Description |
|-------|-------------|
| Path | The `Path` field defines the path associated with the API you're exposing via this CORS entry. For instance if you've created a Twitter API and would like to expose it, the path might be `/api/v2/twitter`. If you want to expose all APIs, use `*`. |
| Origins | The `Origins` field identifies the network address making the request. If you'd like to allow more than one origin (e.g. www.example.com and www2.example.com), separate each by a comma (`www.example.com,ww2.example.com`). If you'd like to allow access from anywhere, supply an asterisk `*`. |
| Description | The `Description` field serves as a descriptive reference explaining the purpose of this CORS entry. |
| Headers | The `Headers` field determines what headers can be used in the request. Several headers are whitelisted by default, including `Accept`, `Accept-Language`, `Content-Language`, and `Content-Type`. When set, DreamFactory will send as part of the preflight request the list of declared headers using the `Access-Control-Allow-Headers` header. |
| Exposed Headers | The `Exposed Headers` field determines which headers are exposed to the client. |
| Max Age | The `Max Age` field determines how long the results of a preflight request (the information found in the `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` headers) can be cached. This field's value is passed along to the client using the `Access-Control-Max-Age` field. |
| Methods | The `Methods` field determines which HTTP methods can be used in conjunction with this CORS definition. The selected values will be passed along to the client using the `Access-Control-Allow-Methods` field. |
| Supports Credentials | The `Supports Credentials` field determines whether this CORS configuration can be used in conjunction with user authentication. When enabled, the `Access-Control-Allow-Credentials` header will be passed and set to `true`. |
| Enabled | To enable the CORS configuration, make sure this field is enabled. |

:::caution
Always make sure your `CORS` settings are only set for the appropriate "scheme/host/port tuple" to ensure you are observing the maximum security you can by only allowing cross origin resources access when there is no other way around it.
:::

## Securing Your Web Traffic with SSL Using Certbot

From a networking standpoint DreamFactory is a typical web application, meaning you can easily encrypt all web traffic between the platform and client using an SSL certificate. Unless you've already taken steps to add an SSL certificate to your web server, by default your DreamFactory instance will run on port 80, which means all traffic between your DreamFactory server and client will be unencrypted and therefore subject to capture and review.

Certbot is an open-source utility that simplifies the process of obtaining and renewing SSL certificates from Let's Encrypt. It works directly with the free Let's Encrypt certificate authority to request certificates, prove ownership of your domain, and install the certificate on your web server.

### Prerequisites

<Tabs groupId="os-tabs">
<TabItem value="ubuntu-debian" label="Ubuntu & Debian">
Before installing Certbot, ensure you have:

1. A server running Ubuntu or Debian
2. A registered domain name with DNS records pointing to your server's IP address
3. Nginx or Apache web server installed and configured for your domain (DreamFactory installation typically handles this automatically)
</TabItem>
<TabItem value="rhel-centos-fedora" label="RHEL-CentOS & Fedora">
Before installing Certbot, ensure you have:

1. A server running Red Hat Enterprise Linux, CentOS, or Fedora
2. A registered domain name with DNS records pointing to your server's IP address
3. Nginx or Apache web server installed and configured for your domain (DreamFactory installation typically handles this automatically)
</TabItem>
</Tabs>

### Configuring Firewall Rules

<Tabs groupId="os-tabs">
<TabItem value="ubuntu-debian" label="Ubuntu & Debian">
You can skip this section if you are using a different firewall, have already configured your firewall rules, or do not wish to use any firewall.

**1. If UFW is not installed, install it now using apt or apt-get.**
```bash
sudo apt update
sudo apt install ufw
```

**2. Add firewall rules to allow ssh (port 22) connections as well as http (port 80) and https (port 443) traffic.**
```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
```

Your server may require additional rules depending on which applications you're running (such as mail servers or database servers) and if those applications need to be accessible from other systems.

**3. Enable UFW if its not already enabled.**
```bash
sudo ufw enable
```

**4. Verify that UFW is enabled and properly configured for ssh and web traffic.**
```bash
sudo ufw status
```

This should return a status of active and output the firewall rules that you just added.
</TabItem>
<TabItem value="rhel-centos-fedora" label="RHEL-CentOS & Fedora">
You can skip this section if you are using a different firewall, have already configured your firewall rules, or do not wish to use any firewall.

**1. If Firewalld is not installed, install it now using `dnf`.**
```bash
sudo dnf install firewalld
```

**2. Start firewalld and enable it to automatically start on boot.**
```bash
sudo systemctl start firewalld
sudo systemctl enable firewalld
```

**3. Add firewall rules to allow ssh (port 22) connections as well as http (port 80) and https (port 443) traffic.**
```bash
sudo firewall-cmd --zone=public --permanent --add-service=ssh
sudo firewall-cmd --zone=public --permanent --add-service=http
sudo firewall-cmd --zone=public --permanent --add-service=https
```
If any of these services are already enabled, you may get a warning notice that you can safely ignore. Your server may require additional rules depending on which applications you're running (such as mail servers or database servers).

**4. Reload firewalld to make these rules take effect.**
```bash
sudo firewall-cmd --reload
```

**5. Verify that the firewall rules have been properly configured.**
```bash
sudo firewall-cmd --zone=public --permanent --list-services
```
</TabItem>
</Tabs>

### Installing Certbot

<Tabs groupId="os-tabs">
<TabItem value="ubuntu-debian" label="Ubuntu & Debian">
[Snap](https://snapcraft.io/about) is a package manager developed by Canonical (creators of Ubuntu). Software is packaged as a snap (self-contained application and dependencies) and the snapd tool is used to manage these packages. Since certbot is packaged as a snap, we'll need to install snapd before installing certbot.

**1. If snapd is not installed, install it now.**
```bash
sudo apt update
sudo apt install snapd
```

**2. Install the core snap.**
```bash
sudo snap install core
sudo snap refresh core
```

**3. Remove any previously installed certbot packages to avoid conflicts with the new Snap package.**
```bash
sudo apt remove certbot
```

**4. Use Snap to install Certbot.**
```bash
sudo snap install --classic certbot
```

**5. Configure a symbolic link to the Certbot directory using the `ln` command.**
```bash
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```
</TabItem>
<TabItem value="rhel-centos-fedora" label="RHEL-CentOS & Fedora">
[Snap](https://snapcraft.io/about) is a package manager developed by Canonical (creators of Ubuntu). Software is packaged as a snap (self-contained application and dependencies) and the snapd tool is used to manage these packages. Since certbot is packaged as a snap, we'll need to install snapd before installing certbot.

**1. Add the EPEL repository.**
```bash
sudo dnf install epel-release
sudo dnf upgrade
```

**2. If snapd is not installed, install it now.**
```bash
sudo dnf install snapd
```

**3. Enable the main snap communication socket.**
```bash
sudo systemctl enable --now snapd.socket
```

**4. Configure a symbolic link**
```bash
sudo ln -s /var/lib/snapd/snap /snap
```
:::important
To use the `snap` command, log out of the session and log back in.
:::

**5. Remove any previously installed certbot packages to avoid conflicts with the new Snap package.**
```bash
sudo dnf remove certbot
```

**6. Use Snap to install Certbot.**
```bash
sudo snap install --classic certbot
```

**7. Configure a symbolic link to the Certbot directory using the `ln` command.**
```bash
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```
</TabItem>
</Tabs>

### Requesting a TLS/SSL Certificate Using Certbot

<Tabs groupId="os-tabs">
<TabItem value="ubuntu-debian" label="Ubuntu & Debian">
During the certificate granting process, Certbot asks a series of questions about the domain so it can properly request the certificate. You must agree to the terms of service and provide a valid administrative email address.

**1. Run Certbot to start the certificate request.** When Certbot runs, it requests and installs certificate file along with a private key file. When used with the web server plugin, Certbot also automatically edits the configuration files for your web server, which dramatically simplifies configuring HTTPS.

:::info[Certbot command by Webserver]
<Tabs groupId="webserver-tabs">
<TabItem value="nginx" label="Nginx">

**Request a certificate and automatically configure it (recommended)**
```bash
sudo certbot --nginx
```

**Request a certificate without configuring your web server:**
```bash
sudo certbot certonly --nginx
```
</TabItem>
<TabItem value="apache" label="Apache">

**Request a certificate and automatically configure it (recommended)**
```bash
sudo certbot --apache
```

**Request a certificate without configuring your web server:**
```bash
sudo certbot certonly --apache
```
</TabItem>
</Tabs>
:::

To request the certificate without relying on your web server installation, you can instead use the [standalone plugin](https://eff-certbot.readthedocs.io/en/latest/using.html#standalone) (--standalone).

**2. Follow the prompts to complete the certificate request:**
   - Enter an email address for urgent notices
   - Accept the terms of service
   - Optionally subscribe to the mailing list
   - Enter domain name(s) for the certificate (e.g., `example.com, www.example.com`)

If the operation is successful, Certbot confirms the certificates are enabled and displays information about the certificate locations and expiration date.
</TabItem>
<TabItem value="rhel-centos-fedora" label="RHEL-CentOS & Fedora">
During the certificate granting process, Certbot asks a series of questions about the domain so it can properly request the certificate. You must agree to the terms of service and provide a valid administrative email address.

**1. Run Certbot to start the certificate request.** When Certbot runs, it requests and installs certificate file along with a private key file. When used with the web server plugin, Certbot also automatically edits the configuration files for your web server, which dramatically simplifies configuring HTTPS.

:::info[Certbot command by Webserver]
<Tabs groupId="webserver-tabs">
<TabItem value="nginx" label="Nginx">

**Request a certificate and automatically configure it (recommended)**
```bash
sudo certbot --nginx
```

**Request a certificate without configuring your web server:**
```bash
sudo certbot certonly --nginx
```
</TabItem>
<TabItem value="apache" label="Apache">

**Request a certificate and automatically configure it (recommended)**
```bash
sudo certbot --apache
```

**Request a certificate without configuring your web server:**
```bash
sudo certbot certonly --apache
```
</TabItem>
</Tabs>
:::
To request the certificate without relying on your web server installation, you can instead use the [standalone plugin](https://eff-certbot.readthedocs.io/en/latest/using.html#standalone) (--standalone).

**2. Follow the prompts to complete the certificate request:**
   - Enter an email address for urgent notices
   - Accept the terms of service
   - Optionally subscribe to the mailing list
   - Enter domain name(s) for the certificate (e.g., `example.com, www.example.com`)

If the operation is successful, Certbot confirms the certificates are enabled and displays information about the certificate locations and expiration date.
</TabItem>
</Tabs>

### Automating Certificate Renewal

<Tabs groupId="os-tabs">
<TabItem value="ubuntu-debian" label="Ubuntu & Debian">
Let's Encrypt certificates are valid for 90 days. Certbot automatically sets up a renewal process, but you can test it with:

```bash
sudo certbot renew --dry-run
```

To manually renew all certificates:

```bash
sudo certbot renew
```

:::tip
Certbot does not renew certificates unless they are scheduled to expire soon. Avoid using the `--force-renewal` flag as it could exceed Let's Encrypt's rate limits.
:::
</TabItem>
<TabItem value="rhel-centos-fedora" label="RHEL-CentOS & Fedora">
Let's Encrypt certificates are valid for 90 days. Certbot automatically sets up a renewal process, but you can test it with:

```bash
sudo certbot renew --dry-run
```

To manually renew all certificates:

```bash
sudo certbot renew
```

:::tip
Certbot does not renew certificates unless they are scheduled to expire soon. Avoid using the `--force-renewal` flag as it could exceed Let's Encrypt's rate limits.
:::
</TabItem>
</Tabs>

### Troubleshooting SSL Issues

If you encounter issues with your SSL certificate:

1. Check that your domain's DNS records are correctly pointing to your server
2. Ensure your firewall allows traffic on ports 80 and 443
3. Verify that NGINX is properly configured to use the certificate
4. Check Certbot's logs at `/var/log/letsencrypt/`