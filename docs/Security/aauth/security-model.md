---
sidebar_position: 9
title: AAuth Security Model
id: security-model
sidebar_label: Security model
description: "What AAuth on DreamFactory protects, what it checks on every signed request, how it handles replay, SSRF and consent pages, what it records, and its limits."
keywords: [AAuth, security model, threat model, replay, SSRF, consent, signing keys, audit]
difficulty: "advanced"
---

# AAuth Security Model

This page is for security reviewers and the DreamFactory admins who work with them. It states what AAuth on DreamFactory protects and from whom, exactly what DreamFactory checks on every signed request, what it records, and what df-aauth 0.1.0 leaves to you. Setting names such as `DF_AAUTH_SIGNATURE_WINDOW` are described in the [Configuration reference](./install.md#configuration-reference).

:::note
AAuth is one control you can use in your own security program. It does not by itself satisfy any regulation or framework.
:::

## What is protected, and from whom

| Asset | Threat |
|---|---|
| The data behind DreamFactory's APIs | An agent, or someone who stole an agent's token, reads or changes more than a person approved. |
| DreamFactory users' credentials | The consent pages are phished, framed, brute-forced or abused through cross-site request forgery (CSRF). |
| DreamFactory's internal network | An attacker-chosen issuer URL makes DreamFactory fetch internal addresses (server-side request forgery, SSRF). |
| DreamFactory's signing keys | Theft lets someone mint person and auth tokens that DreamFactory accepts. |

## Design properties

1. **Every token is bound to the agent's key.** Agent, person and auth tokens carry the agent's public key (`cnf.jwk`), and every request is signed with the matching private key. Unlike an API key, a token copied from a log or a proxy is useless without that private key.
2. **People approve, roles decide.** An agent gets a scope only when a person approves it, and a scope is a DreamFactory role. On DreamFactory's own person server, the person must hold that role, or be a sys admin, to approve it. DreamFactory enforces that role exactly as it does for an API key: service access, record filters, lookups, event scripts and limits.
3. **Off by default, refused on a failed check.** Nothing changes until a sys admin switches AAuth on. A request that fails a signature, token, scope or block check is refused; nothing falls back to anonymous access. The checks against the system database fail closed: when it cannot say whether the agent is blocked, or which agent one of DreamFactory's own tokens was issued for (for example a database error or a lock timeout under heavy load), the request gets `503 temporarily_unavailable` with `Retry-After: 30`. The checks kept in the cache are the exception: without a working cache they are skipped rather than failed, so a cache outage does not stop agent access. See [Without a cache](#without-a-cache).

## What DreamFactory verifies on a signed API request

While AAuth is on, a request to `/api/v2` that carries a `Signature-Key` header is an AAuth request. A request without one goes through DreamFactory's normal API key and session token checks, unchanged.

DreamFactory checks an AAuth request in this order and stops at the first failure. Malformed requests get `400`, signature and token failures get `401` with a `Signature-Error` header, and refusals after everything verified get `403`. The messages are listed in the [Error reference](./troubleshooting.md#error-reference).

1. **The request is unambiguous.** It carries no DreamFactory API key or session token, no method override (an `X-HTTP-Method-Override`, `X-HTTP-Method` or `X-Method-Override` header on any request, or a `_method` or `method` parameter that changes the method of a POST), and no `multipart/form-data` body (`400 invalid_request`). Mixed credentials are ambiguous, an override would let the method that runs differ from the one that was signed, and DreamFactory cannot check `Content-Digest` against a `multipart/form-data` body.
2. **The signature headers are present:** `Signature`, `Signature-Input` and `Signature-Key`.
3. **`@authority` is the issuer host.** The request's `Host` must be the issuer's host name. A request to another name of the same server is refused with `Use https://api.example.com`.
4. **The key header and the token type are acceptable.** `Signature-Key` uses the `jwt` scheme, and the token's `typ` is an agent, person or auth token. This is checked before anything else in the token.
5. **The token's person server is trusted, before any network fetch.** For person and auth tokens, the token issuer (`iss`) must be a person server that is listed and enabled under **Person Servers**. For DreamFactory's own tokens that is the **This DreamFactory** row, with the built-in person server on. An auth token must also come from a person server that names itself (`ps` equals `iss`); tokens from access servers are refused. Otherwise DreamFactory answers `401 invalid_jwt` with "The token issuer is not a person server trusted by this DreamFactory." without contacting the issuer, so an untrusted issuer cannot make DreamFactory fetch anything.
6. **The token verifies.** DreamFactory reads the issuer's metadata (its `issuer` must equal `iss` byte for byte) and the key named by `kid` from the issuer's JWKS, then checks the signature, the `alg` (Ed25519 or ES256 only, never `none` or `EdDSA`), `exp`, `iat` (at most 60 seconds in the future), a lifetime of at most one hour for person and auth tokens, and a `cnf.jwk` with a supported `alg`. DreamFactory's own tokens are verified with keys from its database, never over HTTP.
7. **The HTTP signature verifies with `cnf.jwk`.** The required components are covered (`@method`, `@authority`, `@path` and `signature-key`; also `content-type` and `content-digest` when there is a body, and `@query` when there is a query string), `created` is within the signature window (60 seconds by default), `expires` is honored when present, and `Content-Digest` matches the exact body. The path and query are taken raw from the request line, not from DreamFactory's normalized forms.
8. **The request is not a replay.** A request other than GET or HEAD with the same request key and signature base has not been seen before. See [Replay](#replay).
9. **The agent is not blocked** (`403 agent_blocked`). The request belongs to the agent its agent token names; with a person or auth token from DreamFactory's own person server, to the agent the token was issued for, which DreamFactory recorded when it issued the token (a token without a record gets `401 invalid_jwt` with "This DreamFactory has no record of issuing this token. Get a new one."); with an external person server's token, to the agent id the signing key last presented in an agent token. Neither that agent nor any agent id the signing key has presented an agent token for (a key never seen with one is listed as a `jkt:` row of its own) may be blocked, whatever agent id the current token names. A signing key may present agent tokens for at most 20 agent ids; an agent token that names one more gets `403 too_many_agents`. When the system database cannot say, the request gets `503 temporarily_unavailable`. The authorization endpoint and DreamFactory's person server make the same checks. A request signed with an agent token stops here with `401 person_token_required`: an agent token identifies the agent, not a person.
10. **The token is meant for this DreamFactory.** For person and auth tokens, `aud` is this DreamFactory's issuer and `sub` is present. A request signed with a person token stops here with `401 auth_token_required` and a resource token for the least privileged scope that allows the request, or `403 insufficient_scope` when no enabled scope does. See [How DreamFactory picks a scope](./admin-guide.md#how-dreamfactory-picks-a-scope).
11. **The auth token covers the request.** One of its granted scopes is enabled, allowed for the person server that issued the token, already held by its role when the token was issued (`iat`), and backed by an active role that allows the method, service and path. Otherwise the agent gets a step-up challenge (`401 insufficient_scope`) or `403 insufficient_scope`. For tokens from DreamFactory's own person server, the person must still be an active user and still hold the scope's role (or be a sys admin). This is checked on every request.

Only then does DreamFactory set up the session for the request:

- the scope's role;
- for tokens from DreamFactory's own person server, the person's DreamFactory user, with sys admin rights forced off. Tokens from external person servers carry no DreamFactory user;
- an app named `aauth`, which AAuth creates when it is first switched on and which has no role of its own.

DreamFactory's access check then runs as usual, and so do record filters, lookups, event scripts and limits. The response carries an `AAuth-Scope` header that names the scope the request ran under.

Agents can never change AAuth settings: `/api/v2/system/aauth` requires a sys admin, and an agent's session is never one.

:::warning[A scope carries everything its role allows]
An agent holding a scope can do anything the scope's role allows, including any access the role grants to the `system` service. Offer only roles you would give the agent itself, and keep them narrow. See [Scopes](./admin-guide.md#scopes).
:::

## Replay

- A signature's `created` time must be within 60 seconds of the server clock, in either direction (`DF_AAUTH_SIGNATURE_WINDOW`).
- POST, PUT, PATCH and DELETE requests, and requests with any other method except GET and HEAD, are remembered for twice the window and refused the second time with "This signature was already used." DreamFactory remembers what was signed, the request key and the signature base, not the signature bytes. An ES256 signature can be rewritten into a second valid form with different bytes; both forms count as the same request, so the once-only guarantee holds for Ed25519 and ES256 request keys alike. Agents sign every request afresh.
- A captured GET request could be replayed within the window. GET requests are read-only by convention, and TLS between the agent and DreamFactory keeps signatures out of reach.
- Resource tokens are single-use at the person server. A retry with the same agent key gets back the pending request it already created, so a lost response does not strand the agent.
- Replay protection and single-use resource tokens need the AAuth cache store (`DF_AAUTH_CACHE_STORE`, otherwise DreamFactory's default cache); see [Without a cache](#without-a-cache). With several DreamFactory nodes the store must be shared, or a request replayed to another node is accepted. `php artisan df:aauth status` warns when the store is local to one node. See [Several DreamFactory nodes](./operations.md#several-dreamfactory-nodes).

:::warning
If one of your APIs changes data on GET, for example a stored procedure called with `GET /api/v2/<service>/_proc/<name>`, keep in mind that GET requests are protected against replay only by the 60-second window.
:::

## Without a cache

AAuth keeps its short-lived state in the AAuth cache store (`DF_AAUTH_CACHE_STORE`, otherwise DreamFactory's default store). When that store fails, for example because Redis is down and every call errors, these checks are skipped rather than failed, so a cache outage does not take agent access down:

| Check | While the cache is unavailable |
|---|---|
| Replay of signed requests other than GET and HEAD | Not detected: a captured request can be sent again while its `created` time is within the signature window (60 seconds by default). |
| Single-use resource tokens (person server) | Not enforced: a resource token can be exchanged again until it expires (`DF_AAUTH_RESOURCE_TOKEN_TTL`, 300 seconds by default). Each exchange still needs the person's approval or a standing grant. |
| Interaction code ownership | Not enforced: any browser holding the code can act on an open request, not only the first one. Approving still needs a signed-in person who may grant what is asked, and a scope request still only the person named in the agent's person token. |
| Rate limits and failure counters | Off: sign-in failures per client address and per account, wrong codes, five wrong passwords ending a request, single sign-on returns, new pending requests per agent and per client address per minute, discovery fetches that miss the cache, and Activity rows for unverified requests. The cap of 20 open pending requests per agent is kept in the system database and still applies. |
| Discovery results | Not cached: the metadata and key sets of agent providers and external person servers are fetched for every request that needs them, and failures are not remembered. |
| **Try it** | Does not work: its runs and tokens live in the cache. |

Everything that decides access is in the system database and fails closed: keys, scopes, person servers, blocks, grants, pending requests and the records of issued tokens. DreamFactory logs no line for each skipped check, so monitor the cache store itself.

When the cache is emptied instead, by a flush or a restart without persistence, what it held is lost once: a request signed within the last signature window can be replayed once more, resource tokens can be exchanged again until they expire, open approval requests lose their owning browser, so another browser holding the code can take one over, and **Try it** starts over.

## Discovery and SSRF

DreamFactory fetches metadata and keys (JWKS) for the agent providers and external person servers named in tokens. Its built-in person server also fetches the metadata, and to verify resource tokens the keys, of the resources that agents name in their requests to it. Any agent can present an agent token, so the agent chooses which agent provider and which resource URL DreamFactory fetches. Every fetch is therefore admitted first:

- Only https URLs, with no credentials in the URL.
- The host must resolve only to public unicast addresses. Loopback, private, link-local (including cloud metadata addresses), CGNAT, multicast, documentation and reserved ranges are refused, for IPv4 and IPv6. IPv4-mapped, NAT64 and 6to4 addresses are judged by the IPv4 address inside them. Every address the name resolves to must pass.
- The connection is pinned to the address that was checked, so DNS rebinding cannot redirect it, and it never goes through a proxy from the environment.
- No redirects, a 3-second timeout (`DF_AAUTH_FETCH_TIMEOUT`) and a 256 KB size cap (`DF_AAUTH_FETCH_MAX_BYTES`).
- Results are cached for 5 minutes (`DF_AAUTH_DISCOVERY_CACHE_SECONDS`). An unknown `kid` refreshes a JWKS at most once per minute per URL. Failures are remembered for 60 seconds, and an unreachable host is skipped for 60 seconds. Fetches that miss the cache are limited to 20 per client address per minute.
- For person and auth tokens, person servers that are not listed are never fetched (step 5 above).

Internal agent providers, person servers and resources are admitted only explicitly: per host name with `DF_AAUTH_PRIVATE_HOSTS` (the host may then resolve to private-use addresses, not to loopback), or per network with `DF_AAUTH_PRIVATE_NETWORKS`. Some addresses stay unreachable whatever you list: link-local addresses (`169.254.0.0/16`, which holds cloud metadata services such as `169.254.169.254`, and `fe80::/10`), `fd00:ec2::/32`, `100.100.100.200`, `0.0.0.0/8` and `::`, multicast, broadcast and `240.0.0.0/4`, in every IPv6 spelling.

:::warning
Keep both lists to the servers that need them. Whoever presents a token chooses the URL DreamFactory fetches, so never list the networks of DreamFactory's database, cache or other internal services. See [Private networks and custom CAs](./install.md#private-networks-and-custom-cas).
:::

`DF_AAUTH_CA_BUNDLE` replaces the trusted certificate authorities for these fetches and for **Try it**. If the bundle cannot be read, every fetch fails rather than trusting more or less than you configured.

:::danger[Development only]
`DF_AAUTH_ALLOW_INSECURE=true` lifts the https and public-address rules. Link-local and metadata addresses stay refused. Never set it on an instance that anyone else can reach.
:::

## Consent pages

People sign in at `/aauth/interact` to approve agents and at `/aauth/grants` to review their standing grants, so these pages get the usual web protections:

- **Browser protections.** Every form carries a CSRF token. Responses send a `Content-Security-Policy` with `frame-ancestors 'none'`, `default-src 'self'` and `form-action 'self'`, `X-Frame-Options: DENY`, `Cache-Control: no-store` and `Referrer-Policy: no-referrer`. Behind the web server of the DreamFactory images the responses carry a second `X-Frame-Options: SAMEORIGIN` header, which that server adds to every response; the `frame-ancestors 'none'` policy still forbids framing. The session cookie is marked `Secure` whenever the issuer is https, even when DreamFactory sits behind a TLS proxy.
- **Password sign-in.** The pages use DreamFactory's password check without creating a DreamFactory session. Failures are limited per client address (10 per 10 minutes) and per account (20 per 15 minutes). While a limit is reached, the password is not checked at all, so the pages cannot be used to test passwords. Five wrong passwords on one request end that request. The per-account limit is keyed by the login, so anyone who knows a person's email or username can fill it and stop that person from approving with a password or directory account for 15 minutes at a time; single sign-on is not affected.
- **Directory accounts and single sign-on.** LDAP and Active Directory accounts are checked with the directory service's own bind and role mapping, under the same limits. OAuth, OpenID Connect and SAML users go through DreamFactory's login page, which hands back a DreamFactory session token in the URL fragment, so it stays out of server logs and the `Referer` header. The return needs a single-use state bound to the browser that started it, and the token is checked like any DreamFactory session. See [Approving Agents with Company Sign-In](./sso-approval.md).
- **The interaction code is a correlation id, not a credential, and whoever acts on it first owns the request.** Every decision is a CSRF-protected form: approving always needs a signed-in person, while **Deny this request** works without signing in. The first browser that acts on a code owns the request and its outcome. Acting is anything the browser sends from the page: signing in, starting single sign-on, typing the code, or any button on the card (**Deny**, **Not you?**, **Continue as**, **Allow**); the **Waiting for the agent** page claims the agent's next request the same way. Every other browser, including one that opened the link earlier, gets "This code was already used in another browser". Opening the link claims nothing and changes nothing, so chat link previews and mail link scanners that fetch it first cannot use it up. Until the person acts, anyone holding the link can act first: deny the request, or, at the identity step, sign in with their own account and continue as themselves, so that the agent acts for that account. A scope request can be approved only by the person named in the agent's person token. Agents should show the link only to the intended person (see [What people see](./admin-guide.md#what-people-see)). A code expires with its request (10 minutes by default), and wrong codes are limited to 10 per client address and per browser session per 10 minutes while the cache works (see [Without a cache](#without-a-cache)).
- **Signing in is not consent.** After signing in, the person still chooses **Continue as** (identity step) or **Allow** (scope step), sees which account is signed in, and can switch accounts with **Not you?**.
- **Self-asserted names are shown with agent ids.** The agent's name comes from its own agent provider's metadata, so every card also shows the agent id from the verified agent token, such as `aauth:reports@agents.example.com`, and the resource's name is shown with its host. The card does not show the agent provider, and the host in the agent id is not checked against it (see [Out of scope in 0.1.0](#out-of-scope-in-010)). Logos supplied by agents are never loaded. Only DreamFactory's own **Try it** agent, recognized by its verified issuer and id, gets the DreamFactory mark.
- **Callbacks go only to the published callback.** The browser returns only to the `callback_endpoint` that the agent provider publishes (same scheme, host, port and path; https). That URL can be on any host the provider chooses. Tokens never pass through it; the agent collects them by polling.
- **Agent text is inert.** All text from agents, such as names and justifications, is escaped and shown as plain text.

## Who can grant what

- **On DreamFactory's own person server, a person can approve a scope only when they hold its role or are a sys admin.** The role can be assigned to the user in any app. Scopes the person cannot grant appear locked with "You don't have this role". A person cannot give an agent more than they have. See [Who can approve a scope](./admin-guide.md#who-can-approve-a-scope).
- **Scope requests belong to the person the agent identified.** After a person approves the identity step, only that person can approve the scope requests the agent makes with that person token. Anyone else who signs in sees "Sign in as the person this agent acts for."
- **An agent is not bound to one person in advance.** Section 13.14 of the protocol draft, which would let an agent be tied to one person, is not implemented. Any active DreamFactory user can approve the identity step of any agent: whoever first signs in on the agent's link and chooses **Continue as** becomes the person the agent acts for, and can then approve every scope whose role they hold. Agents should send the link only to the intended person, and that person should check that the code on the page matches the one the agent showed.
- **External person servers start with no scopes.** A newly added external person server can vouch for no scope until a sys admin chooses some under **Person Servers**. The external person server decides who approves; DreamFactory enforces the scope's role and attaches no DreamFactory user to the request. You can narrow the scopes of **This DreamFactory** in the same column. See [Person Servers](./admin-guide.md#person-servers).
- **Agents never get sys admin rights,** whoever approved them. When a sys admin approves, the agent still runs with only the scope's role.
- **Subject identifiers (`sub`) are pairwise per resource,** so two resources cannot correlate a person by `sub`.
- **A scope name a role gives up does not pass to the next role that takes it.** On a rename, **Always allow** grants and person server scope lists move to the new name in the same transaction; a rename whose cleanup fails is not made. A role delete gives the name up only once the role is gone: the name is then removed from them (a grant left with no scope is deleted), and so is a new name that another admin saved for the role while the delete ran. A delete that DreamFactory refuses, for example because a login service still has the role as its default role, changes nothing the role can notice. A role that takes a name, as a new scope or by a rename, starts without grants or person server list entries for it, so even a cleanup that failed after a delete (DreamFactory tries it once more when the request ends) passes nothing on. The old name stays reserved for 61 minutes, the longest auth token lifetime DreamFactory accepts plus a minute: for the renamed role, which can take it back; for no role at all from the moment a role delete starts (a role whose delete is refused keeps its name and can save it again); and, once the role is gone, the names it renamed away are reserved for no role too. DreamFactory also records when a role took its scope name and ignores that name in auth tokens issued (`iat`) before then, so a token minted for an earlier holder, even late by an external person server, never reaches the new role. Two exceptions remain: a person server set to **All scopes** trusts every enabled scope, including a later one with the same name, and an external person server's own standing approvals are keyed by scope name, outside DreamFactory's reach. See [Good practice](./admin-guide.md#good-practice) and [When a rename or role delete fails](./admin-guide.md#when-a-rename-or-role-delete-fails).
- **DreamFactory's built-in person server also serves other AAuth resources.** An agent can ask it for person and auth tokens for any https resource the agent names. For a resource other than this DreamFactory, the person the agent acts for can approve every requested scope, whatever roles they hold, because DreamFactory roles describe only DreamFactory's own APIs. Those tokens are accepted only by resources that trust this DreamFactory as a person server. If you do not want DreamFactory to act as a person server at all, set `ps_local_enabled` to `false` (see [Settings stored in the database](./install.md#settings-stored-in-the-database)). DreamFactory then accepts tokens only from external person servers, and its consent pages and **Try it** stop working.

## Keys

- AAuth uses three Ed25519 signing keys: `resource` (resource tokens), `person` (person and auth tokens) and `agent` (agent tokens of the **Try it** agent). They are generated when AAuth is first switched on. The private halves are stored in the `aauth_keys` table, encrypted with `APP_KEY`. The public halves are published at `https://api.example.com/aauth/jwks/resource.json`, `person.json` and `agent.json`.
- `APP_KEY` also encrypts the finished tokens stored in pending requests and the **Try it** agent's key and tokens in the cache, and it keys the HMAC behind the pairwise subject identifiers.
- Rotate keys with `php artisan df:aauth rotate-keys`, or on a schedule with `DF_AAUTH_KEY_ROTATION_DAYS`. Retired keys stay published and accepted for `DF_AAUTH_KEY_OVERLAP` (24 hours by default), so tokens they signed keep working until they expire. If a key may have leaked, rotate it with `--revoke`: every token it signed stops verifying at once at this DreamFactory, and agents must ask again. Other resources that trust this DreamFactory as a person server stop accepting those tokens when their cached copy of its key set expires. See [Signing keys](./operations.md#signing-keys) and [APP_KEY](./operations.md#app_key).

:::danger
Anyone with `APP_KEY` and a copy of the system database can mint tokens that this DreamFactory accepts. Protect both, including in backups, as you protect the admin password.
:::

## Abuse limits

Open approval requests (20 per agent; 30 new per agent and 60 new per client address per minute), sign-in and code attempts, discovery fetches, and Activity rows for requests refused before their token and signature verify (20 per client address per minute) are all bounded. Without a working cache, of these only the cap of 20 open requests per agent still applies; see [Without a cache](#without-a-cache). One signing key may present agent tokens for at most 20 agent ids. The full list is in [Built-in limits](./install.md#built-in-limits); the limits are fixed in 0.1.0. They are counted per client address, so behind a reverse proxy set [`DF_AAUTH_TRUSTED_PROXIES`](./install.md#df_aauth_trusted_proxies). Without it every client shares the proxy's budget, and one client can lock out the others.

## What is recorded

**Activity** (the **Activity** tab, table `aauth_activity`) is an operational log with one row per signed `/api/v2` request, and per `/aauth/authorize` request refused because the agent is blocked, the token has no record, the signing key has used too many agent ids, or the agent's state is unavailable: the time, the agent id, the person server, the person's `sub`, the DreamFactory user id when known, the scope, the method, the path, the status, the outcome and the reason. It does not store the query string, headers, bodies or tokens. Rows are kept for 30 days by default (`DF_AAUTH_ACTIVITY_RETENTION_DAYS`; `0` keeps them forever). Requests refused before their token and signature verify, such as a bad signature or a token from an untrusted person server, are recorded without an agent or person, at most 20 per client address per minute. Requests refused because the system database could not say whether the agent is blocked, or which agent a token was issued for, are recorded with status `503` and no agent. Requests with a token DreamFactory has no record of (`401`), or with an agent token for one agent id more than its key may use (`403`), are also recorded without an agent. Requests to the person server endpoints (`/aauth/person`, `/aauth/token`, polling) and the consent pages are not recorded in Activity, nor are other requests to `/aauth/authorize`. Each row names the agent the request belongs to: for person and auth tokens from DreamFactory's own person server, the agent the token was issued for; for an external person server's tokens, the agent id the key presented most recently, which that agent's provider chooses; and for a request refused because an agent is blocked, the blocked agent (see [Which agent a request belongs to](./admin-guide.md#which-agent-a-request-belongs-to)). Activity is not a complete audit record: a row can be missing when its database write fails (the request is still answered), rows are pruned after the retention period, and sys admins can delete an agent's rows. For audit purposes, export the rows to your own log store.

**Agents** (table `aauth_agents`) stores each agent id with its agent provider, its name, when it was first and last seen, its request count and whether it is blocked. Agents seen only at the person server or the authorization endpoint have a request count of 0. The `aauth_agent_keys` table keeps one row for every agent id each signing key has presented an agent token for (at most 20 per key), so blocks also apply to person and auth tokens signed with that key, and requests with an external person server's tokens can be attributed to an agent. The admin API lists, for each agent, the other agents that share a signing key with it (`shares_key_with`, see [What a block covers](./admin-guide.md#what-a-block-covers)). Key bindings not seen for the Activity retention period are dropped, except bindings to blocked agents.

**The built-in person server** stores:

- pending requests (`aauth_ps_pending`): the agent, the resource, the requested scopes, the agent's justification, the interaction code, the person once known, the status, and the resulting token encrypted with `APP_KEY`. The token stays in the row after the agent collects it. A row is deleted by the next prune once its request has been expired for an hour (daily at 03:17, or sooner); without the scheduler it can stay much longer;
- **Always allow** grants (`aauth_ps_grants`): the person, the resource, the agent, the scopes, and when the grant was created and last used. Grants stay until someone revokes them or the user is deleted;
- pairwise subject mappings (`aauth_ps_subjects`), which are not pruned; they are deleted with the user;
- a record of every person and auth token it issues (`aauth_ps_tokens`): the token id (`jti`), whether it is a person or an auth token, the agent it was issued for (agent provider, agent id and name) and when it expires, so that requests with the token belong to that agent. A token whose record cannot be written is not issued. A record is deleted by the next prune once its token has been expired for an hour.

**Try it** keeps each run in the AAuth cache store for 15 minutes: every step's request, response headers and response body (cut at 64 KB), unencrypted, so data your API returned to Try it sits in the cache for that time. The Try it agent's key and its cached tokens are encrypted with `APP_KEY`.

Rate-limit counters live in the cache under hashed keys, so email addresses and client addresses do not appear in the cache.

:::warning[No approval audit trail]
DreamFactory does not store a durable record of each consent decision: who approved or denied which scopes, and when. Activity shows the person and scope that every API call ran under. The pending request, which names the person and the outcome, is deleted by the next prune once it has been expired for an hour. Grants exist only for **Always allow**, and DreamFactory's log has no line for approvals. Do not rely on AAuth alone as an approval audit trail.
:::

## Out of scope in 0.1.0

- **Access servers and other access modes.** DreamFactory implements the three-party mode only: no access server federation, missions, sub-agents, call chaining or `AAuth-Access` sessions. The built-in person server refuses a request for a mission (`400 invalid_request`) rather than ignoring it, and refuses sub-agent tokens; the resource refuses auth tokens issued by access servers.
- **Agent id domains.** DreamFactory's person server checks that an agent id has the form `aauth:<name>@<host>`, not that the host is the host of the agent provider that signed the agent token; the `/api/v2` resource records any `sub` from a verified agent token. A provider can therefore present an agent id on a domain it does not control, and the consent page shows that id. Agents, blocks and grants are kept per agent id and provider, so such an agent cannot use another agent's grants; the **Agents** tab shows its agent id in full next to the real provider.
- **Blocking an agent provider.** A block applies to an agent id and to every key DreamFactory has seen it use, whatever agent id those keys present later. An agent that controls an agent provider can come back with a new key under a new agent id; that is a new agent with no grants, which a person must approve again. A compromised agent provider can mint any number of such agent ids, and no control blocks a whole agent provider. See [What a block covers](./admin-guide.md#what-a-block-covers).
- **A revocation endpoint.** There is none. An issued token stays valid until it expires, at most one hour after it was issued, unless an admin switches off what it relies on. See [Responding to an incident](./admin-guide.md#responding-to-an-incident).
- **Binding an agent to one person** (protocol section 13.14). Any active DreamFactory user can approve any agent's identity step, and then the scopes whose roles they hold.
- **Agent key custody.** How an agent and its agent provider protect their keys is up to them. DreamFactory cannot tell a compromised agent provider from a genuine one. If that happens, block its agents under **Agents** and switch off the scopes they hold, as described in [Responding to an incident](./admin-guide.md#responding-to-an-incident).
- **Tokens from external person servers** do not name the agent, so DreamFactory recognizes the agent by its signing key. Their requests belong to the agent id the key last presented in an agent token, which its agent provider chooses, and blocks cover the keys DreamFactory has seen with that agent's agent token, and a key's `jkt:` row when you block that row.
- **Multipart uploads.** Signed requests with a `multipart/form-data` body are refused, because DreamFactory cannot check their `Content-Digest`.
- **The admin app.** It is protected by DreamFactory's own admin authentication; AAuth adds nothing to it. Only sys admins see **Security > AAuth** and can call `/api/v2/system/aauth`.

See [Standards status](./overview.md#standards-status).

## Reporting a vulnerability

Email support@dreamfactory.com with "security" in the subject. Do not open a public issue.

## Related

- [Managing AAuth](./admin-guide.md): scopes, person servers, agents, Activity and grants
- [Operating AAuth in Production](./operations.md): keys, backups, several nodes and monitoring
- [Installing and Configuring AAuth](./install.md): the issuer, the reverse proxy and every setting
- [Role-Based Access Control](/Security/role-based-access): the roles that scopes stand for
