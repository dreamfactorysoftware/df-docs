---
draft: true
sidebar_position: 3
title: Converting Excel to a JSON Response
id: converting-excel-to-json
---

# Converting Excel to a JSON Response

DreamFactory's Excel connector is capable of turning an entire Excel workbook or specific worksheet into a JSON response (CSV files are also supported). Workbooks can be retrieved from any DreamFactory supported file-system (AWS S3, SFTP, and Azure Blob Storage, among others), or as in the example we will run through below, uploaded directly to the server's local file system. Access is controlled just like any other connector with role-based access control and API keys.

To create an Excel connector, create a new service, and choose it from the Service Type Box:

[SCREENSHOT: Converting Excel to a JSON Response with DreamFactory]

Next, on the config tab, we will set the file storage service. If you have already setup an, e.g. AWS S3 API, then this service will be available to you. For this example, we will use the local file storage service, and we will put our Excel file in `/opt/dreamfactory/storage/app` which means we will set the container path as `/` (the 'root' of where DreamFactory will look for locally stored files). You can also upload a spreadsheet directly using the `Browse` button:

[SCREENSHOT: DreamFactory Excel Service Info]

The location of our Excel File:

[SCREENSHOT: DreamFactory Excel Service Configuration]

## Remember!

The root location for local file storage is `/opt/dreamfactory/storage/app`. If you store an Excel file(s) here, your Storage Container Path will be `/`. If you create a folder in here, e.g. `/opt/dreamfactory/storage/app/my-folder` then your Storage Container Path will be `/my-folder/`.

Once configured, you will be to access the API endpoint documentation via the API Docs tab. Here we have an example call to our workbook `financial-sample.xlsx`:

[SCREENSHOT: DreamFactory Excel API Configuration]

And after configuring our Role and generating an API Key we can interact with it. The below is a `GET` call to `/api/v2/<excelServiceName>/_spreadsheet/<excelFilename>`:

[SCREENSHOT: Using the DreamFactory Excel API with Postman]

## Remember!

When creating a role for your Excel connector, you will also need to provide service access to the relevant file storage service, in addition to the Excel service. For local file storage this will be the default "files" service. 