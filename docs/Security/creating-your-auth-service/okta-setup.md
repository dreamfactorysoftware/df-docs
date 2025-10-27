# Okta SSO Setup Guide

This guide will walk you through setting up Okta Single Sign-On (SSO) authentication with DreamFactory.

## Prerequisites

- An Okta account (create one at https://www.okta.com if needed)
- Access to your DreamFactory admin application

## Step 1: Okta Initial Configuration

### 1.1 Create Account and Access Admin Panel
1. Create an account on https://www.okta.com (if you do not have one yet) and sign in
2. Open the admin tab, the button for this should be located in the top right of the Dashboard

### 1.2 Add New Application
1. Navigate to Applications and click "Create App Integration"
2. Select "SAML 2.0" as the application type

![okta new app integration screen ](/img/okta-auth-config/okta-saml-2.png)

### 1.3 Configure Application
1. Fill in the General Settings page as you see fit, at a minimum a unique name for your new App
2. When configuring SAML the first time the Single sign-on URL and Audience URI will be placeholders (until you create the service in DreamFactory) you can put just the base URL for your DreamFactory Instance for now. You will also need to change Name ID format to EmailAddress, Application username to Email, and Response to Unsigned. When complete the page should look like this:

![okta SAML configuration screen ](/img/okta-auth-config/okta-saml-config-full-1.png)

3. Hit next and on the Feedback page select the radio button for "This is an internal app that we have created" and hit finish

4. On the right hand side of your new applications Sign On page you should have a button that says "View SAML setup instructions" select this and keep the tab open, you will need this information to setup the DreamFactory service for Okta SAML 2.0

![okta SAML setup instructions link ](/img/okta-auth-config/okta-saml-setup-link.png)

## Step 2: DreamFactory Configuration

### 2.1 Access DreamFactory Admin
1. Open your DreamFactory admin WEB Interface in a new tab and sign in

### 2.2 Create User Role
1. Create a role for users who will sign in via Okta SSO
   - If you already have appropriate roles, you can use them
   - For full access, create a role with the below permissions

![okta SAML role configuration ](/img/okta-auth-config/okta-allaccess-role.png)

### 2.3 Create API Key
1. Go to API Generation & connections > API Keys
2. Create a new API key and assign the previously created role to this key

![okta SAML API Key Creation ](/img/okta-auth-config/okta-api-key-creation.png)

### 2.4 Create SAML 2.0 Service
1. Navigate to Security > Authentication and create a new SAML 2.0 service

![okta SAML Service Creation Blank Page](/img/okta-auth-config/okta-saml-blank-service-page.png)

2. You will need to fill in the Namespace field, this will become part of the URI structure for the service. The Namespace field must end with _sso, for instance a valid Namespace would be DreamFactoryOkta_sso.

3. The Label of the service will become the text in the button to login with Okta at the main login page for your DreamFactory instance

4. You will need to use the SAML setup instructions page from the Okta admin tab to populate the new service

5. "Identity Provider Single Sign-On URL" will need to be entered into the IdP SSO service URL field

6. "Identity Provider Issuer" will need to be entered into the "IdP EntityId" field

7. "X.509 Certificate" including the BEGIN and END lines will need to be entered into the "IdP x509cert" field 

8. Finally the relay state needs to be filled in with the URL the service should return the JWT token to, typically this is https://your.instance.url/dreamfactory/dist/#/auth/login?jwt=_token_ 

9. Once configured your service should look like:

![okta SAML Service Creation ](/img/okta-auth-config/okta-saml-2-service-creation.png)

## Step 3: Okta Second Configuration

### 3.1 Assign Application to Users
1. In your Okta admin app, go to the Application page
2. Select your DreamFactory application from the list
3. Assign this application to the People/Group who will use it

![okta SAML users configuration ](/img/okta-auth-config/okta-users.png)

### 3.2 Update Application Settings
1. Go to the General tab and click the Edit button next to SAML settings
2. Update the following fields with your DreamFactory endpoints:
   - Single sign on URL this should look like: https://your.domain.url/api/v2/YourServicenameHere/acs
   - Audience URI (SP Entity ID) this should look like: https://your.domain.url/api/v2/YourServicenameHere/metadata
3. Save your changes

## Step 4: Application Configuration

### 4.1 Configure SSO Endpoint
You can now sign in by going to the `/sso` endpoint. Since we used the SAML 2.0 you should now see on the login landing page for your DreamFactory instance a new button below the normal login credentials fields, clicking this should redirect you to the Okta SSO page and proceed with requesting users to authenticate.

### 4.2 Configure CORS
**Important**: Don't forget to add your application and Okta domains to DreamFactory > Config > CORS. For detailed instructions on configuring CORS settings, see our [CORS and SSL documentation](../system-settings/config/cors-ssl.md).



## Next Steps

Your Okta SSO integration is now complete! Users can sign in through Okta and access DreamFactory with the appropriate permissions based on their assigned roles.