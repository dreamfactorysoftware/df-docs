---
sidebar_position: 3
title: Converting Excel to a JSON Response
id: converting-excel-to-json
---

# Converting Excel to a JSON Response

DreamFactory's Excel connector is capable of turning an entire Excel workbook or specific worksheet into a JSON response (CSV files are also supported). Workbooks can be retrieved from any DreamFactory supported file-system (AWS S3, SFTP, and Azure Blob Storage, among others), or as in the example we will run through below, uploaded directly to the server's local file system. Access is controlled just like any other connector with role-based access control and API keys.

## Creating an Excel Connector Service

To create an Excel connector, log in to your DreamFactory instance using an administrator account and select the **API Generation & Connections** tab. Set your API Type to **File**, and then click the purple plus button to establish a new connection:

![file api creation](/img/api-generation-and-connections/api-types/file/converting-excel-to-json/file-api-creation.png)

Navigate to the **Excel** option in the available service types:

![excel api selection](/img/api-generation-and-connections/api-types/file/converting-excel-to-json/excel-api-selection.png)

Next, provide a name, label and description for your Excel connector service:

![excel service info](/img/api-generation-and-connections/api-types/file/converting-excel-to-json/excel-service-info.png)

In the configuration section, you'll need to set the file storage service. If you have already setup an AWS S3 API or other file service, then that service will be available to you. For this example, we will use the local file storage service, and we will put our Excel file in `/opt/dreamfactory/storage/app` which means we will set the container path as `/` (the 'root' of where DreamFactory will look for locally stored files).

![excel service configuration](/img/api-generation-and-connections/api-types/file/converting-excel-to-json/excel-service-configuration.png)

:::info
The root location for local file storage is `/opt/dreamfactory/storage/app`. If you store an Excel file(s) here, your Storage Container Path will be `/`. If you create a folder in here, e.g. `/opt/dreamfactory/storage/app/my-folder` then your Storage Container Path will be `/my-folder/`.
:::

## Using the Excel API

Once configured, you will be able to access the API endpoint documentation via the API Docs tab. Here we have an example call to our workbook `financial-sample.xlsx`:

![excel api documentation](/img/api-generation-and-connections/api-types/file/converting-excel-to-json/excel-api-documentation.png)

After configuring your Role and generating an API Key, you can interact with the Excel service. The below is a `GET` call to `/api/v2/<excelServiceName>/_spreadsheet/<excelFilename>`:

![excel api with postman](/img/api-generation-and-connections/api-types/file/converting-excel-to-json/excel-api-with-postman.png)

:::info
When creating a role for your Excel connector, you will also need to provide service access to the relevant file storage service, in addition to the Excel service. For local file storage this will be the default "files" service.
:::