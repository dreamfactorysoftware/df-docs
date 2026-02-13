---
sidebar_position: 1
title: File Services Overview
id: file-services-overview
description: "Supported file storage services in DreamFactory - local, cloud, and remote file storage connectors"
keywords: [file storage, AWS S3, Azure Blob, local storage, SFTP, file API, cloud storage]
difficulty: "beginner"
---

# File Services Overview

DreamFactory auto-generates secure REST APIs for file storage systems. Connect any supported storage backend and instantly get endpoints for uploading, downloading, listing, and managing files with role-based access control.

---

## Supported File Services

DreamFactory supports local storage, cloud providers, and remote file servers. Some connectors are included in the open-source package, while others require a commercial license.

### Open Source (Included)

These file storage connectors are included in DreamFactory OSS and all commercial editions:

| Service | Type | Documentation |
| ------- | ---- | ------------- |
| **Local File Storage** | Local | [Local Storage Guide](./local-file-storage) |
| **SFTP** | Remote | [SFTP Guide](../file/creating-an-sftp-rest-api) |
| **FTP** | Remote | Standard FTP protocol |
| **WebDAV** | Remote | WebDAV protocol support |

### Commercial License Required

These file storage connectors require a DreamFactory commercial license:

| Service | Type | Notes |
| ------- | ---- | ----- |
| **AWS S3** | Cloud | [S3 Guide](./aws-s3) |
| **Azure Blob Storage** | Cloud | Microsoft Azure storage |
| **Google Cloud Storage** | Cloud | GCS bucket access |
| **OpenStack Object Storage** | Cloud | Swift-compatible storage |
| **Rackspace Cloud Files** | Cloud | Rackspace object storage |
| **Dropbox** | Cloud | OAuth-based access |
| **Box** | Cloud | Enterprise file sharing |
| **OneDrive** | Cloud | Microsoft 365 integration |
| **SharePoint** | Cloud | Microsoft SharePoint libraries |
| **GridFS** | Database | MongoDB file storage |

:::info[Licensing]
For commercial file service connector licensing, contact [DreamFactory Sales](https://www.dreamfactory.com/contact) or visit the [pricing page](https://www.dreamfactory.com/pricing).
:::

---

## Common Features Across All File Services

Regardless of which storage backend you connect, DreamFactory provides:

### Auto-Generated REST Endpoints

| Endpoint | Methods | Description |
| -------- | ------- | ----------- |
| `/{service_name}/` | `GET` | List root directory contents |
| `/{service_name}/{folder_path}/` | `GET, POST, PATCH, DELETE` | Folder operations |
| `/{service_name}/{file_path}` | `GET, POST, PUT, DELETE` | File operations |

### Standard Operations

- **List**: Retrieve folder contents with metadata
- **Upload**: Create or replace files via POST/PUT
- **Download**: Retrieve file contents via GET
- **Delete**: Remove files or folders
- **Move/Copy**: Relocate files within the storage
- **Metadata**: Access file properties (size, modified date, content type)

### Security Features

- **API Key Authentication**: Required for all endpoint access
- **Role-Based Access Control**: Folder and operation-level permissions
- **Rate Limiting**: Configurable throttling per user or role
- **Audit Logging**: Track all file operations

---

## Choosing the Right File Service

### By Use Case

| Use Case | Recommended Service |
| -------- | ------------------- |
| Development/testing | Local File Storage |
| Application assets in production | AWS S3, Azure Blob, GCS |
| Legacy system integration | SFTP, FTP |
| Enterprise document management | SharePoint, Box |
| User file uploads | S3, Azure Blob (with pre-signed URLs) |
| MongoDB-backed applications | GridFS |

### By Cloud Provider

| Cloud Provider | Native Service | DreamFactory Connector |
| -------------- | -------------- | ---------------------- |
| AWS | S3 | AWS S3 |
| Google Cloud | Cloud Storage | Google Cloud Storage |
| Microsoft Azure | Blob Storage | Azure Blob Storage |
| Self-hosted | Local/SFTP | Local File Storage, SFTP |

---

## File Service Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   API Client    │────▶│   DreamFactory   │────▶│  File Storage   │
│  (App/Service)  │◀────│   (REST API)     │◀────│    Backend      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
    HTTP/HTTPS              Connector              Native Protocol
    + API Key               (S3 SDK,               (S3 API, SFTP,
    + JWT (optional)         Azure SDK, etc.)       local filesystem)
```

### Key Architectural Points

1. **DreamFactory acts as a secure proxy** - Storage credentials are never exposed to API clients
2. **Unified API interface** - Same REST patterns regardless of storage backend
3. **Streaming support** - Large files are streamed, not buffered in memory
4. **Content type handling** - Automatic MIME type detection and headers

---

## Configuration Options

All file services share these common configuration fields:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `name` | string | Service name (used in API URL) |
| `label` | string | Display name in admin console |
| `description` | string | Service description |
| `is_active` | boolean | Enable/disable the service |
| `cache_enabled` | boolean | Enable response caching |
| `cache_ttl` | integer | Cache time-to-live in seconds |

Service-specific configuration options are documented in each service guide.

---

## Common API Examples

### List Directory Contents

```bash
curl -X GET "https://example.com/api/v2/{service_name}/" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

Response:
```json
{
  "resource": [
    {
      "path": "documents/",
      "type": "folder",
      "name": "documents",
      "last_modified": "2026-02-10T14:30:00Z"
    },
    {
      "path": "readme.txt",
      "type": "file",
      "name": "readme.txt",
      "content_type": "text/plain",
      "content_length": 1024,
      "last_modified": "2026-02-09T10:15:00Z"
    }
  ]
}
```

### Upload a File

```bash
curl -X POST "https://example.com/api/v2/{service_name}/documents/report.pdf" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/pdf" \
  --data-binary @report.pdf
```

### Download a File

```bash
curl -X GET "https://example.com/api/v2/{service_name}/documents/report.pdf" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -o report.pdf
```

### Delete a File

```bash
curl -X DELETE "https://example.com/api/v2/{service_name}/documents/old-report.pdf" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

---

## Common Errors

| Error Code | Message | Cause | Solution |
| ---------- | ------- | ----- | -------- |
| 400 | Bad Request | Invalid path or parameters | Check path format and parameter values |
| 401 | Unauthorized | Missing or invalid API key | Verify API key in request header |
| 403 | Forbidden | Insufficient permissions | Check role permissions for the path/operation |
| 404 | Not Found | File or folder does not exist | Verify the path exists |
| 409 | Conflict | File already exists (on create) | Use PUT to overwrite or delete first |
| 413 | Payload Too Large | File exceeds size limit | Check server upload limits |
| 503 | Service Unavailable | Storage backend unreachable | Verify backend connectivity and credentials |

---

## Next Steps

- **[Local File Storage](./local-file-storage)**: Store files on the DreamFactory server
- **[AWS S3](./aws-s3)**: Connect to Amazon S3 buckets
- **[SFTP](../file/creating-an-sftp-rest-api)**: Connect to remote SFTP servers

For file service-specific questions, consult the individual guides or contact DreamFactory support.
