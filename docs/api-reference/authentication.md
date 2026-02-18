---
sidebar_position: 0
title: Authentication
id: authentication
description: How to authenticate with DreamFactory — correct login endpoints, API keys, session tokens, and common mistakes.
keywords: [authentication, session token, JWT, API key, login, admin session, user session, system/admin/session]
---

# Authentication

## The Two-Credential System

Every DreamFactory request needs **both**:

| Header | Purpose | Where to get it |
|--------|---------|-----------------|
| `X-DreamFactory-API-Key` | Identifies the **app** | Admin UI → Apps, or via tinker |
| `X-DreamFactory-Session-Token` | Identifies the **logged-in user** | Returned by login endpoint |

The API key alone is enough for some public endpoints. Most operations require both.

---

## Admin Login (System Administrators)

```
POST /api/v2/system/admin/session
```

> ⚠️ **This is the only correct endpoint for admin users.** The following will NOT work:
> - `/api/v2/admin/session` → returns "JWT required" error
> - `/api/v2/user/session` → returns "missing required email" error
> - Any of the above without `X-DreamFactory-API-Key` header

**Required headers:**
```
Content-Type: application/json
X-DreamFactory-API-Key: <admin-app-api-key>
```

**Request body:**
```json
{
  "email": "admin@example.com",
  "password": "yourpassword"
}
```

**Full working example:**
```bash
curl -s -X POST http://your-df-host/api/v2/system/admin/session \
  -H "Content-Type: application/json" \
  -H "X-DreamFactory-API-Key: YOUR_ADMIN_APP_API_KEY" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'
```

**Response:**
```json
{
  "session_token": "eyJ0eXAiOiJKV1Qi...",
  "session_id": "eyJ0eXAiOiJKV1Qi...",
  "id": 1,
  "name": "Admin User",
  "email": "admin@example.com",
  "is_sys_admin": true,
  "last_login_date": "2026-02-18 19:45:18",
  "token_expiry_date": "2026-02-19 19:45:18"
}
```

Save the `session_token` — use it as `X-DreamFactory-Session-Token` in all subsequent requests.

---

## Regular User Login

```
POST /api/v2/user/session
```

Same pattern as admin login. Requires `Content-Type: application/json` and `X-DreamFactory-API-Key`.

```bash
curl -s -X POST http://your-df-host/api/v2/user/session \
  -H "Content-Type: application/json" \
  -H "X-DreamFactory-API-Key: YOUR_APP_API_KEY" \
  -d '{"email":"user@example.com","password":"yourpassword"}'
```

---

## Getting the Admin App API Key

The `admin` app is created automatically on first setup. Three ways to get its key:

**Via artisan tinker (server access):**
```bash
sudo docker exec -i df-docker-web-1 php artisan tinker <<'EOF'
echo \DreamFactory\Core\Models\App::where('name','admin')->first()->api_key;
EOF
```

**Via API (once you have a session):**
```bash
curl -s http://your-df-host/api/v2/system/app \
  -H "X-DreamFactory-API-Key: YOUR_KEY" \
  -H "X-DreamFactory-Session-Token: YOUR_TOKEN" | python3 -m json.tool
```

**Via Admin UI:** Apps → admin → copy API Key field.

---

## Using the Session Token

Include both headers on all subsequent requests:

```bash
curl -s http://your-df-host/api/v2/system/service \
  -H "X-DreamFactory-API-Key: YOUR_ADMIN_APP_API_KEY" \
  -H "X-DreamFactory-Session-Token: YOUR_SESSION_TOKEN"
```

Tokens expire after **24 hours** by default. Re-POST to the login endpoint to refresh.

---

## Refresh / Check Current Session

```bash
# GET refreshes the token and returns current user info
curl -s -X GET http://your-df-host/api/v2/system/admin/session \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "X-DreamFactory-Session-Token: YOUR_SESSION_TOKEN"
```

---

## Logout

```bash
curl -s -X DELETE http://your-df-host/api/v2/system/admin/session \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "X-DreamFactory-Session-Token: YOUR_SESSION_TOKEN"
```

---

## Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Login request is missing required email` | Wrong endpoint (`user/session` for admin) or missing `Content-Type` header | Use `POST /api/v2/system/admin/session` with `Content-Type: application/json` |
| `No session token (JWT) provided` | Using `/api/v2/admin/session` (wrong endpoint) | Use `/api/v2/system/admin/session` |
| `No session token or API Key detected` | Missing `X-DreamFactory-API-Key` header | Add the admin app's API key header |
| `Invalid credentials supplied` | Wrong password, or password set without DF's model (raw bcrypt won't match) | Reset via `php artisan tinker` using the DF User model — it handles hashing |
| `401 Unauthorized` | Expired or invalid session token | Re-authenticate to get a new token |

---

## Quick Reference — Endpoint Summary

| Action | Method | Endpoint | Needs API Key | Needs Session Token |
|--------|--------|----------|:---:|:---:|
| Admin login | POST | `/api/v2/system/admin/session` | ✅ | ❌ |
| User login | POST | `/api/v2/user/session` | ✅ | ❌ |
| Check/refresh session | GET | `/api/v2/system/admin/session` | ✅ | ✅ |
| Logout | DELETE | `/api/v2/system/admin/session` | ✅ | ✅ |
| Any system operation | * | `/api/v2/system/*` | ✅ | ✅ |
| Any data operation | * | `/api/v2/{service}/_table/*` | ✅ | ✅ |
