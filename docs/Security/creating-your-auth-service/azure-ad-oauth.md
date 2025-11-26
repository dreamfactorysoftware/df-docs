# Azure Active Directory OAuth Setup Guide

This guide will walk you through setting up Azure Active Directory (Azure AD/Entra ID) OAuth authentication with DreamFactory.

## Prerequisites

- An Azure Active Directory (Entra ID) tenant
- Access to your DreamFactory admin application
- Appropriate permissions in Azure AD to register applications

## Step 1: Azure AD Application Registration

### 1.1 Create App Registration

1. Sign in to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** (or **Microsoft Entra ID**)
3. Go to **App registrations** in the left sidebar
4. Click **New registration**
5. Fill in the application details:
   - **Name**: Enter a name for your application (e.g., "DreamFactory OAuth")
   - **Supported account types**: Can be set to **Single tenant** (accounts in this organizational directory only)
   - **Redirect URI**: Leave blank for now (we'll configure this after creating the DreamFactory service)
6. Click **Register**

### 1.2 Configure Authentication Settings

1. In your newly created app registration, navigate to **Authentication** in the left sidebar
2. Under **settings**, enable **Allow public client flows** by setting it to **enabled**
3. Click **Save**

### 1.3 Create Client Secret

1. Navigate to **Certificates & secrets** in the left sidebar
2. Click **New client secret**
3. Add a description (e.g., "DreamFactory OAuth Secret")
4. Choose an expiration period
5. Click **Add**
6. **Important**: Copy the secret **Value** immediately and save it securely. You will not be able to view it again after leaving this page. This value will be used as the **Client Secret** in DreamFactory.

### 1.4 Configure Token Claims

1. Navigate to **Token configuration** in the left sidebar
2. Click **Add optional claim**
3. Select **ID** token type
4. Check the following claims:
   - **email**
   - **upn** (User Principal Name)
5. Click **Add**
6. Click **Save**

### 1.5 Configure API Permissions

1. Navigate to **API permissions** in the left sidebar
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add the following permissions: (there is a search bar to make finding some of these options easier)
   - **email**
   - **openid**
   - **profile**
   - **User.Read**
6. Click **Add permissions**
7. Click **Grant admin consent** for your organization (if you have admin rights) to ensure users don't need to consent individually

### 1.6 Expose API and Create Scope

1. Navigate to **Expose an API** in the left sidebar
2. Click **Set** next to "Application ID URI" if not already set (this will use the default format)
3. Click **Add a scope**
4. Configure the scope:
   - **Scope name**: Enter a name (e.g., "access_as_user")
   - **Who can consent?**: Select the appropriate option based on who will be using the authentication:
     - **Admins and users** - All users can consent
     - **Admins only** - Only administrators can consent
   - **Admin consent display name**: Enter a display name (e.g., "Access DreamFactory")
   - **Admin consent description**: Enter a description (e.g., "Allow the application to access DreamFactory on behalf of the signed-in user")
   - **User consent display name**: Enter a display name
   - **User consent description**: Enter a description
   - **State**: Set to **Enabled**
5. Click **Add scope**
6. **Important**: Copy the **Application ID URI** (it will look like `api://<Application-ID>` or `https://<your-tenant>.onmicrosoft.com/<Application-ID>`). This URI will be used as the **Resource** field in DreamFactory service creation.

### 1.7 Collect Required Information

Before proceeding to DreamFactory configuration, collect the following information from your Azure AD app registration:

- **Application (client) ID**: Found on the **Overview** page
- **Directory (tenant) ID**: Found on the **Overview** page
- **Client Secret Value**: The secret value you saved from step 1.3
- **Application ID URI (Resource)**: The URI from step 1.6

## Step 2: DreamFactory Configuration

### 2.1 Access DreamFactory Admin

1. Open your DreamFactory admin web interface and sign in

### 2.2 Create User Role (if needed)

1. Navigate to **API Generation & Connections > Role based Access**
2. Create a role for users who will sign in via Azure AD OAuth (if you don't already have an appropriate role)
3. Configure the role permissions according to your requirements
4. Note the role name for use in the next step

### 2.3 Create OAuth Service

1. Navigate to **Security > Authentication**
2. Click **Create** to create a new authentication service
3. Select **Azure Active Directory OAuth** as the service type
4. Fill in the service configuration:

#### Basic Configuration

| **Field**        | **Description** |
|------------------|-----------------|
| **Namespace**    | A required field that must end with `_oauth` (e.g., `azuread_oauth`) |
| **Label**        | The display name for the service (e.g., "Azure AD" or "Sign in with Microsoft") |
| **Description**  | (Optional) A brief description of the service |
| **Active**       | Enable this toggle to activate the service |

#### OAuth Configuration

| **Field**        | **Description** |
|------------------|-----------------|
| **Client ID**    | Enter the **Application (client) ID** from Azure AD (Step 1.7) |
| **Client Secret**| Enter the **Client Secret Value** from Azure AD (Step 1.7) |
| **Redirect URL** | Enter your DreamFactory redirect URL. This should be in the format: `https://your-dreamfactory-instance.com/api/v2/yournamespace_oauth/sso` (replace `yournamespace_oauth` with your actual namespace) |
| **Default Role** | Select the role that will be applied by default to authenticated users |
| **Icon Class**   | (Optional) CSS class for an icon |

#### Azure AD Specific Fields

| **Field**        | **Description** |
|------------------|-----------------|
| **Tenant ID**    | Enter the **Directory (tenant) ID** from Azure AD (Step 1.7) |
| **Resource**     | Enter the **Application ID URI** from Azure AD (Step 1.6). This is the scope URI you created in the "Expose an API" section |

5. Click **Save** to create the service

### 2.4 Update Azure AD Redirect URI

1. Return to your Azure AD app registration in the Azure Portal
2. Navigate to **Authentication**
3. Under **Platform configurations**, click **Add redirect URI** (if no redirect URI is configured) or click on the existing web platform
4. Add the **Redirect URL** you configured in DreamFactory (from Step 2.3)
5. Click **Save**

The service should look like this once complete:

[![Azure AD OAuth Configuration in DreamFactory](/img/authentication-apis/azure-oauth-config/dfconfigazureoauth.png)](/img/authentication-apis/azure-oauth-config/dfconfigazureoauth.png)

## Step 3: Testing the Integration

### 3.1 Test Authentication

1. Navigate to your DreamFactory login page (sometimes immediately after creating the service you will need to hard refresh the browser or open the login page from an incognito browser)
2. You should see a button for your Azure AD OAuth service (using the Label you configured)
3. Click the button to initiate the OAuth flow
4. You will be redirected to Microsoft's login page
5. After successful authentication, you will be redirected back to DreamFactory with a JWT token

### 3.2 Verify User Access

1. After successful authentication, verify that the user has the appropriate role assigned
2. Test API access to ensure the user can access the resources they should have permission for

## Step 4: Additional Configuration

### 4.1 Configure CORS

**Important**: Don't forget to add your application and Microsoft/Azure AD domains to DreamFactory > **Config > CORS**. For detailed instructions on configuring CORS settings, see our [CORS and SSL documentation](../../system-settings/config/cors-ssl.md).

### 4.2 Role per App (Optional)

If you need to assign different roles based on the application being accessed:

1. In your OAuth service configuration, navigate to the **Role per App** section
2. Configure specific roles for different applications as needed

## Troubleshooting

### Common Issues

- **"Invalid client" error**: Verify that the Client ID and Client Secret are correct in DreamFactory
- **"Invalid redirect URI" error**: Ensure the redirect URI in Azure AD matches exactly with the one in DreamFactory (including protocol, domain, and path)
- **"Insufficient permissions" error**: Verify that all required API permissions are granted and admin consent is provided
- **Missing email or UPN claims**: Ensure you've added the optional claims for email and UPN in the Token configuration
- **"Public client flows not allowed" error**: Ensure "Allow public client flows" is enabled in Azure AD Authentication settings

## Next Steps

Your Azure AD OAuth integration is now complete! Users can sign in through Azure AD/Entra ID and access DreamFactory with the appropriate permissions based on their assigned roles.

For more information about authentication in DreamFactory, see the [Authenticating your APIs](../authentication-apis.md) documentation.

