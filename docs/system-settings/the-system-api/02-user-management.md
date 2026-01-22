---
sidebar_position: 2
title: User Management
id: user-management
description: "Manage users and admins via the System API with endpoints for creating, updating, and deleting accounts"
keywords: [user management, admin API, system API, user creation, user deletion, email invitation]
difficulty: "intermediate"
---

# User Management

Users and Admins can be managed using the `/system/user` and `/system/admin` endpoints respectively.

For the below examples, replace `user` with `admin` when managing admins.

## Get User / Admin Details

**Endpoint:** `GET https://{url}/api/v2/system/user`

**Curl Equivalent:**
```bash
curl -X GET "https://{url}/api/v2/system/user" -H "accept: application/json" \
-H "X-DreamFactory-Session-Token: <session_token>"
```

You can retrieve an individual user / admin's details using the `?ids=<id_number>` parameter. If you don't know the id number off hand, you can filter by any field which you do know, such as an email address by using the filter parameter. For example:

```text
https://{url}/api/v2/system/user?filter=email=tomo@example.com
```

## Creating a User / Admin

### Without Email Invitation

**Endpoint:** `POST https://{url}/api/v2/system/user`

You will need to provide your session token in a `X-DreamFactory-Session-Token` header.

**Request Body:**
```json
{
  "resource": [
    {
      "name": "display_name",           // Required field
      "first_name": "first_name",
      "last_name": "user_last_name",
      "email": "email_address",         // Required field
      "password": "password"
    }
  ]
}
```

**Curl Equivalent:**
```bash
curl -X POST "https://<url>/api/v2/system/user" \
-H "accept: application/json" -H "Content-Type: application/json" \
-H "X-DreamFactory-Session-Token: <sessionToken>" \
-d "{\"resource\":[{\"name\":\"<display_name>\",\"first_name\":\"<first_name>\",\"last_name\":\"<last_name>\",\"email\":\"<email_address>\",\"password\":\"<password>\"}]}"
```

### With Email Invitation

**Endpoint:** `POST https://{url}/api/v2/system/user?send_invite=true`

**Request Body:**
```json
{
  "resource": [
    {
      "name": "display_name",           // Required field
      "first_name": "first_name",
      "last_name": "user_last_name",
      "email": "email_address",         // Required field
    }
  ]
}
```

**Curl Equivalent:**
```bash
curl -X POST "https://<url>/api/v2/system/user?send_invite=true" \
-H "accept: application/json" -H "Content-Type: application/json" \
-H "X-DreamFactory-Session-Token: <sessionToken>" \
-d "{\"resource\":[{\"name\":\"<userName>\",\"first_name\":\"<firstName>\",\"last_name\":\"<lastName>\",\"email\":\"<emailAddress>\"}]}"
```

## Updating a User / Admin

To update a pre-existing User / Admin, a PATCH request can be made referencing the ID of the user to be changed with the `?ids=<ID>` parameter. You will need to provide your session token in a `X-DreamFactory-Session-Token` header.

**Endpoint:** `PATCH https://{url}/api/v2/system/user?ids=<ID_number>`

**Request Body:**
```json
{
  "resource": [
    {
     "field_to_change": "value",
     ...
    }
  ]
}
```

**Curl Equivalent:**
```bash
curl -X PATCH "https://{url}/api/v2/system/user?ids=<ID_number>" \
-H "accept: application/json" -H "Content-Type: application/json" \
-H "X-DreamFactory-Session-Token: <session_token>" \
-d "{\"resource\":[{\"<field_to_update\":\"value\"}]}"
```

## Deleting a User / Admin

To delete a pre-existing User / Admin, simply send a delete request with the corresponding user ID by using the `?ids=<ID>` parameter.

**Endpoint:** `DELETE https://{url}/api/v2/system/user?ids=<ID_number>`

**Curl Equivalent:**
```bash
curl -X DELETE "https://{url}/api/v2/system/user?ids=<ID_number>" \
-H "accept: application/json" -H "Content-Type: application/json" \
-H "X-DreamFactory-Session-Token: <session_token>"
```
