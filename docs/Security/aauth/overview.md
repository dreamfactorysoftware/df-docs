---
sidebar_position: 1
title: AAuth Agent Authorization
id: overview
sidebar_label: Overview
description: "Let AI agents call DreamFactory APIs with signed requests that a person approved, limited to DreamFactory roles: how AAuth works and when to use it."
keywords: [AAuth, agent authorization, agent authentication, AI agent authentication, AI agents, human approval, consent, HTTP message signatures, RFC 9421, scopes, roles, API keys]
difficulty: "intermediate"
---

# AAuth Agent Authorization

AAuth lets AI agents call DreamFactory's REST APIs under `/api/v2` with signed HTTP requests instead of API keys. A person approves the agent, and what they approve is a **scope**, which is a DreamFactory **role**. The agent then gets exactly that role's access, acting for that person. AAuth is off until a sys admin turns it on. A request without AAuth headers gets the same status and body as before; while AAuth is on, DreamFactory's `400` and `401` "no credentials" answers also carry a discovery `Link` header.

:::info[Licensing]
AAuth requires a DreamFactory commercial license (Gold or Platinum).
:::

This page explains what AAuth changes, how DreamFactory implements it and when to choose it over other authentication methods. To try it right away, follow the [quickstart](./quickstart.md).

## Quick reference

| Concept | Value |
|---|---|
| **Admin UI path** | **Security > AAuth**, with the tabs Scopes, Person Servers, Agents, Activity, Grants and Try it |
| **Where agents can use it** | Every API under `/api/v2`. Not the MCP endpoints (`/mcp/...`). API keys and session tokens keep working alongside it. |
| **Scope** | An enabled DreamFactory role |
| **Who can approve** | On DreamFactory's own person server: a user who holds the scope's role, or a sys admin |
| **Credentials** | Nothing shared. Every request is signed (RFC 9421) with the agent's own key, and every token is bound to that key. |
| **Token lifetime** | Person and auth tokens last at most 1 hour. There are no refresh tokens. |
| **Admin API** | `/api/v2/system/aauth` (sys admins only) |
| **Command line** | `php artisan df:aauth status`, `php artisan df:aauth rotate-keys`, `php artisan df:aauth prune` |
| **Protocol** | draft-hardt-oauth-aauth-protocol-11 with draft-hardt-httpbis-signature-key-09 (see [Standards status](#standards-status)) |

## The problem with shared keys

When an AI agent calls an API with an API key or a service account:

- The key is a bearer credential. Anyone who copies it, from a log, a configuration file or a chat transcript, can use it from anywhere until someone refreshes it.
- Nobody approves what the agent does on a person's behalf. The key's role decides, whoever the agent is working for.
- Logs show the key's app, not which agent acted for which person.

AAuth changes this:

- Each agent has its own verifiable identity, an agent id such as `aauth:reports@agents.example.com`, vouched for by its **agent provider**.
- A named person approves the agent on DreamFactory's consent page before it can act for them.
- Every request is signed with the agent's private key, and every token is bound to that key, so a token copied from a log is useless without the key.
- The **Activity** tab logs the agent, the person, the scope and the result of signed API requests, and keeps the rows for 30 days by default.

## Terms

| Term | Meaning |
|---|---|
| Agent | Software that calls your APIs for a person, identified by an agent id such as `aauth:reports@agents.example.com` |
| Agent provider | An https origin, such as `https://agents.example.com`, that vouches for its agents by publishing `/.well-known/aauth-agent.json` and their public keys |
| Person | The human the agent acts for, who approves it |
| Person server | Where the person signs in and approves, and where the agent gets person and auth tokens. DreamFactory has one built in. |
| Resource | The API the agent calls: here DreamFactory's `/api/v2` |
| Agent token | Issued by the agent provider. Says which agent this is and which key it signs with. |
| Person token | Issued by the person server after the **identity step**: which person the agent acts for |
| Resource token | Issued by DreamFactory in a challenge. Names the scope the request needs. |
| Auth token | Issued by the person server after the **scope consent**. Lets the agent call the API with that scope. |
| Scope | A DreamFactory role that an admin offers to agents, such as `sales.read` |

Every token is bound to the agent's key and lasts at most an hour (an agent token up to 24 hours).

## How it works in DreamFactory

![Sequence diagram of the AAuth flow: the agent is challenged for a person token, the person signs in and continues, the agent is challenged for an auth token for scope sales.read, the person allows it, and the agent's signed request runs under that role.](/img/security/aauth/aauth-flow.svg)

1. The agent calls an API, for example `GET /api/v2/sales/_table/orders`, signed with its **agent token**. DreamFactory verifies the agent against its agent provider's published metadata and keys, and answers `401` with `AAuth-Requirement: requirement=person-token`.
2. The agent asks DreamFactory's **person server** for a **person token** (`POST /aauth/person`). The answer is `202` with a link and a code, such as `7KQM-4D2P`.
3. The agent gives the link to the person. The person opens it, signs in, and clicks **Continue as** with their first name (for example **Continue as Jordan**) to confirm that the agent acts for them. This is the **identity step**.
4. The agent polls the pending request and receives the person token.
5. The agent calls the API again, signed with the person token. DreamFactory works out which scope the request needs and answers `401` with `requirement=auth-token` and a **resource token** that names the scope, here `sales.read`.
6. The agent asks the person server for an **auth token** (`POST /aauth/token`). The person clicks **Allow** for the scope on the consent card (the **scope consent**), and the agent polls until it receives the auth token. If the person ticked **Always allow** earlier for this agent and every scope it now asks for, the person server returns the auth token at once, without a consent page.
7. The agent calls the API with the auth token. DreamFactory runs the request under the scope's role and returns the response with the header `AAuth-Scope: sales.read`.

The agent then reuses its tokens until they expire and signs every request afresh. Each request and response, header by header, is in [The AAuth HTTP Exchange](./http-exchange.md).

You can watch the whole exchange in the admin app: **Try it** runs it with a built-in agent and draws every step.

![A completed Try it run drawn as a sequence across Agent, API and Person Server, ending with the Response card: status 200 and the JSON list of orders](/img/security/aauth/try-it-result.png)

### One origin, three protocol roles

In AAuth terms, DreamFactory plays three parts. Each publishes a metadata document:

| Protocol role | Published at | What it does |
|---|---|---|
| Resource | `/.well-known/aauth-resource.json` | Verifies signed `/api/v2` calls, sends challenges in the `AAuth-Requirement` header, and issues resource tokens |
| Person server | `/.well-known/aauth-person.json` | People sign in (with a DreamFactory account, an LDAP or Active Directory account, or single sign-on) and approve agents at `/aauth/interact` |
| Agent provider | `/.well-known/aauth-agent.json` | Identity of the built-in Try it agent only. Your own agents use their own agent provider. |

All three live on one https origin, the **issuer**, which you set with `DF_AAUTH_ISSUER`, for example `https://api.example.com`. If `DF_AAUTH_ISSUER` is not set, DreamFactory uses the origin of `APP_URL` when that is https. DreamFactory can also trust external person servers, so that agents approved in your organization's own person server can call it. See [Person Servers](./admin-guide.md#person-servers).

### Scopes are roles

AAuth adds no new permission model:

- A sys admin enables a role as a scope, and gives it a name such as `sales.read` and a description that people read when they approve, such as "Read customers and orders".
- For each request, DreamFactory asks for the least privileged enabled scope that allows it ([How DreamFactory picks a scope](./admin-guide.md#how-dreamfactory-picks-a-scope)). Agents do not need to know your roles: the challenge tells them which scope to ask for.
- The request runs with exactly that role, so the role's service access, filters, lookups, event scripts and rate limits apply as they would for an API key with that role.
- When the approval came from DreamFactory's own person server, the approving person's DreamFactory user is attached to the session too, always without sys admin rights, so lookups, per-user limits and scripts see that person.
- People can grant only roles they hold. Sys admins can grant any enabled scope. Whoever approves, the agent never gets sys admin rights.

## What agents can and cannot do

Agents can:

- Call any `/api/v2` API that their scope's role allows.
- Appear under **Security > AAuth > Agents** on their first signed request. There is no registration step.
- Reuse their person and auth tokens for up to an hour.
- Skip the scope consent when the person ticked **Always allow** for that agent and those scopes earlier.

Agents cannot:

- Use AAuth on the MCP endpoints. MCP clients keep using OAuth, or an API key where the MCP service allows it ([API Key Authentication for MCP](/AI/mcp-api-key-auth)).
- Act without a person on DreamFactory's own person server. df-aauth 0.1.0 implements the three-party mode only, so there is no equivalent of OAuth's `client_credentials`. An external person server that you trust decides for itself how it issues tokens.
- Keep working past the person token's lifetime without the person. A person token lasts at most an hour, no auth token outlives the person token behind it, and every new person token needs the person to open a link and click **Continue as** again; **Always allow** skips only the scope consent. Plan for one person interaction per hour of continuous work.
- Get more access than the approving person could grant. On DreamFactory's own person server, a person grants only roles they hold, and this is checked again on every request.

## Choosing an authentication method

| Method | Who is identified | A person approves the caller | If the credential is copied | Use it for |
|---|---|---|---|---|
| AAuth | The agent and the person it acts for | Yes, per agent and scope | Useless without the agent's private key | AI agents acting for identifiable people |
| [API key](/api-generation-and-connections/api-keys) (app) | The app | No | Works for anyone until the key is refreshed | Unattended services, scripts and integrations |
| User session token | A signed-in person | The person signs in themselves | Works until it expires | Apps a person uses directly |
| [Login services](/Security/authenticating-your-apis) (OAuth, OpenID Connect, SAML, LDAP) | A person, through your identity provider | The person signs in | As for a session token | People signing in to DreamFactory; also usable to [approve AAuth agents](./sso-approval.md) |
| [MCP server](/AI/mcp-server) | An OAuth user, or an API key when the MCP service allows it | With OAuth, the person signs in | Works until the OAuth token expires or the key is refreshed | MCP clients such as desktop assistants |
| [Agents service](/AI/agents) | An agent record with its own API key | An admin approves access requests | As for an API key | An agent registry and capability routing |

Choose AAuth when an agent acts for people and you want their approval, and an Activity log of which agent acted for whom. Keep API keys for unattended jobs, where no person is available to approve.

## Requirements at a glance

| Requirement | Detail |
|---|---|
| DreamFactory | 7.7.1 or later 7.x |
| License | AAuth requires a DreamFactory commercial license (Gold or Platinum). |
| Package | `dreamfactory/df-aauth` installed, with its tables created (`php artisan migrate`) |
| PHP | 8.3 or later with the `sodium`, `openssl`, `curl`, `json` and `mbstring` extensions |
| Issuer | One https origin on port 443 that agents and approvers reach, such as `https://api.example.com`. It can be public or internal. See [Choose the issuer](./install.md#choose-the-issuer). |
| Outbound https | DreamFactory fetches the metadata and keys of the agent providers your agents use, on public addresses unless you admit internal ones ([Private networks and custom CAs](./install.md#private-networks-and-custom-cas)) |
| Clocks | By default, signatures are accepted within 60 seconds of DreamFactory's clock. Run NTP on DreamFactory and agent hosts. |
| Several DreamFactory nodes | A shared Redis or Memcached cache and shared consent sessions ([Several DreamFactory nodes](./operations.md#several-dreamfactory-nodes)) |
| Agent | Code you control that signs its requests: the `aauth` command, the Node or Python client that ships in `vendor/dreamfactory/df-aauth`, or any client that implements the drafts. Assistants that only speak MCP, such as desktop assistants, can't use AAuth; they keep using OAuth or API keys. See [Building an Agent with the AAuth Clients](./build-an-agent.md). |
| Agent provider | An https origin you control that serves `/.well-known/aauth-agent.json` and a key set (JWKS). A static host is enough. |
| Approver | A person the agent can send a link to, at least once an hour while it works, who holds the role behind each scope the agent needs, or a sys admin |

Installation and every setting are in [Installing and Configuring AAuth](./install.md).

## Standards status

:::note
AAuth is defined by individual IETF Internet-Drafts, draft-hardt-oauth-aauth-protocol-11 and draft-hardt-httpbis-signature-key-09, not by finished standards. Later revisions of the drafts may change the protocol. DreamFactory implements the three-party person-server ("PS") authorization mode of these revisions. Requests are signed with [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421) HTTP message signatures, request bodies are covered with an [RFC 9530](https://www.rfc-editor.org/rfc/rfc9530) `Content-Digest`, and keys are Ed25519 or ES256. An agent that follows the drafts works with DreamFactory without DreamFactory-specific code.
:::

Not supported in df-aauth 0.1.0: access servers, missions, sub-agents, call chaining, the revocation endpoint and multipart bodies. See [Out of scope in 0.1.0](./security-model.md#out-of-scope-in-010).

## Next steps

**DreamFactory admins:**

- **[Installing and Configuring AAuth](./install.md)**: install the package, put a TLS reverse proxy in front of DreamFactory, and set the issuer
- **[Quickstart: Approve Your First Agent Call](./quickstart.md)**: switch AAuth on and approve the built-in Try it agent
- **[Managing AAuth](./admin-guide.md)**: every tab of Security > AAuth, who can approve what, and how to respond to an incident
- **[Approving Agents with Company Sign-In](./sso-approval.md)**: let approvers sign in with LDAP, Active Directory or single sign-on

**Agent developers:**

- **[Building an Agent with the AAuth Clients](./build-an-agent.md)**: give your own agent an identity and call DreamFactory from the command line, Node or Python
- **[The AAuth HTTP Exchange](./http-exchange.md)**: the exact requests and responses, for writing a client in any language
- **[AAuth for OAuth Developers](./oauth-mapping.md)**: how OAuth 2.0 and OpenID Connect concepts map to AAuth

**Security reviewers and operators:**

- **[AAuth Security Model](./security-model.md)**: what DreamFactory verifies on every request, what it records, and what is left to you
- **[Operating AAuth in Production](./operations.md)**: signing keys, backups, several nodes, monitoring and upgrades
- **[Troubleshooting AAuth](./troubleshooting.md)**: every error an agent, approver or admin can see, and how to fix it
