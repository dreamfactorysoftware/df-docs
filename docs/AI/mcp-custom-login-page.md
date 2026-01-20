---
sidebar_position: 3
title: Custom Login Page for MCP
id: mcp-custom-login-page
---

# Custom Login Page for MCP OAuth

This guide explains how to create a custom login page layer for DreamFactory's MCP (Model Context Protocol) OAuth authentication flow. By following this guide, you can build a branded, self-hosted login experience while maintaining full OAuth 2.0 security.

## Overview

### What This Achieves

A custom login page layer allows you to:

- **Brand the login experience** with your company's look and feel
- **Host authentication UI on your domain** (e.g., `login.yourcompany.com`)
- **Maintain OAuth 2.0 + PKCE security** through DreamFactory
- **Support both credential-based and social login** flows

### How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Your Client    │────>│  DreamFactory    │────>│ Custom Login    │
│  Application    │     │  MCP Service     │     │ Page (this)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        │  1. OAuth Request     │                        │
        │──────────────────────>│                        │
        │                       │  2. Redirect to        │
        │                       │     custom login       │
        │                       │───────────────────────>│
        │                       │                        │
        │                       │  3. User submits       │
        │                       │     credentials        │
        │                       │<───────────────────────│
        │                       │                        │
        │  4. Authorization     │                        │
        │     code returned     │                        │
        │<──────────────────────│                        │
        │                       │                        │
        │  5. Exchange code     │                        │
        │     for tokens        │                        │
        │──────────────────────>│                        │
        │                       │                        │
        │  6. Access granted    │                        │
        │<──────────────────────│                        │
```

## Prerequisites

- **DreamFactory instance** with MCP services configured
- **Web server** capable of serving static HTML (any will work)
- **HTTPS certificate** (required for production)

## Step-by-Step Implementation

### Step 1: Create the HTML Structure

Your login page needs:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
</head>
<body>
    <!-- Login Form -->
    <form id="loginForm" method="POST">
        <!-- Hidden OAuth fields (populated by JavaScript) -->
        <input type="hidden" name="client_id" id="client_id">
        <input type="hidden" name="redirect_uri" id="redirect_uri">
        <input type="hidden" name="state" id="state">
        <input type="hidden" name="code_challenge" id="code_challenge">
        <input type="hidden" name="code_challenge_method" id="code_challenge_method">
        <input type="hidden" name="service" id="service">
        <input type="hidden" name="original_state" id="original_state">

        <!-- User input fields -->
        <input type="email" name="email" required>
        <input type="password" name="password" required>
        <button type="submit">Sign In</button>
    </form>

    <!-- Optional: OAuth service buttons container -->
    <div id="oauthServices"></div>

    <script>
        // JavaScript implementation here
    </script>
</body>
</html>
```

### Step 2: Extract OAuth Parameters from URL

DreamFactory passes OAuth parameters via query string. Extract them:

```javascript
// Parse URL parameters
const urlParams = new URLSearchParams(window.location.search);

const oauthParams = {
    client_id: urlParams.get('client_id'),
    redirect_uri: urlParams.get('redirect_uri'),
    state: urlParams.get('state'),
    code_challenge: urlParams.get('code_challenge'),
    code_challenge_method: urlParams.get('code_challenge_method'),
    original_state: urlParams.get('original_state'),
    login_url: urlParams.get('login_url'),        // CRITICAL: form submission endpoint
    service: urlParams.get('service'),
    oauth_services: urlParams.get('oauth_services'),
    oauth_callback_base: urlParams.get('oauth_callback_base')
};
```

### Step 3: Configure the Form

Set the form action and populate hidden fields:

```javascript
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');

    // CRITICAL: Set form action to DreamFactory's login endpoint
    if (oauthParams.login_url) {
        form.action = oauthParams.login_url;
    } else {
        // Handle error - login_url is required
        console.error('Missing login_url parameter');
        return;
    }

    // Populate hidden fields with OAuth parameters
    const fields = [
        'client_id', 'redirect_uri', 'state',
        'code_challenge', 'code_challenge_method',
        'service', 'original_state'
    ];

    fields.forEach(field => {
        const input = document.getElementById(field);
        if (input && oauthParams[field]) {
            input.value = oauthParams[field];
        }
    });
});
```

### Step 4: Handle Form Submission

Add validation before submission:

```javascript
form.addEventListener('submit', function(e) {
    const email = form.querySelector('input[name="email"]').value;
    const password = form.querySelector('input[name="password"]').value;

    // Basic validation
    if (!email || !password) {
        e.preventDefault();
        showError('Please enter both email and password');
        return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        e.preventDefault();
        showError('Please enter a valid email address');
        return;
    }

    // Form submits naturally to login_url via POST
});
```

### Step 5: Handle Error Responses (Optional)

DreamFactory may redirect back with errors:

```javascript
// Check for error in URL (returned from DreamFactory)
const error = urlParams.get('error');
const errorDescription = urlParams.get('error_description');

if (error) {
    showError(errorDescription || error);
}
```

## OAuth Flow Explained

### 1. Client Initiates OAuth

Your application redirects to DreamFactory:

```
GET https://your-dreamfactory.com/mcp/{service}/authorize
    ?client_id=your_client_id
    &redirect_uri=https://your-app.com/callback
    &response_type=code
    &state=random_state_value
    &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    &code_challenge_method=S256
```

### 2. DreamFactory Redirects to Custom Login

If `custom_login_url` is configured, DreamFactory redirects:

```
GET https://login.yourcompany.com/
    ?client_id=your_client_id
    &redirect_uri=https://your-app.com/callback
    &state=internal_state
    &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    &code_challenge_method=S256
    &original_state=random_state_value
    &login_url=https://your-dreamfactory.com/mcp/{service}/login
    &service={service}
```

### 3. Custom Login Submits Credentials

Your form POSTs to `login_url`:

```
POST https://your-dreamfactory.com/mcp/{service}/login
Content-Type: application/x-www-form-urlencoded

email=user@example.com
&password=userpassword
&client_id=your_client_id
&redirect_uri=https://your-app.com/callback
&state=internal_state
&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
&code_challenge_method=S256
&service={service}
&original_state=random_state_value
```

### 4. DreamFactory Returns Authorization Code

On successful authentication:

```
GET https://your-app.com/callback
    ?code=authorization_code_here
    &state=random_state_value
```

### 5. Client Exchanges Code for Tokens

Your application exchanges the code:

```
POST https://your-dreamfactory.com/mcp/{service}/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=authorization_code_here
&redirect_uri=https://your-app.com/callback
&client_id=your_client_id
&code_verifier=original_code_verifier
```

## Required Query Parameters

Your custom login page **must** handle these parameters from the URL:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `login_url` | **Yes** | DreamFactory endpoint for credential submission |
| `client_id` | **Yes** | OAuth client identifier |
| `redirect_uri` | **Yes** | Where to redirect after authentication |
| `state` | **Yes** | Internal state for CSRF protection |
| `code_challenge` | **Yes** | PKCE challenge value |
| `code_challenge_method` | **Yes** | PKCE method (usually `S256`) |
| `service` | No | MCP service name |
| `original_state` | No | Client's original state value |
| `oauth_services` | No | Base64-encoded available OAuth providers |
| `oauth_callback_base` | No | Base URL for OAuth callbacks |

## Form Submission Requirements

Your form **must** POST these fields to `login_url`:

```html
<!-- User credentials -->
<input type="email" name="email" required>
<input type="password" name="password" required>

<!-- OAuth parameters (hidden, populated via JavaScript) -->
<input type="hidden" name="client_id">
<input type="hidden" name="redirect_uri">
<input type="hidden" name="state">
<input type="hidden" name="code_challenge">
<input type="hidden" name="code_challenge_method">
<input type="hidden" name="service">
<input type="hidden" name="original_state">
```

## Supporting Social Login (Optional)

To support OAuth providers (Google, GitHub, etc.):

### 1. Parse OAuth Services

```javascript
if (oauthParams.oauth_services) {
    try {
        const services = JSON.parse(atob(oauthParams.oauth_services));
        // services is an array of {name: string, label: string}
        renderOAuthButtons(services);
    } catch (e) {
        console.error('Failed to parse oauth_services');
    }
}
```

### 2. Create OAuth Buttons

```javascript
function renderOAuthButtons(services) {
    const container = document.getElementById('oauthServices');

    services.forEach(service => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `Sign in with ${service.label}`;
        button.onclick = () => initiateOAuth(service.name);
        container.appendChild(button);
    });
}
```

### 3. Initiate OAuth Flow

```javascript
function initiateOAuth(serviceName) {
    // Build callback URL that returns to this page
    const callbackUrl = encodeURIComponent(
        oauthParams.oauth_callback_base +
        '?client_id=' + oauthParams.client_id +
        '&redirect_uri=' + encodeURIComponent(oauthParams.redirect_uri) +
        '&state=' + oauthParams.state +
        '&code_challenge=' + oauthParams.code_challenge +
        '&code_challenge_method=' + oauthParams.code_challenge_method
    );

    // Extract DreamFactory base URL from login_url
    const dfBaseUrl = new URL(oauthParams.login_url).origin;

    // Redirect to DreamFactory OAuth initiation
    window.location.href = `${dfBaseUrl}/api/v2/user/session?service=${serviceName}&redirect=${callbackUrl}`;
}
```

## DreamFactory Configuration

To use your custom login page, configure DreamFactory:

1. Navigate to **AI** > **Your MCP Service**
2. Find the **Custom Login URL** setting
3. Enter your login page URL: `https://login.yourcompany.com/`
4. Save changes

## Complete Minimal Example

Here's a minimal working implementation:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In</title>
    <style>
        * { box-sizing: border-box; font-family: system-ui, sans-serif; }
        body { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f5f5; margin: 0; }
        .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        h1 { margin: 0 0 1.5rem; text-align: center; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
        input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
        button { width: 100%; padding: 0.75rem; background: #4f46e5; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; }
        button:hover { background: #4338ca; }
        .error { background: #fee2e2; color: #dc2626; padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem; display: none; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Sign In</h1>
        <div class="error" id="errorAlert"></div>

        <form id="loginForm" method="POST">
            <!-- Hidden OAuth fields -->
            <input type="hidden" name="client_id" id="client_id">
            <input type="hidden" name="redirect_uri" id="redirect_uri">
            <input type="hidden" name="state" id="state">
            <input type="hidden" name="code_challenge" id="code_challenge">
            <input type="hidden" name="code_challenge_method" id="code_challenge_method">
            <input type="hidden" name="service" id="service">
            <input type="hidden" name="original_state" id="original_state">

            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>

            <button type="submit">Sign In</button>
        </form>
    </div>

    <script>
        (function() {
            // Parse URL parameters
            const urlParams = new URLSearchParams(window.location.search);

            const oauthParams = {
                client_id: urlParams.get('client_id'),
                redirect_uri: urlParams.get('redirect_uri'),
                state: urlParams.get('state'),
                code_challenge: urlParams.get('code_challenge'),
                code_challenge_method: urlParams.get('code_challenge_method'),
                original_state: urlParams.get('original_state'),
                login_url: urlParams.get('login_url'),
                service: urlParams.get('service')
            };

            const form = document.getElementById('loginForm');
            const errorAlert = document.getElementById('errorAlert');

            function showError(message) {
                errorAlert.textContent = message;
                errorAlert.style.display = 'block';
            }

            // Check for errors from DreamFactory
            const error = urlParams.get('error');
            const errorDescription = urlParams.get('error_description');
            if (error) {
                showError(errorDescription || error);
            }

            // Validate required parameters
            if (!oauthParams.login_url || !oauthParams.client_id) {
                showError('Invalid authentication request. Missing required parameters.');
                form.querySelector('button').disabled = true;
                return;
            }

            // Configure form
            form.action = oauthParams.login_url;

            // Populate hidden fields
            ['client_id', 'redirect_uri', 'state', 'code_challenge',
             'code_challenge_method', 'service', 'original_state'].forEach(field => {
                const input = document.getElementById(field);
                if (input && oauthParams[field]) {
                    input.value = oauthParams[field];
                }
            });

            // Form validation
            form.addEventListener('submit', function(e) {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                if (!email || !password) {
                    e.preventDefault();
                    showError('Please enter both email and password.');
                    return;
                }

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    e.preventDefault();
                    showError('Please enter a valid email address.');
                    return;
                }
            });
        })();
    </script>
</body>
</html>
```

## Summary

To create a custom login page for DreamFactory MCP:

1. **Create a single HTML page** with a login form
2. **Extract OAuth parameters** from the URL query string
3. **Set form action** to `login_url` parameter value
4. **Include hidden fields** for all OAuth parameters
5. **Submit credentials** via POST to DreamFactory
6. **Configure DreamFactory** to use your custom login URL

The implementation requires no backend logic—it's a stateless pass-through that maintains OAuth security while providing a branded experience.
