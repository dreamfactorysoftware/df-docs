---
sidebar_position: 10
title: GitHub-Linked Scripts
id: github-scripts
description: Link DreamFactory server scripts to GitHub repositories for version-controlled scripting with cache invalidation.
keywords: [scripts, GitHub, SCM, version control, event scripts, server scripts, webhook, cache invalidation]
difficulty: intermediate
---

# GitHub-Linked Scripts

DreamFactory server scripts (both event scripts and script services) can be linked to files in a GitHub repository. Instead of pasting script content into the admin UI, you point the script at a repository, file path, and branch. DreamFactory fetches the script content at runtime and caches it. When the file changes in GitHub, a webhook invalidates the cache so the next execution picks up the new version.

This gives you version-controlled, code-reviewed scripts managed in your normal Git workflow, with DreamFactory pulling them automatically.

## Prerequisites

- A **GitHub service** configured in DreamFactory (service type: SCM / GitHub). This provides the authenticated connection to the GitHub API.
- A GitHub repository containing your script files.
- (Optional) A webhook configured on the repository for cache invalidation.

## Linking a Script to GitHub

### Event Scripts

Event scripts fire before or after API requests (e.g. `db._table.{table_name}.post.pre_process`). To link one to GitHub:

1. Go to **Scripts > Event Scripts** in the admin panel.
2. Create or edit an event script.
3. Set the following fields:

| Field | Description |
|-------|-------------|
| **Type** | Script language (`nodejs`, `python3`, `php`) |
| **Storage Service** | Select your GitHub SCM service |
| **Repository** | Repository name (e.g. `myorg/api-scripts`) |
| **Path** | File path within the repo (e.g. `scripts/validate-order.js`) |
| **Reference** | Branch, tag, or commit SHA (e.g. `main`). Leave blank for the default branch. |
| **Is Active** | Enable to start executing the script |

When DreamFactory needs to execute this script, it fetches the content from GitHub via the SCM service, caches it, and runs it.

### Script Services

Script services expose a script as a callable API endpoint. The configuration is the same:

1. Go to **Services > Create** and select a scripting service type (Node.js, Python, PHP).
2. In the service config:

| Field | Description |
|-------|-------------|
| **Storage Service ID** | The DreamFactory service ID of your GitHub SCM service |
| **SCM Repository** | Repository name |
| **Storage Path** | File path within the repo |
| **SCM Reference** | Branch or tag |

The script content is fetched from GitHub on first execution and cached. Subsequent calls use the cached version until it is invalidated.

## The `_event` Object

Every script (whether stored locally or fetched from GitHub) receives an `_event` object containing metadata about the triggering event. This is available in all script languages.

### `_event` Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | The event name (e.g. `db._table.customers.post.pre_process`) |
| `stage` | string | When the script runs: `pre_process`, `post_process`, `api`, or `service` |
| `script_name` | string | The name of the script being executed |

### Accessing `_event` in Scripts

**Node.js:**

```javascript
var eventName = _event.name;
var stage = _event.stage;

if (_event.stage === 'pre_process') {
    // Validate or modify the request before it reaches the database
    var request = _event.request;
    if (!request.payload.resource[0].email) {
        throw new Error('Email is required');
    }
}
```

**Python 3:**

```python
event_name = _event.name
stage = _event.stage

if _event.stage == 'pre_process':
    # Access the request
    request = _event.request
    payload = request.payload
```

**PHP:**

```php
$eventName = $event['_event']['name'];
$stage = $event['_event']['stage'];

if ($event['_event']['stage'] === 'pre_process') {
    $request = $event['request'];
}
```

### Event Modification

When `allow_event_modification` is enabled on a script:

- **Pre-process scripts** can modify the request before it reaches the service. They can also short-circuit the request by returning a response directly.
- **Post-process scripts** can modify the response before it is returned to the client.

```javascript
// Pre-process: inject a default value
_event.request.payload.resource.forEach(function(record) {
    if (!record.created_by) {
        record.created_by = 'system';
    }
});

// Pre-process: return a response directly (skips the actual API call)
_event.setResponse(
    JSON.stringify({message: "Request intercepted"}),
    200,
    'application/json'
);
```

## Cache Behavior

Script content fetched from GitHub is cached using DreamFactory's standard cache layer. The cache key incorporates the script name, and the cached content persists until:

1. The cache TTL expires (default: 24 minutes, matching session timeout).
2. The cache is manually cleared via the admin panel or API.
3. A webhook invalidation clears the specific script's cache entry.

### Webhook Cache Invalidation

To automatically invalidate the cache when a script file changes in GitHub:

1. In your GitHub repository, go to **Settings > Webhooks > Add webhook**.
2. Set the **Payload URL** to your DreamFactory instance's event endpoint.
3. Set **Content type** to `application/json`.
4. Select **Just the push event** (or configure for specific branches).

When GitHub sends a push event, DreamFactory's event script system processes it and clears the cache for affected scripts, so the next execution fetches fresh content from GitHub.

## Best Practices

- **Use a dedicated branch** (e.g. `production`) for scripts that run in your production DreamFactory instance. Develop on feature branches and merge when ready.
- **Keep scripts focused.** Each script should handle one event. Use separate files for separate events.
- **Test locally first.** Use `_event.stage` checks to ensure your script handles the correct lifecycle phase.
- **Set a reference.** Always specify a branch or tag rather than leaving it blank. This prevents unexpected changes from landing in production when the default branch updates.
- **Enable event modification carefully.** Only enable `allow_event_modification` when the script genuinely needs to alter requests or responses. Read-only scripts (logging, notifications) should leave it disabled.
- **Monitor fetch failures.** If DreamFactory cannot reach GitHub to fetch a script, it logs an error and the script returns empty content. Check your DreamFactory logs if scripts stop executing.

## Supported SCM Providers

The GitHub-linked scripts feature works through DreamFactory's SCM service type. While GitHub is the primary supported provider, any service implementing the SCM group interface (`_repo/{repository}` endpoint with `path`, `branch`, and `content` parameters) can be used. This includes services backed by:

- GitHub (public and private repositories)
- GitLab (via compatible SCM service)
- Bitbucket (via compatible SCM service)

The script fetching mechanism uses DreamFactory's `ServiceManager::handleRequest` to call the SCM service's `_repo/{repository}` endpoint, so authentication, rate limiting, and error handling are all managed by the SCM service configuration.
