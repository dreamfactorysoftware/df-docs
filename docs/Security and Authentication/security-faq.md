---
id: security-faq
title: Security FAQ
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Security FAQ

This page addresses the most common security questions about DreamFactory's platform, policies, and best practices.

## Overview

DreamFactory is an on-premise platform for instantly creating and managing APIs, currently used across the healthcare, finance, telecommunications, banking, government, & manufacturing industries. The platform is designed with security in mind to create APIs that maintain confidentiality of customer data, allow for restricted access based on administrator-defined privilege levels, and provide uninterrupted availability of the data.

## Common Questions

### What is the DreamFactory Platform?

* DreamFactory is an on-premise platform for instantly creating and managing APIs, currently used across the healthcare, finance, telecommunications, banking, government, & manufacturing industries.
* DreamFactory's product is designed with security in mind to create APIs that maintain confidentiality of customer data, allow for restricted access to APIs based on administrator-defined privilege levels, and provide uninterrupted availability of the data.
* DreamFactory does not store or maintain customer data associated with customer databases or customer generated APIs using its software.
* DreamFactory software and product updates are downloaded by the customer and data is transmitted using secure HTTPS/TLS protocols.
* Access to customer data is only through express permission from the customer. This is rarely requested and only in circumstances where DreamFactory product support is directly assisting the customer with debugging and/or product support.
* No sensitive, confidential, or other protected data is stored by DreamFactory beyond contact and billing information required for business transactions.

### Who is responsible for developing the DreamFactory platform?

* DreamFactory's internal development team collaborates closely with a trusted third party for technical support and coding for product updates. During this process, third parties have no access to customer data and all lines of code are audited and individually reviewed by DreamFactory's Chief Technical Officer (CTO).

### Does DreamFactory employ any staff members focused specifically on security?

* DreamFactory has a CISSP(TM) actively involved in its security assessment, procedures and review. Moreover, the business staffs Cybersecurity Masters trained leaders to support their approach.
* The software is open source and fully available for testing, at source level, by its customers. Currently the business satisfies the needs of several Fortune 100 customers.
* Our incident response plan that brings together key company representatives from the leadership, legal, and technical teams for rapid assessment and remediation. It includes business continuity and disaster response elements as well as notification processes to ensure customers are fully informed.

### Is DreamFactory certified to be in compliance with security frameworks such as FISMA and HIPAA?

* The DreamFactory security policy framework is built on the Cloud Security Alliance's (CSA's) Consensus Assessments Initiative Questionnaire (CAIQ v3.0.1) which maps to other commonly utilized compliance frameworks including SOC, COBIT, FedRAMP, HITECH, ISO, and NIST.
* DreamFactory uses industry standard cybersecurity controls to protect against all of the OWASP Top 10 web application security risks.
* Product updates and improvements follow a standardized SDLC process, including DevSecOps under the supervision of our CTO.
* Our policies are designed in compliance with key privacy regulations such as GDPR, PIPEDA, COPPA, HIPAA and FERPA.

### How does DreamFactory prevent information compromise?

* DreamFactory software uses an integrated defense in depth to provide customers configurable tools secure their information. This defense starts with access keys that are individually generated and associated with each API.
* Beyond basic authentication, DreamFactory supports LDAP, Active Directory, and SAML-based SSO.
* Customers can create and assign roles to API keys, and delegate/manage custom permissions as well as mapping AD/LDAP groups to roles.
* Other controls include the ability for customers to set rate limiting (by minutes, hours, or days), logging, and reporting preferences, and individually assigning them to users. Real-time traffic auditing is possible through Elasticsearch, Logstash, and Kibana or Grafana dashboards.
* Collectively, this approach allows customers to instantly see who has accessed their data, and individually adjust their access by role or user profile.
* DreamFactory 3.0 includes several new security features including API lifecycle auditing and restricted administrator controls.

### How does DreamFactory prevent the misuse of customer information?

* Our customers fully own and control their own data, so there is virtually no way for a DreamFactory employee to access a customer's data.
* Employees that disclose or misuse confidential company or customer data are subject to disciplinary action up to and including termination.
* All DreamFactory employees receive full background checks during the hiring process, and access to the product is strictly controlled by our CTO.
* Employee role changes and termination events include an immediate review of access which is assigned on a need to know basis commensurate with employee responsibilities. Terminated employees immediately lose access to email, files, and use of company systems and networks.
* DreamFactory utilizes a Password Manager system that enforces the updated recommendations in NIST 800-63-3, and employees may not share passwords or access. This is supervised through the use of logging and reporting controls.

### How does DreamFactory prevent accidental information disclosure?

* All DreamFactory employees receive cybersecurity training during onboarding and periodically throughout the year.
* Role based permissions are employed and access is granted based on individual responsibilities and time required.
* Internal company data is secured in the cloud through GSuite's Data Loss Prevention (DLP) tools, and employees are granted access on a need to know basis based on their role within DreamFactory.

### What DreamFactory safeguards are in place to prevent the loss of data?

* Employees have limited access to DreamFactory information and no access to customer data.
* Internal company data is secured in the cloud through GSuite's Data Loss Prevention (DLP) tools, and employees are granted access on a need to know basis based on their role within DreamFactory.
* DreamFactory security policies do not allow employees to use external media.
* DreamFactory utilizes MacOS systems and the included Apple FileVault product to encrypt all data at rest. Should a laptop be stolen, all data will remain encrypted and can be remotely wiped. Customer data is never saved on company systems and devices.
* Dreamfactory intellectual property and proprietary product information is backed up in secure cloud enclaves and managed by our CTO and technical staff.
* Two-Factor Authentication is required for access to company data.

### What DreamFactory safeguards are in place to alleviate privacy concerns?

* Customer privacy is a paramount concern for DreamFactory. This focus goes to the heart of our product which allows customers to retain full control of their data, as well as rapidly create and manage personalized controls.
* As a rule, DreamFactory collects only the information absolutely required, stores it only as long as it is needed, and shares it with the absolute minimum number of employees.
* Our policies are designed in compliance with key privacy regulations such as GDPR, PIPEDA, COPPA, HIPAA and FERPA.
* Our goal is to be fully transparent and responsive with our customers on privacy issues.

## Implementation Security

### What is the recommended application hardening document for production deployment of DreamFactory?

DreamFactory is an HTTP-based platform which supports a wide array of operating systems (both Windows and Linux) and web servers (notably Nginx, Apache, and IIs), and therefore administrators are encouraged to follow any of the many available hardening resources for general guidance. Hardening in the context of DreamFactory would primarily be a result of software-level hardening, and several best practices are presented in the next answer.

:::info[Note]
We're happy to provide further guidance on this matter after learning more about the target operating system.
:::

### How should DreamFactory administrators ensure the data security and integrity for production deployment?

Data security and integrity is ensured by following key best practices associated with building any HTTP-based API solution:

* Ensure the server software (Nginx, PHP, etc) and associated dependencies are updated to reduce the possibility of third-party intrusion through disclosed exploits.
* Stay up to date with DreamFactory correspondence regarding any potential platform security issues.
* Periodically audit the DreamFactory role definitions to ensure proper configuration.
* Periodically audit database user accounts used for API generation and communication to ensure proper configuration. In this case, proper configuration is defined as ensuring each user account is assigned a minimally viable set of privileges required for the API to function is desired.
* Periodically audit API keys, disabling or deleting keys no longer in active use.
* If applicable (requires Enterprise license), use DreamFactory's logging integration to send traffic logs to a real-time monitoring solution such as Elastic Stack or Splunk.
* If applicable (requires Enterprise license), use DreamFactory's restricted administrator feature to limit administrator privileges.

### What is the method for DreamFactory Encryption for data at Rest? Is it enabled by default or do we have to do it manually?

DreamFactory does not by default store any API data as it passes through the platform. Some connectors offer an API data caching option which will improve performance, however the administrator must explicitly enable this option. Should caching be enabled, data can be stored in one of several supported caching solutions, including Redis and Memcached. Solutions such as Redis are designed to be accessed by "trusted clients within trusted environments", as described by for instance the Redis documentation: https://redis.io/topics/security.

### How does DreamFactory encrypt data in transit? Is it enabled by default or are additional steps required?

DreamFactory plugs into a variety of third-party data sources, including databases such as Microsoft SQL Server and MySQL, file systems such as S3, and third-party HTTP APIs such as Salesforce, Intercom, and Twitter. DreamFactory will then serve as a conduit for clients desiring to interacting with these data sources via an HTTP-based API. 

DreamFactory runs atop a standard web server such as Apache or Nginx, both of which support SSL-based communication. Provided HTTPS is enabled, all correspondence between DreamFactory and the respective clients will be encrypted.

## Troubleshooting

### I lost my DreamFactory administrator password. How can I recover it?

DreamFactory uses one-way encryption for passwords, meaning that once they are encrypted they cannot be decrypted. If email-based password recovery has not been configured, you can create a new administrator account by logging into the terminal console included with all versions of DreamFactory.
   
**1. Navigate to your DreamFactory root directory**
:::info[Connection Method by Deployment]
<Tabs>
  <TabItem value="vm/linux" label="VM/Linux">
  **Connect to your server**
  ```bash
  ssh <user>@<host>
  ```
  *ex. `ssh root@196.152.3.2`*

  **Go to DreamFactory root directory**
  ```bash
  cd /opt/dreamfactory
  ```
  </TabItem>
  <TabItem value="docker" label="Docker">
    **Connect to Docker web container**
    ```bash
    docker exec -it <container-name-or-id> bash
    ```
    *ex. `docker exec -it 61876e86a4c4 bash`*

    **Go to DreamFactory root directory**
    ```bash
    cd /opt/dreamfactory
    ```
    *Note*: Docker exec typically lands you in the root directory already; use this only if needed*
  </TabItem>
</Tabs>
:::
**2. Enter the terminal console:**
```bash
php artisan tinker
```
**3. Retrieve the desired administrator account:**
```php
$u = \DreamFactory\Core\Models\User::where('email', '<known-admin-email>')->first();
```
**4. Change the password and save:**
```php
$u->password = '<new-16-character-password>';
$u->save();
```
**5. Exit the console:**
```php
exit
```

You can confirm the password has been encrypted (hashed) by referencing the `$u` object's `password` attribute after setting it:

```php
$u->password
```

This will display the hashed version of your password, confirming the encryption is working.
