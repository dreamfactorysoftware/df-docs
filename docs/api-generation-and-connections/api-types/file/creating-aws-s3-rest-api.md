---
draft: true
sidebar_position: 2
title: Creating an AWS S3 REST API
id: creating-an-aws-s3-rest-api
---

# Creating an AWS S3 REST API

The DreamFactory AWS S3 connector offers a convenient REST-based interface for interacting with S3 objects and buckets. Supporting all of the standard CRUD operations, it's easy to interact with and manage your S3 data. Further, because the S3 API is native to DreamFactory, it's easy to integrate S3 actions alongside other API-driven tasks such as:

* Uploading a newly registered user avatar to S3 while inserting the user's registration information into a database
* Emailing a website visitor a link to your product PDF after writing the user's email address to your marketing automation software
* Creating a new S3 bucket as part of a Dev Ops workflow

Further, because the API is part of the DreamFactory API management ecosystem, you can apply DreamFactory's context-specific role-based access controls to your AWS S3 API, attach API request volume limiting controls, and audit access logs via DreamFactory's Logstash integration.

## Generating the AWS S3 API and Companion Documentation

To generate your S3 API, log into DreamFactory and click on the `Services` tab, then click the `Create` link located on the left side of the page. Click on the `Select Service Type` dropdown, navigate to the `File` category, and select `AWS S3`:

[SCREENSHOT: Creating a DreamFactory AWS S3 API]

You'll be prompted to supply an API name, label, and description. Keep in mind the name must be lowercase and alphanumeric, as it will be used as the namespace within your generated API URI structure. The label and description are used for reference purposes within the administration console so you're free to title these as you please:

[SCREENSHOT: AWS S3 API Info Screen]

Next, click the `Config` tab. There you'll supply the AWS S3 bucket connection credentials. There are however only 3 required fields:

* **Access Key ID**: An AWS account root or IAM access key.
* **Secret Access Key**: An AWS account root or IAM secret key.
* **Region**: Select the region to be accessed by this service connection.
* **Container**: Enter a Container (root directory) for your storage service. It will be created if it does not exist already.

[SCREENSHOT: AWS S3 API Config Screen]

After saving your changes, head over to the `API Docs` tab to review the generated documentation. You'll be presented with a list of generated endpoints. The operations listed for an SFTP connector are the same for the AWS S3 Container as well.

## Downloading Files

To download a file you'll send a GET request to the AWS S3 API, identifying the path and file name in the URL:

```
https://abhii.apps.dreamfactory.com/api/v2/dreamfactorys3/DreamFactoryExtends&EnhancesERPFunctionality.pdf
```

If you're using a tool such as Insomnia, you can view many file types within the response preview:

[SCREENSHOT: Downloading a File from a DreamFactory S3 API]

Snapshot of the file on S3:

[SCREENSHOT: AWS S3 Dashboard] 