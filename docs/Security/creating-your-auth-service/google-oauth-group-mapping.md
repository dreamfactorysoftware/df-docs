# Google OAuth Group-to-Role Mapping

This guide walks through configuring Google OAuth authentication in DreamFactory with optional automatic role assignment based on Google Workspace group membership.

With this feature enabled, when a user logs in via Google OAuth, DreamFactory reads their Google group memberships and assigns a DreamFactory role based on a configurable group-to-role mapping.

## Prerequisites

- A Google Workspace account (not a personal Gmail account)
- Access to the [Google Cloud Console](https://console.cloud.google.com/)
- Administrative access to your DreamFactory instance

:::info
Google Workspace admin privileges are **not** required for end users. Any standard Google Workspace user can have their group memberships read during OAuth login.
:::

## Part 1: Google Cloud Console Setup

### Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a Project** → **New Project**
3. Enter a project name (e.g., `DreamFactory OAuth`) and click **Create**
4. Make sure the new project is selected in the project dropdown

### Step 2: Enable Required APIs

1. Navigate to **APIs & Services** → **Enabled APIs & Services**
2. Click **+ ENABLE APIS AND SERVICES**
3. Search for and enable the following APIs:
   - **Google People API** (required for basic OAuth login)
   - **Cloud Identity API** (required for group-to-role mapping)

:::warning
Previous versions of this guide referenced the **Admin SDK API** for group fetching. This has been replaced by the **Cloud Identity API**, which does not require admin privileges or domain-wide delegation.
:::

### Step 3: Configure the OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Select **Internal** (for Google Workspace users within your organization) and click **Create**
3. Fill in the required fields:
   - **App name**: e.g., `DreamFactory`
   - **User support email**: your admin email
   - **Developer contact information**: your admin email
4. Click **Save and Continue**

### Step 4: Add Scopes

1. On the **Scopes** step, click **Add or Remove Scopes**
2. Add the following scopes:
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/cloud-identity.groups.readonly`
3. Click **Update** and then **Save and Continue**

:::info
The `cloud-identity.groups.readonly` scope is only needed if you plan to use group-to-role mapping. If you only need basic Google OAuth login, the first three scopes are sufficient.
:::

### Step 5: Create OAuth Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Set **Application type** to **Web application**
4. Enter a name (e.g., `DreamFactory OAuth Client`)
5. Under **Authorized redirect URIs**, add:
   ```
   https://<your-dreamfactory-url>/api/v2/user/session/google_oauth
   ```
   Replace `<your-dreamfactory-url>` with your actual DreamFactory instance URL. The path must end with the service name you will create in DreamFactory (e.g., `google_oauth`).
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

:::warning
The Client Secret cannot be recovered after you close this dialog. Ensure you save it securely.
:::

## Part 2: DreamFactory Configuration

### Step 1: Create the Google OAuth Service

1. Log in to your DreamFactory instance as an administrator
2. Navigate to **Services** → **Create**
3. Select **OAuth** as the Service Type and **Google OAuth** as the sub-type
4. Configure the service:
   - **Name**: Must end with `_oauth` (e.g., `google_oauth`)
   - **Label**: A display name (e.g., `Google Login`)
   - **Description**: Optional
5. Under the **Config** tab:
   - **Client ID**: Paste the Client ID from Google Cloud Console
   - **Client Secret**: Paste the Client Secret from Google Cloud Console
   - **Redirect URL**: Must match the redirect URI you configured in Google Cloud Console
   - **Default Role**: Select a fallback role for users whose group membership does not match any mapping

### Step 2: Enable Group-to-Role Mapping

1. On the same **Config** tab, toggle **Map Google Groups to Roles** to enabled
2. Under **Google Group to Role Mapping**, add your mappings:
   - **Google Group Email**: The email address of the Google group (e.g., `engineering@example.com`)
   - **DreamFactory Role**: The DreamFactory role to assign to members of that group
3. Add as many mappings as needed
4. Click **Save**

### How Role Assignment Works

When a user logs in via Google OAuth with group mapping enabled, DreamFactory assigns a role using the following priority:

1. **Group mapping** — If the user belongs to a Google group that has a configured role mapping, that role is assigned
2. **Default role** — If no group mapping matches, the default role configured on the service is used
3. **App-to-role mapping** — If neither of the above applies, any existing app-to-role mappings for the service are used

Role assignments are refreshed on every login to reflect the user's current group memberships in Google Workspace.

## Troubleshooting

### Users receive a 403 error during login

- Verify the **Cloud Identity API** is enabled in Google Cloud Console
- Confirm the `cloud-identity.groups.readonly` scope is added to the OAuth consent screen
- If your OAuth consent screen is in **Testing** mode, ensure the user's email is added to the test users list

### Group mapping is not working (user gets default role)

- Verify the Google group email in the mapping matches exactly (case-insensitive)
- Confirm the user is a direct member of the Google group (nested group memberships are not resolved)
- Check your DreamFactory log for warnings containing `Google OAuth: Failed to fetch groups` — this indicates the Cloud Identity API call failed

### "Access denied" or scope-related errors

- Re-check that all four scopes are added to the OAuth consent screen in Google Cloud Console
- If the consent screen is set to **Internal**, the user must belong to your Google Workspace organization
- If the consent screen is set to **External**, it must be published (not in Testing mode) for external users

### Login works but no role is assigned

- Ensure **Map Google Groups to Roles** is toggled on in the DreamFactory service config
- Verify at least one group-to-role mapping is configured
- Check that the **Default Role** is set as a fallback

## Migration from Admin SDK API

If you previously configured Google OAuth group mapping using the Admin SDK API and domain-wide delegation:

1. **Enable the Cloud Identity API** in your Google Cloud Console project (APIs & Services → Enable APIs)
2. **Add the new scope** `https://www.googleapis.com/auth/cloud-identity.groups.readonly` to your OAuth consent screen
3. **Remove the old scope** `https://www.googleapis.com/auth/admin.directory.group.readonly` from the consent screen (optional, but recommended)
4. **Remove domain-wide delegation** in Google Workspace Admin Console → Security → API controls → Domain-wide delegation (optional cleanup)
5. **Update DreamFactory** to the latest version containing the Cloud Identity API integration
6. No changes are needed to your group-to-role mappings in DreamFactory — they continue to work as before
