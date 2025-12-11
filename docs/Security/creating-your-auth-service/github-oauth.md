# GitHub OAuth Setup Guide

This guide will walk you through setting up GitHub OAuth authentication with DreamFactory.

## Prerequisites

- A GitHub account
- Access to your DreamFactory admin application
- Appropriate permissions in your GitHub organization (if using organization OAuth apps)

## Step 1: GitHub OAuth App Registration

### 1.1 Create OAuth App

1. Sign in to [GitHub](https://github.com)
2. Navigate to your account settings:
   - Click your profile picture in the top right corner
   - Select **Settings**
3. In the left sidebar, scroll down to **Developer settings**
4. Click **OAuth Apps** (or **Developer settings > OAuth Apps**)
5. Click **New OAuth App**
6. Fill in the application details:
   - **Application name**: Enter a name for your application (e.g., "DreamFactory OAuth")
   - **Homepage URL**: Enter your DreamFactory instance URL (e.g., `https://your-dreamfactory-instance.com`)
   - **Authorization callback URL**: This will be configured after creating the DreamFactory service. For now, you can use a placeholder like `https://your-dreamfactory-instance.com/api/v2/github_oauth/sso` (replace `github_oauth` with your intended namespace and `your-dreamfactory-instance.com` with your actual domain)
7. Click **Register application**

### 1.2 Generate Client Secret

1. After creating the OAuth app, you'll be taken to the app's settings page
2. On this page, you'll see your **Client ID** (you can copy this now)
3. Click **Generate a new client secret**
4. **Important**: Copy the client secret **immediately** and save it securely. You will not be able to view it again after leaving this page. This value will be used as the **Client Secret** in DreamFactory.

### 1.3 Collect Required Information

Before proceeding to DreamFactory configuration, collect the following information from your GitHub OAuth app:

- **Client ID**: Found on the OAuth app settings page
- **Client Secret**: The secret value you saved from step 1.2

## Step 2: DreamFactory Configuration

### 2.1 Access DreamFactory Admin

1. Open your DreamFactory admin web interface and sign in

### 2.2 Create User Role (if needed)

1. Navigate to **API Generation & Connections > Role based Access**
2. Create a role for users who will sign in via GitHub OAuth (if you don't already have an appropriate role)
3. Configure the role permissions according to your requirements
4. Note the role name for use in the next step

### 2.3 Create OAuth Service

1. Navigate to **Security > Authentication**
2. Click **Create** to create a new authentication service
3. Select **GitHub OAuth** as the service type
4. Fill in the service configuration:

#### Basic Configuration

| **Field**        | **Description** |
|------------------|-----------------|
| **Namespace**    | A required field that must end with `_oauth` (e.g., `github_oauth`) |
| **Label**        | The display name for the service (e.g., "GitHub" or "Sign in with GitHub"). This label will be displayed on DreamFactory's login page as the text on the provider's sign-in button |
| **Description**  | (Optional) A brief description of the service |
| **Active**       | Enable this toggle to activate the service |

#### OAuth Configuration

| **Field**        | **Description** |
|------------------|-----------------|
| **Client ID**    | Enter the **Client ID** from GitHub (Step 1.3) |
| **Client Secret**| Enter the **Client Secret** from GitHub (Step 1.3) |
| **Redirect URL** | Enter your DreamFactory redirect URL. This should be in the format: `https://your-dreamfactory-instance.com/api/v2/yournamespace_oauth/sso` (replace `yournamespace_oauth` with your actual namespace and `your-dreamfactory-instance.com` with your actual domain) |
| **Default Role** | Select the role that will be applied by default to authenticated users |
| **Icon Class**   | (Optional) CSS class for an icon |

5. Click **Save** to create the service

### 2.4 Update GitHub OAuth App Redirect URI

1. Return to your GitHub OAuth app settings page
2. Under **Authorization callback URL**, update the URL to match exactly the **Redirect URL** you configured in DreamFactory (from Step 2.3)
3. Click **Update application**

The service should look like this once complete:

## Step 3: Testing the Integration

### 3.1 Test Authentication

1. Navigate to your DreamFactory login page (sometimes immediately after creating the service you will need to hard refresh the browser or open the login page from an incognito browser)
2. You should see a button for your GitHub OAuth service (using the Label you configured)
3. Click the button to initiate the OAuth flow
4. You will be redirected to GitHub's authorization page
5. After authorizing the application, you will be redirected back to DreamFactory with a JWT token

### 3.2 Verify User Access

1. After successful authentication, verify that the user has the appropriate role assigned
2. Test API access to ensure the user can access the resources they should have permission for

## Step 4: Additional Configuration

### 4.1 Configure CORS

**Important**: Don't forget to add your application and GitHub domains to DreamFactory > **Config > CORS**. For detailed instructions on configuring CORS settings, see our [CORS and SSL documentation](../../system-settings/config/cors-ssl.md).

### 4.2 Role per App (Optional)

If you need to assign different roles based on the application being accessed:

1. In your OAuth service configuration, navigate to the **Role per App** section
2. Configure specific roles for different applications as needed

## Next Steps

Your GitHub OAuth integration is now complete! Users can sign in through GitHub and access DreamFactory with the appropriate permissions based on their assigned roles.

