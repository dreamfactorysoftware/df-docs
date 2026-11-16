---
sidebar_position: 8
title: AAuth for OAuth Developers
id: oauth-mapping
sidebar_label: For OAuth developers
description: "How OAuth 2.0 and OpenID Connect concepts map to AAuth and to DreamFactory: clients, scopes, consent, tokens, DPoP, device flow, refresh and revocation."
keywords: [AAuth, OAuth 2.0, OpenID Connect, DPoP, device authorization, scopes, consent, comparison]
difficulty: "advanced"
---

# AAuth for OAuth Developers

This page is for developers who know OAuth 2.0 and OpenID Connect and want to place AAuth in that picture. AAuth reuses OAuth's vocabulary (scopes, consent, grants, issuers, tokens, and a code the person enters as in the device flow) but changes two things:

- **There are no bearer tokens.** Every token is bound to the agent's key, and every request is signed with that key.
- **There is no client registration.** Agents carry a verifiable identity from their agent provider, and DreamFactory learns about an agent from its first signed request.

The tables below map what you know from OAuth to AAuth, and to what DreamFactory does. For the protocol itself, see the [overview](./overview.md#standards-status) and [The AAuth HTTP Exchange](./http-exchange.md).

## Concept map

| OAuth 2.0 / OIDC | AAuth | In DreamFactory |
|---|---|---|
| Client | Agent | Listed under **Security > AAuth > Agents** after its first signed API request |
| Client registration, `client_id` | Agent id `aauth:<name>@<agent provider host>`, vouched for by the agent provider's metadata and JWKS | No registration. Admins can block an agent. |
| Client secret, `private_key_jwt` | Agent token (`aa-agent+jwt`) from the agent provider, bound to the agent's own key (`cnf.jwk`) | Verified through the agent provider's `/.well-known/aauth-agent.json` and its JWKS |
| Authorization server | Person server: issues person and auth tokens after the person approves. AAuth also defines access servers, for policy across trust domains. | Built in (`/aauth/person`, `/aauth/token`), or trusted external person servers under **Person Servers**. Access servers are not supported. |
| `/.well-known/oauth-authorization-server`, RFC 9728 protected resource metadata | `/.well-known/aauth-person.json`, `/.well-known/aauth-resource.json`, `/.well-known/aauth-agent.json`, each with `issuer` (instead of `resource`) | All three are published on the issuer |
| Issuer (`iss`) | Server identifier: `https://` plus a host, no port or path | `DF_AAUTH_ISSUER`, or the `APP_URL` origin when that is https |
| JWKS | One JWKS per protocol role (`jwks_uri` in each metadata document); every key has a fully specified `alg` | `/aauth/jwks/resource.json`, `/aauth/jwks/person.json` and `/aauth/jwks/agent.json`, with Ed25519 keys |
| Scope | Scope | **A scope is a DreamFactory role.** Admins choose which roles are scopes on the **Scopes** tab. |
| Resource indicator (RFC 8707), `aud` | `resource` in the person token request; the `aud` of person and auth tokens | `aud` must be the issuer |
| Authorization request, redirect URI | `POST /aauth/person` and `POST /aauth/token`, answered with `202` and an interaction code. The agent's `callback_endpoint` is only where the browser goes afterwards. | Codes look like `7KQM-4D2P`. A callback must match the `callback_endpoint` in the agent provider's metadata. |
| Authorization code | No equivalent. The interaction code is a correlation id, not a credential, and tokens never pass through the browser. | A code is single-use, expires after 10 minutes by default, and wrong codes are rate limited |
| Device authorization grant (RFC 8628): user code and polling | Interaction code, and polling of a pending URL (`202` with `Location` and `Retry-After`) | `/aauth/interact?code=...` for the person, `/aauth/pending/{id}` for the agent |
| Consent screen | Interaction at the person server | DreamFactory sign-in, **Continue as**, then per-scope consent. A person can grant only roles they hold; sys admins can grant any enabled scope. |
| ID token | Person token (`aa-person+jwt`): who the agent acts for, at one resource, bound to the agent's key | Pairwise `sub` per resource |
| Access token (bearer) | Auth token (`aa-auth+jwt`), usable only in a request signed by the bound key | Sent in `Signature-Key: sig=jwt;jwt="..."`, never in `Authorization: Bearer` |
| DPoP (RFC 9449) | Built in: every request is an RFC 9421 HTTP message signature by the key in `cnf.jwk` | The signature must cover the method, host, path and `Signature-Key`; the query when the URL has one; and `Content-Type` and `Content-Digest` when there is a body |
| `WWW-Authenticate` challenge | `AAuth-Requirement` header (`requirement=person-token`, or `requirement=auth-token; resource-token="..."`) | Sent with DreamFactory's AAuth challenges. DreamFactory's own "no API key" errors are unchanged, apart from a `Link` to the resource metadata (and `requirement=agent-token` on a `401`). |
| Request object, `authorization_details` | Resource token (`aa-resource+jwt`): the resource's signed statement of what it asks the person server for (`scope`, `agent_jkt`, `sub`) | Names the least privileged enabled scope that allows the request; valid for 5 minutes by default and single use. An agent can also ask for named scopes up front: `POST /aauth/authorize` with `{"scope": "sales.read"}`, signed with its person token, returns a resource token without the `401`. |
| Incremental authorization | Step-up: `401` with `requirement=auth-token` and a resource token for the granted scopes plus the new one; the agent presents its current auth token | Automatic when no granted scope covers the request |
| Refresh token | None. The agent asks the person server again. | DreamFactory's person server caps each new auth token at the expiry of the token presented to get it, so no auth token outlives the person token. When that expires (at most an hour after the person approved), the person opens a link and continues again; an **Always allow** grant then makes the auth token step immediate. |
| Offline access, remembered consent | Standing permission (**Always allow**) | The **Grants** tab. Admins can revoke grants there, and people can revoke their own at `/aauth/grants`. |
| Token revocation (RFC 7009) | Revocation endpoint (recommended by the drafts) | Not in df-aauth 0.1.0. See [What has no AAuth equivalent](#what-has-no-aauth-equivalent). |
| Token introspection (RFC 7662) | Not needed: tokens are JWTs verified with the issuer's JWKS | Not needed |
| UserInfo | The `profile` and `email` identity scopes put `name` and `email` in the auth token | The built-in person server adds them when a resource asks for them. DreamFactory's own APIs never ask: they know the person from the pairwise `sub`. |
| OIDC pairwise subject | Pairwise `sub` per resource (required) | An HMAC of the user id and the resource, with a key derived from `APP_KEY` |
| `client_credentials` (no user) | Not in three-party mode | With DreamFactory's own person server, a person always approves; an external person server you trust decides for itself how it issues tokens. Use DreamFactory API keys for unattended services. |

## DreamFactory concepts

| DreamFactory | With AAuth |
|---|---|
| API key (app) | Not used. AAuth sessions run under an app named `aauth` that DreamFactory creates when AAuth is first switched on. While AAuth is on, a request that carries both AAuth signatures and an API key is refused with `400 invalid_request`. |
| Session token (JWT from a DreamFactory login) | Not used. A password or directory sign-in on the consent page creates no DreamFactory session. Single sign-on goes through DreamFactory's own login page, which signs the person in to DreamFactory as usual; the consent page only reads who they are. While AAuth is on, a request that mixes a session token with AAuth signatures is refused with `400 invalid_request`. |
| Role | The scope. Its service access, filters and limits apply unchanged. |
| User | With the built-in person server, the person who approved: the session carries their user (never as a sys admin), so lookups, per-user limits and scripts see them. With an external person server, no DreamFactory user is attached; only the role applies. |
| Sys admin | Can approve any enabled scope. The agent still gets only that scope's role. |
| OAuth, OpenID Connect and SAML login services | Sign people in to DreamFactory. People can also use them to sign in on the consent page when they approve an agent; see [Approving Agents with Company Sign-In](./sso-approval.md). |

## What has no AAuth equivalent

- **`client_credentials`.** With DreamFactory's own person server, a person always approves in three-party mode. For unattended services, scripts and integrations, use [API keys](/api-generation-and-connections/api-keys).
- **Refresh tokens.** Nothing is renewed. The person server caps every auth token at the expiry of the token the agent presented to get it, so no auth token outlives the person token behind it. When the person token expires, at most an hour after the person approved, the person opens a link and continues again; an **Always allow** grant then answers the auth token request at once.
- **The revocation endpoint.** df-aauth 0.1.0 has none. An issued token stays valid until it expires, at most one hour later, unless an admin switches off what it relies on: the scope, the person server, the person's role or account, or AAuth itself. What each control stops is in [Responding to an incident](./admin-guide.md#responding-to-an-incident).
- **Authorization codes in the browser.** Tokens never pass through the browser. The interaction code only ties the person's browser to the agent's pending request. The agent collects its token by polling, or straight from `POST /aauth/token` when an **Always allow** grant covers the request.

## Questions OAuth developers ask

**Can my OAuth client call DreamFactory with AAuth?**
Not as it is. An AAuth agent needs an agent identity from an agent provider and must sign every request. See [Building an Agent with the AAuth Clients](./build-an-agent.md).

**Do I send `Authorization: Bearer`?**
No. Tokens go in the `Signature-Key` header, and the request carries `Signature-Input` and `Signature` headers made with the key the token is bound to.

**Does AAuth replace our single sign-on?**
No. Single sign-on still signs people in to DreamFactory, and approvers can use it on the consent page. AAuth decides what an agent may do for a person; it does not sign people in to your apps.

**Is the interaction code a secret?**
It is not a credential, but treat it as private. A code is single-use: the first browser that acts on it (signs in, starts single sign-on, presses any button on the card, or types the code) owns the request, and any other browser is refused. Opening the link claims nothing, so chat link previews and mail scanners that fetch it first do no harm. Whoever acts first can deny the request without signing in. To approve, they must sign in, and a person token request then makes the agent act for whoever signed in; an auth token request can be approved only by the person the agent already acts for. Tokens always go to the agent, never to the browser. Every form on the consent pages is protected against cross-site request forgery, codes expire after 10 minutes by default, and wrong codes are rate limited. Agents should show the link to the intended person only; see [The pages](./admin-guide.md#the-pages).
