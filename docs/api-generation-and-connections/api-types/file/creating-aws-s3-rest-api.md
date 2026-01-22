---
sidebar_position: 2
title: Creating an AWS S3 REST API
id: creating-an-aws-s3-rest-api
description: "Generate a REST API for AWS S3 buckets to manage files with role-based access and rate limiting"
keywords: [AWS S3, file storage, REST API, cloud storage, S3 bucket, file upload, file download]
difficulty: "intermediate"
---

# Creating an AWS S3 REST API

The DreamFactory AWS S3 connector offers a convenient REST-based interface for interacting with S3 objects and buckets. Supporting all of the standard CRUD operations, it's easy to interact with and manage your S3 data. Further, because the S3 API is native to DreamFactory, it's easy to integrate S3 actions alongside other API-driven tasks such as:

* Uploading a newly registered user avatar to S3 while inserting the user's registration information into a database
* Emailing a website visitor a link to your product PDF after writing the user's email address to your marketing automation software
* Creating a new S3 bucket as part of a Dev Ops workflow

Further, because the API is part of the DreamFactory API management ecosystem, you can apply DreamFactory's context-specific role-based access controls to your AWS S3 API, attach API request volume limiting controls, and audit access logs via DreamFactory's Logstash integration.

## Generating the AWS S3 API and Companion Documentation

To generate an AWS S3 REST API, log in to your DreamFactory instance using an administrator account and select the **API Generation & Connections** tab. Set your API Type to **File**, and then click the purple plus button to establish a new connection:

![file api creation](/img/api-generation-and-connections/api-types/file/creating-aws-s3-rest-api/file-api-creation.png)

Numerous file storage methods such as SFTP, Azure Blob, Rackspace, and more are available. For this tutorial, search for and select `AWS S3`:

![aws s3 api selection](/img/api-generation-and-connections/api-types/file/creating-aws-s3-rest-api/aws-s3-api-selection.png)

You'll be prompted to supply an API name, label, and description. Keep in mind the name must be lowercase and alphanumeric, as it will be used as the namespace within your generated API URI structure. The label and description are used for reference purposes within the administration console so you're free to title these as you please:

![aws s3 details](/img/api-generation-and-connections/api-types/file/creating-aws-s3-rest-api/aws-s3-details.png)

Next, you'll scroll down to `Advanced Options`. There you'll supply the AWS S3 bucket connection credentials.

![aws s3 config](/img/api-generation-and-connections/api-types/file/creating-aws-s3-rest-api/aws-s3-config.png)

## Downloading Files

To download a file you'll send a GET request to the AWS S3 API, identifying the path and file name in the URL:

```
https://abhii.apps.dreamfactory.com/api/v2/dreamfactorys3/DreamFactoryExtends&EnhancesERPFunctionality.pdf
```

If you're using a tool such as Insomnia, you can view many file types within the response preview:

![aws s3 download file](/img/api-generation-and-connections/api-types/file/creating-aws-s3-rest-api/aws-s3-download-file.png)

Snapshot of the file on S3:

![aws s3 dashboard](/img/api-generation-and-connections/api-types/file/creating-aws-s3-rest-api/aws-s3-dashboard.png) 