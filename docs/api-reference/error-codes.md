# Error Codes Reference

HTTP status codes and exception classes returned by DreamFactory APIs.

## Error Response Format

All errors return a consistent JSON structure:

```json
{
  "error": {
    "code": 400,
    "message": "Bad Request",
    "context": {
      "field": "email",
      "error": "Invalid email format"
    }
  }
}
```

---

## Client Errors (4xx)

### 400 Bad Request

**Exception Class:** `BadRequestException`

The request is malformed or contains invalid data.

**Common Causes:**
- Invalid JSON in request body
- Missing required fields
- Invalid field values or types
- Malformed filter expression

**How to Fix:**
- Validate JSON syntax before sending
- Check required fields in documentation
- Verify data types match schema

**Example:**
```json
{
  "error": {
    "code": 400,
    "message": "Invalid JSON: Syntax error"
  }
}
```

---

### 400 Invalid JSON

**Exception Class:** `InvalidJsonException`

Request body contains malformed JSON.

**Common Causes:**
- Trailing commas in JSON
- Unquoted keys
- Single quotes instead of double quotes
- Unclosed brackets or braces

**How to Fix:**
```bash
# Validate JSON before sending
echo '{"name": "test"}' | jq .
```

---

### 400 Batch Error

**Exception Class:** `BatchException`

One or more operations in a batch request failed.

**Response includes details for each failed operation:**
```json
{
  "error": {
    "code": 400,
    "message": "Batch operation error",
    "context": {
      "errors": [
        {"index": 0, "message": "Duplicate key value"},
        {"index": 2, "message": "Foreign key violation"}
      ]
    }
  }
}
```

**How to Fix:**
- Review individual error messages
- Fix problematic records and retry

---

### 401 Unauthorized

**Exception Class:** `UnauthorizedException`

Authentication required or credentials invalid.

**Common Causes:**
- Missing API key or session token
- Expired session token
- Invalid API key
- API key not associated with an app

**How to Fix:**
- Include `X-DreamFactory-API-Key` header
- Or include `X-DreamFactory-Session-Token` header
- Refresh expired sessions via `/api/v2/user/session`

**Example Request (correct):**
```bash
curl -X GET "https://example.com/api/v2/db/_table/contacts" \
  -H "X-DreamFactory-API-Key: your-api-key"
```

---

### 403 Forbidden

**Exception Class:** `ForbiddenException`

Authenticated but not authorized for this action.

**Common Causes:**
- Role lacks permission for this service
- Role lacks permission for this table/endpoint
- Role lacks permission for this HTTP method
- Trying to access admin endpoints as non-admin

**How to Fix:**
- Check role permissions in admin panel
- Verify service access is granted to role
- Confirm HTTP method is allowed

---

### 404 Not Found

**Exception Class:** `NotFoundException`

Resource does not exist.

**Common Causes:**
- Table does not exist
- Record with given ID not found
- Service name is incorrect
- Stored procedure/function does not exist

**How to Fix:**
- Verify table name: `GET /api/v2/{service}/_schema`
- Verify record exists before update/delete
- Check service name in system config

---

### 409 Conflict

**Exception Class:** `ConflictResourceException`

Resource state conflict.

**Common Causes:**
- Duplicate primary key
- Unique constraint violation
- Foreign key constraint violation
- Concurrent modification conflict

**How to Fix:**
- Check for existing records before insert
- Use upsert if `allow_upsert` is enabled
- Verify foreign key references exist

**Example:**
```json
{
  "error": {
    "code": 409,
    "message": "Duplicate entry 'john@example.com' for key 'email'"
  }
}
```

---

### 429 Too Many Requests

**Exception Class:** `TooManyRequestsException`

Rate limit exceeded.

**Common Causes:**
- Too many API calls in time window
- Service-level rate limit reached
- User-level rate limit reached

**How to Fix:**
- Implement exponential backoff
- Check `Retry-After` header for wait time
- Batch operations where possible
- Request rate limit increase if needed

**Response Headers:**
```
Retry-After: 60
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1707700800
```

---

## Server Errors (5xx)

### 500 Internal Server Error

**Exception Class:** `InternalServerErrorException`

Unexpected server-side error.

**Common Causes:**
- Database connection failure
- Script execution error
- Configuration error
- Unhandled exception in service logic

**How to Fix:**
- Check server logs for details
- Verify database connectivity
- Review recent configuration changes
- Contact administrator if persistent

---

### 501 Not Implemented

**Exception Class:** `NotImplementedException`

Feature or endpoint not available.

**Common Causes:**
- Requested feature not supported by this database type
- API version mismatch
- Service type does not support this operation

**How to Fix:**
- Check documentation for supported features
- Use alternative approach if available

---

### 503 Service Unavailable

**Exception Class:** `ServiceUnavailableException`

Service temporarily unavailable.

**Common Causes:**
- Database server down
- External service unreachable
- Maintenance mode enabled
- Resource exhaustion (connections, memory)

**How to Fix:**
- Retry with exponential backoff
- Check service health status
- Verify external service availability

---

## Error Handling Best Practices

### 1. Always Check Status Codes

```javascript
const response = await fetch(url, options);
if (!response.ok) {
  const error = await response.json();
  console.error(`Error ${error.error.code}: ${error.error.message}`);
}
```

### 2. Implement Retry Logic

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      await sleep(retryAfter * 1000);
      continue;
    }
    if (response.status >= 500) {
      await sleep(Math.pow(2, i) * 1000);
      continue;
    }
    return response;
  }
  throw new Error('Max retries exceeded');
}
```

### 3. Log Context for Debugging

Include request details when logging errors:
- Request URL and method
- Request body (sanitized)
- Response status and body
- Timestamp

---

## Quick Reference Table

| Code | Exception Class | Meaning | Action |
|------|-----------------|---------|--------|
| 400 | BadRequestException | Invalid request | Fix request format |
| 400 | InvalidJsonException | Malformed JSON | Validate JSON |
| 400 | BatchException | Batch partial failure | Check individual errors |
| 401 | UnauthorizedException | Auth required | Add API key/token |
| 403 | ForbiddenException | Access denied | Check role permissions |
| 404 | NotFoundException | Not found | Verify resource exists |
| 409 | ConflictResourceException | Conflict | Handle duplicates |
| 429 | TooManyRequestsException | Rate limited | Backoff and retry |
| 500 | InternalServerErrorException | Server error | Check logs |
| 501 | NotImplementedException | Not supported | Use alternative |
| 503 | ServiceUnavailableException | Unavailable | Retry later |

---

## See Also

- [API Endpoints](api-endpoints.md) - Complete endpoint reference
- [Query Parameters](query-parameters.md) - Filter and pagination
