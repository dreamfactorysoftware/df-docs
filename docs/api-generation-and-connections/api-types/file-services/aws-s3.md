---
sidebar_position: 3
title: AWS S3
id: aws-s3
description: "Create a REST API for AWS S3 buckets to manage files with role-based access and rate limiting"
keywords: [AWS S3, file storage, REST API, cloud storage, S3 bucket, file upload, file download, Amazon S3]
difficulty: "intermediate"
---

# AWS S3

DreamFactory's AWS S3 connector provides a REST-based interface for interacting with S3 objects and buckets. Supporting all standard CRUD operations, you can easily manage your S3 data through a unified API. Because the S3 API is native to DreamFactory, you can integrate S3 actions alongside other API-driven tasks:

- Upload a newly registered user avatar to S3 while inserting registration data into a database
- Email a website visitor a link to a product PDF after writing their email to your CRM
- Create new S3 buckets as part of a DevOps workflow
- Apply DreamFactory's role-based access controls, rate limiting, and audit logging

---

## Use Cases

- **Application file storage**: User uploads, media assets, documents
- **Static asset hosting**: Images, CSS, JavaScript for web applications
- **Data lake integration**: Store and retrieve data files for analytics
- **Backup storage**: Archive files from other systems
- **Multi-tenant file isolation**: Per-customer folders with RBAC

---

## Prerequisites

Before configuring the S3 connector, you need:

1. **AWS Account** with S3 access
2. **S3 Bucket** created in your desired region
3. **IAM User or Role** with S3 permissions
4. **Access Key ID and Secret Access Key** for the IAM user

### Minimum IAM Policy

Create an IAM policy with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

---

## Creating an AWS S3 Service

### Step 1: Navigate to API Generation

Log in to your DreamFactory instance using an administrator account and select the **API Generation & Connections** tab. Set your API Type to **File**.

### Step 2: Create New Service

Click the purple plus button to create a new file service, then search for and select **AWS S3**.

### Step 3: Configure Service Details

| Field | Description | Example |
| ----- | ----------- | ------- |
| Name | Service name (lowercase, alphanumeric, used in API URL) | `s3files` |
| Label | Display name in admin console | `AWS S3 Storage` |
| Description | Service description | `Production file storage on S3` |

### Step 4: Configure AWS Credentials

Scroll to the **Config** section and enter your AWS credentials:

| Field | Required | Description |
| ----- | -------- | ----------- |
| Access Key ID | Yes | AWS IAM access key |
| Secret Access Key | Yes | AWS IAM secret key |
| Region | Yes | AWS region (e.g., `us-east-1`, `eu-west-1`) |
| Bucket | Yes | S3 bucket name |
| Container | No | Subdirectory within bucket to use as root |

### Step 5: Save and Test

Click **Save** to create the service. Navigate to **API Docs** to view the generated endpoints and test operations.

---

## Configuration Options

### Required Settings

| Field | Type | Description |
| ----- | ---- | ----------- |
| `key` | string | AWS Access Key ID |
| `secret` | string | AWS Secret Access Key |
| `region` | string | AWS region code |
| `bucket` | string | S3 bucket name |

### Optional Settings

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `container` | string | - | Subdirectory prefix for all operations |
| `endpoint` | string | - | Custom S3-compatible endpoint URL |
| `use_path_style_endpoint` | boolean | false | Use path-style URLs (required for MinIO, LocalStack) |
| `cache_enabled` | boolean | false | Enable response caching |
| `cache_ttl` | integer | 0 | Cache time-to-live in seconds |

### S3-Compatible Storage

DreamFactory's S3 connector works with S3-compatible services by setting a custom endpoint:

| Service | Endpoint Example |
| ------- | ---------------- |
| MinIO | `http://minio.example.com:9000` |
| DigitalOcean Spaces | `https://nyc3.digitaloceanspaces.com` |
| Backblaze B2 | `https://s3.us-west-002.backblazeb2.com` |
| Wasabi | `https://s3.wasabisys.com` |

Set `use_path_style_endpoint` to `true` for MinIO and similar services.

---

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/v2/{service_name}/` | List bucket root |
| `GET` | `/api/v2/{service_name}/{path}/` | List folder contents |
| `GET` | `/api/v2/{service_name}/{path}` | Download file |
| `POST` | `/api/v2/{service_name}/` | Create folder or upload file |
| `POST` | `/api/v2/{service_name}/{path}/` | Create subfolder or upload file |
| `PUT` | `/api/v2/{service_name}/{path}` | Replace file contents |
| `DELETE` | `/api/v2/{service_name}/{path}` | Delete file or folder |

---

## API Examples

### List Bucket Contents

```bash
curl -X GET "https://example.com/api/v2/s3files/" \
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
      "path": "document.pdf",
      "type": "file",
      "name": "document.pdf",
      "content_type": "application/pdf",
      "content_length": 102400,
      "last_modified": "2026-02-09T10:15:00Z"
    }
  ]
}
```

### Upload a File

```bash
curl -X POST "https://example.com/api/v2/s3files/uploads/report.pdf" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/pdf" \
  --data-binary @report.pdf
```

**Response:**
```json
{
  "name": "report.pdf",
  "path": "uploads/report.pdf",
  "content_type": "application/pdf",
  "content_length": 102400
}
```

### Download a File

```bash
curl -X GET "https://example.com/api/v2/s3files/uploads/report.pdf" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -o report.pdf
```

### Create a Folder

S3 doesn't have true folders, but DreamFactory creates a placeholder object:

```bash
curl -X POST "https://example.com/api/v2/s3files/" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "X-Folder-Name: documents"
```

### Delete a File

```bash
curl -X DELETE "https://example.com/api/v2/s3files/uploads/old-report.pdf" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

### Delete a Folder

Delete all objects with a prefix:

```bash
curl -X DELETE "https://example.com/api/v2/s3files/old-folder/?force=true" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

### Get File Metadata

```bash
curl -X GET "https://example.com/api/v2/s3files/uploads/report.pdf?include_properties=true" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "path": "uploads/report.pdf",
  "name": "report.pdf",
  "type": "file",
  "content_type": "application/pdf",
  "content_length": 102400,
  "last_modified": "2026-02-10T15:45:00Z"
}
```

---

## Pre-Signed URLs

For large file uploads or direct client-to-S3 access, use pre-signed URLs:

```bash
curl -X GET "https://example.com/api/v2/s3files/uploads/large-file.zip?url=true&expires=3600" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "url": "https://bucket.s3.amazonaws.com/uploads/large-file.zip?X-Amz-Algorithm=..."
}
```

The `expires` parameter sets the URL validity in seconds (default: 3600).

---

## File Upload Limits

Upload size limits are controlled by your web server, PHP configuration, and S3:

### Server Configuration

See [Local File Storage - File Upload Limits](./local-file-storage#file-upload-limits) for Nginx and PHP settings.

### S3 Limits

| Limit | Value |
| ----- | ----- |
| Maximum object size | 5 TB |
| Maximum single PUT | 5 GB |
| Multipart upload threshold | 100 MB (recommended) |

For files larger than 100 MB, consider using pre-signed URLs for direct upload.

---

## Common Errors

| Error Code | Message | Cause | Solution |
| ---------- | ------- | ----- | -------- |
| 400 | Bad Request | Invalid parameters | Check path and request format |
| 401 | Unauthorized | Invalid API key | Verify DreamFactory API key |
| 403 | Access Denied | AWS permissions issue | Check IAM policy and bucket policy |
| 404 | Not Found | Object does not exist | Verify the S3 key exists |
| 409 | Conflict | Object already exists | Use PUT to overwrite |
| 413 | Payload Too Large | File exceeds limits | Increase server limits or use pre-signed URL |
| 503 | Service Unavailable | S3 unreachable | Check network connectivity and AWS status |

### Troubleshooting AWS Errors

**Access Denied (403)**:
1. Verify IAM user has correct permissions
2. Check bucket policy allows access
3. Confirm region matches bucket location
4. Verify Access Key ID and Secret are correct

**Bucket Not Found**:
1. Confirm bucket name spelling
2. Verify bucket exists in specified region
3. Check bucket hasn't been deleted

---

## Security Best Practices

### IAM Configuration

1. **Use dedicated IAM user** for DreamFactory
2. **Minimal permissions** - only grant required actions
3. **Restrict to specific bucket** - don't use wildcard resources
4. **Rotate credentials** regularly

### Bucket Configuration

1. **Block public access** unless specifically required
2. **Enable versioning** for critical data
3. **Enable server-side encryption** (SSE-S3 or SSE-KMS)
4. **Enable access logging** for audit trails

### DreamFactory RBAC

Layer DreamFactory's RBAC on top of AWS permissions:

| Scenario | Configuration |
| -------- | ------------- |
| Read-only access | Allow GET only |
| Upload-only | Allow POST to specific paths |
| User isolation | Use filters to restrict by user ID folder |

---

## Cost Optimization

### Request Pricing

S3 charges per request. Optimize by:
- Enabling caching in DreamFactory
- Batching operations where possible
- Using LIST sparingly (costs more than GET)

### Data Transfer

- **Within region**: Free between S3 and EC2
- **Internet egress**: Charged per GB
- **CloudFront**: Can reduce costs for high-traffic reads

---

## Next Steps

- **[File Services Overview](./file-services-overview)**: Compare all file storage options
- **[Local File Storage](./local-file-storage)**: Store files on the server
- **[Role-Based Access Control](/api-security/rbac)**: Configure fine-grained permissions
