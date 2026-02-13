---
sidebar_position: 2
title: Local File Storage
id: local-file-storage
description: "Create a REST API for local file storage on the DreamFactory server with full CRUD operations"
keywords: [local storage, file storage, REST API, file upload, file management, server storage]
difficulty: "beginner"
---

# Local File Storage

DreamFactory's Local File Storage connector provides REST API access to files stored directly on the DreamFactory server's filesystem. This is ideal for development, testing, and scenarios where cloud storage is not required.

---

## Use Cases

- **Development and testing**: Quick setup without external dependencies
- **Application assets**: Store images, documents, and static files
- **Temporary file processing**: Upload files for server-side processing
- **Small-scale deployments**: When cloud storage is unnecessary overhead
- **Air-gapped environments**: No internet connectivity required

:::caution[Production Considerations]
For production deployments, consider cloud storage (S3, Azure Blob) for:
- Horizontal scaling (multiple DreamFactory instances)
- Backup and disaster recovery
- CDN integration
- Larger storage capacity
:::

---

## Creating a Local File Storage Service

### Step 1: Navigate to API Generation

Log in to your DreamFactory instance using an administrator account and select the **API Generation & Connections** tab. Set your API Type to **File**.

### Step 2: Create New Service

Click the purple plus button to create a new file service, then search for and select **Local File Storage**.

### Step 3: Configure Service Details

| Field | Description | Example |
| ----- | ----------- | ------- |
| Name | Service name (lowercase, alphanumeric, used in API URL) | `files` |
| Label | Display name in admin console | `Local Files` |
| Description | Service description | `Local file storage for application assets` |

### Step 4: Configure Storage Path

In the **Config** section, specify the root folder path:

| Field | Description | Example |
| ----- | ----------- | ------- |
| Root Folder | Absolute path on the server | `/var/www/storage/files` |

:::warning[Permissions]
Ensure the web server user (e.g., `www-data`, `nginx`) has read/write permissions on the specified root folder:

```bash
sudo mkdir -p /var/www/storage/files
sudo chown -R www-data:www-data /var/www/storage/files
sudo chmod -R 755 /var/www/storage/files
```
:::

### Step 5: Save and Test

Click **Save** to create the service. Navigate to **API Docs** to view the generated endpoints and test operations.

---

## Configuration Options

| Field | Type | Required | Default | Description |
| ----- | ---- | -------- | ------- | ----------- |
| `root_folder` | string | Yes | - | Absolute path to the storage directory |
| `public_path` | string | No | - | Public URL path if files are web-accessible |
| `is_public` | boolean | No | false | Allow unauthenticated file downloads |

### Advanced Options

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `cache_enabled` | boolean | false | Enable response caching |
| `cache_ttl` | integer | 0 | Cache time-to-live in seconds |
| `allow_upsert` | boolean | true | Allow PUT to create new files |

---

## API Endpoints

Once configured, DreamFactory generates these endpoints:

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/v2/{service_name}/` | List root directory |
| `GET` | `/api/v2/{service_name}/{path}/` | List folder contents |
| `GET` | `/api/v2/{service_name}/{path}` | Download file |
| `POST` | `/api/v2/{service_name}/` | Create folder or upload file |
| `POST` | `/api/v2/{service_name}/{path}/` | Create subfolder or upload file |
| `PUT` | `/api/v2/{service_name}/{path}` | Replace file contents |
| `PATCH` | `/api/v2/{service_name}/{path}` | Update file properties |
| `DELETE` | `/api/v2/{service_name}/{path}` | Delete file or folder |

---

## API Examples

### List Directory Contents

```bash
curl -X GET "https://example.com/api/v2/files/" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "resource": [
    {
      "path": "images/",
      "type": "folder",
      "name": "images",
      "last_modified": "2026-02-10T14:30:00Z"
    },
    {
      "path": "config.json",
      "type": "file",
      "name": "config.json",
      "content_type": "application/json",
      "content_length": 2048,
      "last_modified": "2026-02-09T10:15:00Z"
    }
  ]
}
```

### Create a Folder

```bash
curl -X POST "https://example.com/api/v2/files/" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "X-Folder-Name: documents"
```

**Response:**
```json
{
  "name": "documents",
  "path": "documents/"
}
```

### Upload a File

Using the file path in the URL:

```bash
curl -X POST "https://example.com/api/v2/files/documents/report.pdf" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/pdf" \
  --data-binary @report.pdf
```

Using the `X-File-Name` header:

```bash
curl -X POST "https://example.com/api/v2/files/documents/" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "X-File-Name: report.pdf" \
  -H "Content-Type: application/pdf" \
  --data-binary @report.pdf
```

**Response:**
```json
{
  "name": "report.pdf",
  "path": "documents/report.pdf",
  "content_type": "application/pdf",
  "content_length": 102400
}
```

### Download a File

```bash
curl -X GET "https://example.com/api/v2/files/documents/report.pdf" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -o report.pdf
```

### Get File Properties

Add `?include_properties=true` to get metadata without downloading:

```bash
curl -X GET "https://example.com/api/v2/files/documents/report.pdf?include_properties=true" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "path": "documents/report.pdf",
  "name": "report.pdf",
  "type": "file",
  "content_type": "application/pdf",
  "content_length": 102400,
  "last_modified": "2026-02-10T15:45:00Z"
}
```

### Delete a File

```bash
curl -X DELETE "https://example.com/api/v2/files/documents/old-report.pdf" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

### Delete a Folder

Add `?force=true` to delete non-empty folders:

```bash
curl -X DELETE "https://example.com/api/v2/files/old-documents/?force=true" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

---

## File Upload Limits

Upload size limits are controlled by your web server and PHP configuration, not DreamFactory.

### Nginx Configuration

Add to your `nginx.conf` or site configuration:

```nginx
client_max_body_size 100M;
```

### PHP Configuration

Modify `php.ini`:

```ini
upload_max_filesize = 100M
post_max_size = 105M
```

Restart your web server and PHP-FPM after making changes.

---

## Common Errors

| Error Code | Message | Cause | Solution |
| ---------- | ------- | ----- | -------- |
| 400 | Invalid path | Path contains invalid characters | Use alphanumeric characters, dashes, underscores |
| 403 | Forbidden | Permission denied on filesystem | Check folder permissions for web server user |
| 404 | Not Found | File or folder does not exist | Verify the path exists on the server |
| 409 | Conflict | File already exists | Use PUT to overwrite or delete first |
| 413 | Payload Too Large | File exceeds upload limit | Increase server upload limits |
| 500 | Internal Server Error | Server-side error | Check DreamFactory logs for details |

### Troubleshooting Permissions

If you receive 403 errors, verify filesystem permissions:

```bash
# Check current permissions
ls -la /var/www/storage/files

# Fix ownership
sudo chown -R www-data:www-data /var/www/storage/files

# Fix permissions (directories need execute bit)
sudo find /var/www/storage/files -type d -exec chmod 755 {} \;
sudo find /var/www/storage/files -type f -exec chmod 644 {} \;
```

---

## Security Considerations

### Path Traversal Protection

DreamFactory sanitizes paths to prevent directory traversal attacks. Requests containing `../` or absolute paths outside the root folder are rejected.

### Role-Based Access Control

Configure RBAC to restrict file operations:

1. Navigate to **Roles** in the admin console
2. Select or create a role
3. Under **Access**, add the file service
4. Configure allowed paths and operations:
   - **GET** for read-only access
   - **POST** for upload-only
   - **DELETE** to allow deletions

Example: Allow uploads to `/uploads/` but not access to `/config/`:

| Path | Methods |
| ---- | ------- |
| `uploads/*` | GET, POST |
| `public/*` | GET |

---

## Next Steps

- **[AWS S3](./aws-s3)**: Migrate to cloud storage for production
- **[File Services Overview](./file-services-overview)**: Compare all file storage options
- **[Role-Based Access Control](/api-security/rbac)**: Configure fine-grained permissions
