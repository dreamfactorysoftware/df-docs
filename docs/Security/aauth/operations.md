---
sidebar_position: 10
title: Operating AAuth in Production
id: operations
sidebar_label: Operations
description: "Run AAuth in production: state and backups, APP_KEY, signing key rotation, several DreamFactory nodes, monitoring, pruning, and the php artisan df:aauth command."
keywords: [AAuth, operations, key rotation, APP_KEY, backup, high availability, Redis, monitoring, df:aauth]
difficulty: "advanced"
---

# Operating AAuth in Production

This page is for administrators who run AAuth in production. It covers where AAuth keeps its state and what to back up, how `APP_KEY` and the signing keys work, what changes with several DreamFactory nodes, what to monitor, housekeeping, the `php artisan df:aauth` command, and changing the issuer. Installation and every setting are in [Installing and Configuring AAuth](./install.md); the admin app is described in [Managing AAuth](./admin-guide.md). For what AAuth is, see the [overview](./overview.md).

## Where state lives

Everything durable is in the DreamFactory system database, in the `aauth_*` tables. The cache holds only short-lived state.

| Table | Holds | If lost |
|---|---|---|
| `aauth_settings` | The on/off switch, stored settings, and reserved scope names (of renamed scopes and deleted roles) | AAuth is off |
| `aauth_keys` | Signing keys, private halves encrypted with `APP_KEY` | New keys are generated; every issued token stops verifying |
| `aauth_scopes` | Which roles are scopes, their names and descriptions | No scopes: agents get `403 insufficient_scope` |
| `aauth_person_servers` | Trusted person servers and their scope lists | External person servers are no longer trusted |
| `aauth_agents` | Agents seen, and blocks | Blocks are lost |
| `aauth_agent_keys` | Every agent id each agent key has presented an agent token for (at most 20 per key), so that blocks also apply to person and auth tokens, and requests with an external person server's tokens can be attributed to an agent | Rebuilt as agents present agent tokens again; until a key presents one, a block of another agent id it used doesn't reach its tokens |
| `aauth_activity` | The Activity log | History only |
| `aauth_ps_pending` | Open person and auth token requests (minutes) | Agents in the middle of an approval start over |
| `aauth_ps_tokens` | The agent each person and auth token of the built-in person server was issued for, until an hour after the token expires | Tokens issued before are refused with `401 invalid_jwt`; agents get new ones |
| `aauth_ps_grants` | **Always allow** grants | People approve again |
| `aauth_ps_subjects` | Pairwise subject identifiers mapped to DreamFactory users | Issued tokens no longer map to a person |
| `aauth_sessions` | Consent page sessions, only with `DF_AAUTH_SESSION_DRIVER=database` | People signed in on a consent page sign in again |

The cache (`DF_AAUTH_CACHE_STORE`, else DreamFactory's default store) holds the replay cache, single-use resource token markers, interaction code ownership, rate limit counters, cached discovery results, and Try it runs (including API response data, unencrypted, for 15 minutes) and tokens. Keys, scopes, blocks, grants, pending requests and the records of issued tokens never depend on it. Emptying the cache (a flush, or a restart without persistence) loses what it held once: rate limits reset, cached metadata is fetched again, a request signed within the last signature window (60 seconds) can be replayed once more, a resource token can be exchanged again until it expires (5 minutes by default), open approval requests lose their owning browser, so another browser holding the code can take one over, and Try it starts over. While the cache is unreachable, those checks and every rate limit are skipped rather than failed, so agents keep working; see [Without a cache](./security-model.md#without-a-cache).

## Backups

A normal backup of the system database covers AAuth. Keep these with it, stored as secrets:

- `APP_KEY`: without it, the signing keys in the backup cannot be decrypted (see [APP_KEY](#app_key));
- the `DF_AAUTH_*` lines of `.env`, in particular `DF_AAUTH_ISSUER`.

Restore onto a new host with the same `APP_KEY` and the same issuer, and agents carry on.

## APP_KEY

AAuth depends on Laravel's `APP_KEY`, as DreamFactory's own encrypted service settings do:

- the private signing keys in `aauth_keys` are encrypted with it;
- so are the finished person and auth tokens that wait in `aauth_ps_pending` until the agent collects them, and Try it's agent key and cached tokens;
- the pairwise subject identifiers (the `sub` of person and auth tokens) are HMACs keyed from it.

If `APP_KEY` changes, DreamFactory cannot decrypt its signing keys: turning AAuth on, issuing tokens and serving its key sets (`/aauth/jwks/*.json`) fail with server errors. People also get new subject identifiers, so other AAuth resources that trust DreamFactory as a person server see them as new people. Restore the previous `APP_KEY` to recover.

If the old key is gone for good, start AAuth's keys over:

```sql
DELETE FROM aauth_keys;          -- new signing keys are generated on next use
DELETE FROM aauth_ps_pending;    -- open requests whose finished tokens can no longer be read
DELETE FROM aauth_ps_subjects;   -- subject identifiers computed with the old key
```

Then run `php artisan cache:clear`. Scopes, person servers, agents, blocks, activity and **Always allow** grants are kept. Grants belong to DreamFactory users, not to subject identifiers, so they still apply; to make everyone approve again, also run `DELETE FROM aauth_ps_grants;`. Every issued token stops verifying, so every agent starts over and people sign in on the consent page again. Parties that cached the old key sets fetch the new ones when they meet an unknown key id.

:::danger[Back up the aauth_* tables first]
These statements cannot be undone. Take a backup of the `aauth_*` tables before you run them, and run them only when the previous `APP_KEY` cannot be restored.
:::

## Signing keys

DreamFactory has three signing keys, one per purpose:

| Purpose | Signs | Published at |
|---|---|---|
| `resource` | Resource tokens | `https://api.example.com/aauth/jwks/resource.json` |
| `person` | Person and auth tokens | `https://api.example.com/aauth/jwks/person.json` |
| `agent` | Agent tokens of the Try it agent | `https://api.example.com/aauth/jwks/agent.json` |

Each is an Ed25519 key, generated when AAuth is first switched on. `php artisan df:aauth status` lists them with their key id, state and dates, never their private halves:

| State | Meaning |
|---|---|
| `signing` | Signs new tokens. |
| `retiring` | Replaced by a newer key, still published and accepted until **Published until**. |
| `expired` | Past the overlap window; removed by the next prune. |
| `inactive` | Not used to sign or verify; removed by the next prune. |

### Rotate keys

```bash
php artisan df:aauth rotate-keys                      # all three purposes
php artisan df:aauth rotate-keys --purpose=person     # one purpose (repeat --purpose for several)
php artisan df:aauth rotate-keys --older-than=90      # only keys at least 90 days old
```

Each rotated purpose prints one line: the new key id and the retired one. Key ids are shortened here:

```text
resource  new key 9fQeWp...; 5aA9Zm... stays published until 2026-11-17 19:02 UTC
person    new key Tn4WbX...; L75eKq... stays published until 2026-11-17 19:02 UTC
agent     new key c2RxHd...; 3SR1Gx... stays published until 2026-11-17 19:02 UTC
```

With `--older-than`, a purpose whose key is younger prints `skipped (younger than 90 days)`. `--json` prints the result as JSON.

A new key signs at once. The previous key is retired: it stays published in the key set, and tokens it signed keep verifying, for `DF_AAUTH_KEY_OVERLAP` seconds (default 86400, never less than the longest configured token lifetime plus 5 minutes). Verifiers that cached the old key set meet an unknown key id on the next token and fetch the new one, as the protocol requires. After the overlap, `prune` deletes the retired key, private half included.

To rotate on a schedule, set `DF_AAUTH_KEY_ROTATION_DAYS`, for example to `90`. The scheduler then runs `df:aauth rotate-keys --older-than=90 --no-interaction` daily at 03:47, which rotates keys once they reach that age. It needs Laravel's scheduler to run every minute; see [Pruning](#pruning).

### If a key may have leaked

Rotate with `--revoke`. The previous keys are deleted at once instead of retiring, and every token they signed stops verifying at this DreamFactory. Other AAuth resources that trust this DreamFactory as a person server stop accepting those tokens when their cached copy of its key set expires.

```bash
php artisan df:aauth rotate-keys --purpose=person --revoke
```

The command asks `Revoke the previous keys now? Every token they signed stops verifying, and agents must ask again.` and does nothing unless you answer yes. In scripts, add `--no-interaction`: it skips the question and revokes. The output names the revoked keys:

```text
person    new key Tn4WbX...; revoked L75eKq...
```

Revoke the purpose whose key leaked, or all three if you are not sure. After a `person` revocation, every agent has to get a new person token, so people sign in on the consent page again; scopes covered by an **Always allow** grant are then approved without asking.

:::note[Rotation needs the third migration]
Rotation uses the `2026_11_12_000003_add_aauth_key_rotation_and_sessions` migration. Until it has run, `rotate-keys` stops with `The df-aauth key rotation migration has not run yet: php artisan migrate --force`, and `df:aauth status` warns `The key rotation migration has not run: php artisan migrate --force`.
:::

### Keys through the admin API

Sys admins can list and rotate keys over the API as well. List (the keys are under `resource`, DreamFactory's usual wrapper for lists, not the `resource` purpose):

```bash
curl -s https://api.example.com/api/v2/system/aauth/keys \
  -H "X-DreamFactory-Session-Token: $DF_SESSION_TOKEN"
```

```json
{
  "resource": [
    {"purpose": "agent", "kid": "3SR1Gx...", "state": "signing", "created_at": "2026-11-16T18:43:39Z", "retired_at": null, "published_until": null},
    {"purpose": "person", "kid": "L75eKq...", "state": "signing", "created_at": "2026-11-16T18:43:39Z", "retired_at": null, "published_until": null},
    {"purpose": "resource", "kid": "5aA9Zm...", "state": "signing", "created_at": "2026-11-16T18:43:39Z", "retired_at": null, "published_until": null}
  ],
  "overlap_seconds": 86400,
  "rotation_days": 0
}
```

Rotate:

```bash
curl -s -X POST https://api.example.com/api/v2/system/aauth/keys \
  -H "X-DreamFactory-Session-Token: $DF_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purpose": "person", "revoke": true}'
```

Both fields are optional. `purpose` is `resource`, `person`, `agent` or a list of them (default: all three); `revoke` defaults to `false`. The API does not ask for confirmation. The response has a `rotated` list (`purpose`, `kid`, `retired`, `revoked` for each) followed by the key list above. A wrong purpose gets `400 purpose must be resource, person or agent (or a list of them).`; a missing rotation migration gets `503`.

## Several DreamFactory nodes

All nodes behind one issuer must share:

- **the system database**, as DreamFactory requires anyway;
- **the same `APP_KEY` and the same `DF_AAUTH_*` settings**;
- **one cache store** for AAuth's short-lived state: `DF_AAUTH_CACHE_STORE=redis` (or `memcached`, `database`), or a shared `CACHE_STORE`, pointing at the same server on every node. The replay cache, single-use resource tokens, interaction code ownership and rate limits only work when every node sees the same counters. With a per-node store (`file`, `array`, `apc`), a replayed request sent to another node is accepted and every limit is multiplied by the number of nodes;
- **the consent pages' sessions**: `DF_AAUTH_SESSION_DRIVER=redis`, or `database` (which uses the `aauth_sessions` table), or sticky sessions on the load balancer for `/aauth/*`. This setting changes the session driver of the consent and grants pages only. With the default `file` driver, the signed-in person lives on one node, and a form post that reaches another node finds neither the signed-in person nor the form's CSRF token.

`php artisan df:aauth status` says whether the cache store and the consent sessions are shared, and warns when they are not:

```text
! The AAuth cache store (file) is local to this node. With more than one DreamFactory node set DF_AAUTH_CACHE_STORE to a shared store (redis) so replay protection and limits hold across nodes.
! Consent pages use file sessions. With more than one node and no sticky sessions set DF_AAUTH_SESSION_DRIVER=redis (or database).
```

Each node reports its own configuration, so run the check on every node.

The load balancer must preserve `Host` and the request target, like any proxy in front of the issuer; see [Put a TLS reverse proxy in front](./install.md#put-a-tls-reverse-proxy-in-front). Run NTP on every node: a node whose clock drifts by more than the signature window refuses fresh signatures with `clock_skew` or `invalid_signature`.

Enable AAuth once, through any node. That call generates the keys. If two nodes race to create a key, both keys are published and the oldest one signs, which is harmless.

## Monitoring

| Check | Healthy |
|---|---|
| `GET https://api.example.com/.well-known/aauth-resource.json` | `200` with the expected `issuer`. `404` means AAuth is off, the issuer is invalid, or the package is missing. |
| `GET /api/v2/system/aauth` (sys admin) | `"enabled": true, "issuer_ok": true`. `counts.activity_24h` shows traffic. |
| `GET /api/v2/system/aauth/status` (sys admin) | `warnings` holds nothing you have not accepted (on a single node, the cache and session warnings can stay), as the web server sees the configuration. |
| An unauthenticated `GET https://api.example.com/api/v2/...` | Carries `Link: <https://api.example.com/.well-known/aauth-resource.json>; rel="aauth-resource"`, which shows the AAuth middleware is active. |
| `php artisan migrate:status` | The six `aauth` migrations show `Ran`. |
| `php artisan df:aauth status` | No lines that start with `!` other than ones you have accepted. It exits `0` even with warnings, so scripts should use `--json` and check the `warnings` list. |

**Activity** in the admin app (or the `aauth_activity` table) shows why agents fail. Watch for rows whose result is **Error**; the detail names the cause:

| Detail | Usual cause |
|---|---|
| `clock_skew: ...`, or `invalid_signature: Signature created more than 60s ago` | Clock drift on the agent or on the server |
| `invalid_signature: Use https://api.example.com` | The agent calls another host name, or the proxy rewrites `Host` |
| `invalid_signature` on every request through one path | The proxy changes the path, the query, the body or the signature headers |
| `unknown_key: Discovery failed: ...` | The agent provider's metadata or key set is unreachable, too large, not https, or on a private address that is not admitted |
| `invalid_signature: This signature was already used.` | An agent retries a POST or PATCH without signing it again, or sends the same request twice within one second with the same token |
| `invalid_jwt: This DreamFactory has no record of issuing this token. Get a new one.` | A person or auth token whose record is missing, for example after the system database was restored from a backup taken before the token was issued, or after the record was deleted. The `aauth` command, the Node and Python clients and Try it drop the token and start over. |
| `too_many_agents: This signing key has already presented agent tokens for 20 agent ids at this DreamFactory. ...` (status `403`) | One signing key presented agent tokens for more than 20 agent ids. A real agent uses one agent id per key. The row has no agent: in `GET /api/v2/system/aauth/agents`, look for agents whose `shares_key_with` names many agent ids (see [What a block covers](./admin-guide.md#what-a-block-covers)), and block them if you don't expect this. |

The full list of errors is in the [error reference](./troubleshooting.md#error-reference).

AAuth logs its own internal failures to DreamFactory's log (by default `storage/logs/dreamfactory.log`) with messages that start with `df-aauth`. Alert on these:

| Message | Means |
|---|---|
| `df-aauth: df.access_check not found in df.api; AAuth requests are not accepted.` | This DreamFactory version's middleware layout is not supported. Signed requests get DreamFactory's normal errors. |
| `df-aauth: middleware not registered: ...` | As above, with the reason. |
| `df-aauth: agent state unavailable, signed request refused: ...` | The system database could not say whether the agent is blocked, or which agent a token was issued for, so an API request got `503 temporarily_unavailable` with `Retry-After: 30`. Check the database. |
| `df-aauth person server: agent state unavailable, request refused: ...` | The same at the person server (`/aauth/person`, `/aauth/token`, polling). |
| `df-aauth authorize: agent state unavailable, request refused: ...` | The same at the resource authorization endpoint (`/aauth/authorize`). |
| `df-aauth person server: ...` (any other) | A person server endpoint answered `500 server_error`, for example because the record of a new token could not be written (the token is then not issued). |
| `df-aauth authorize: ...` (any other) | The resource authorization endpoint answered `500`. |
| `df-aauth: role <id> not deleted, its AAuth scope name could not be released: ...` | A role delete was refused with `500`: AAuth could not reserve the role's scope name before the delete, or could not remove it from grants and person server lists while the delete ran in a transaction (`rollback=true`), which was then rolled back. Nothing changed. Delete it again once the database is healthy. |
| `df-aauth: role <id> deleted, but its AAuth scope name could not be removed from grants and person server lists: ...` | The role was deleted outside a transaction, but removing its scope name from grants and person server lists failed. DreamFactory tries once more when the request ends. When that works, it logs the notice `df-aauth: role <id> deleted; its AAuth scope name was removed from grants and person server lists when the request ended.` (level `notice`); when it does not, this line appears again. Either way the name stays reserved for no role for 61 minutes, and a role that takes it later starts without the grants and person server list entries that still show it. Revoke such grants on the **Grants** tab if you want them gone. See [When a rename or role delete fails](./admin-guide.md#when-a-rename-or-role-delete-fails). |
| `df-aauth: could not seed the session: ...` | An approved request could not get its role and was refused with `403`. |
| `df-aauth: activity not recorded: ...` | A database write failure. Requests are still served. |
| `df-aauth: DF_AAUTH_CACHE_STORE '<name>' is not a configured cache store; using the default store.` | The store name is wrong; AAuth uses the default store. |
| `df-aauth: DF_AAUTH_CA_BUNDLE '<path>' is not a readable file or directory; discovery fetches fail until it is fixed.` | Every discovery fetch fails. |
| `df-aauth: schedule not registered: ...` | Pruning and scheduled rotation do not run. |
| `df-aauth: cleanup failed: ...` | After a role or user was deleted, AAuth could not remove its rows. |

## Pruning

```bash
php artisan df:aauth prune              # removes, and prints what it removed per kind
php artisan df:aauth prune --dry-run    # counts only
```

```text
Expired pending requests     0 (dry run)
Activity rows                0 (dry run)
Stale agent keys             0 (dry run)
Expired signing keys         0 (dry run)
Expired scope reservations   0 (dry run)
Expired token records        0 (dry run)
```

`prune` removes:

- pending requests that expired more than an hour ago;
- **Activity** rows older than `DF_AAUTH_ACTIVITY_RETENTION_DAYS` (default 30);
- agent key bindings not seen for that long, except bindings to blocked agents;
- retired signing keys past the overlap window, private halves included;
- expired scope-name reservations;
- records of issued person and auth tokens whose token expired more than an hour ago.

With `--json` (also with `--dry-run`), the counts are under `removed`, with the keys `pending`, `activity`, `agent_keys`, `signing_keys`, `retired_scopes` and `issued_tokens`. It is idempotent and safe to run on every node. Each step runs even when another fails; a failed step prints a line starting with `!`, and the command then exits non-zero. Besides the schedule, pruning also runs on about one in 100 activity writes.

A retention of `0` keeps activity rows and agent keys forever. Grants stay until they are revoked, agents until they are deleted, and subject mappings indefinitely, because tokens and grants refer to them. Deleting a DreamFactory user removes that person's grants and subject mappings.

The package registers the schedule itself: `df:aauth prune` daily at 03:17 and, when `DF_AAUTH_KEY_ROTATION_DAYS` is set, `df:aauth rotate-keys` daily at 03:47, each on one server and never overlapping. `php artisan schedule:list | grep aauth` shows them. Laravel's scheduler must run every minute; DreamFactory's scheduler package, part of commercial builds, adds this line to the crontab of whichever user runs an artisan command (in the Docker image that is often root). If neither root's nor the web server user's crontab has it, add it to the web server user's crontab exactly as written, so that the scheduler package does not add a second copy:

```cron
* * * * * cd /opt/dreamfactory/ && php artisan schedule:run >> /dev/null 2>&1
```

"On one server" relies on DreamFactory's default cache store (`CACHE_STORE`) for its lock, so it needs a store shared by every node (`redis`, `memcached`, `database`). With the `file` store, each node runs the job itself. That is harmless: `prune` is idempotent; for scheduled rotation, a node that runs after another node has rotated skips the new, younger keys, and two nodes that rotate at the same moment only leave an extra retired key, which stays published for the overlap window.

## The `df:aauth` command

`php artisan df:aauth` without an action runs `status`.

| Action | Options | What it does |
|---|---|---|
| `status` | `--json` | Prints deployment facts and warnings. |
| `rotate-keys` | `--purpose=resource\|person\|agent` (repeatable), `--older-than=N`, `--revoke`, `--json` | Rotates signing keys. See [Signing keys](#signing-keys). |
| `prune` | `--dry-run`, `--json` | Housekeeping. See [Pruning](#pruning). |

Run it as the web server user, from `/opt/dreamfactory` (with Docker: `docker exec -u www-data <container> php /opt/dreamfactory/artisan df:aauth status`).

### Status output

On a node with a Redis cache and `DF_AAUTH_SESSION_DRIVER=database`, the output looks like this (key ids shortened):

```text
AAuth 0.1.0
  Enabled              yes
  Issuer               https://api.example.com
  Cache store          redis (redis, shared)
  Consent sessions     database (shared)
  Private hosts        (none)
  Private networks     (none)
  CA bundle            system trust store
  Sign-in              DreamFactory password
  Key overlap          1d, rotate by hand
  Pending (live)       0

+----------+-----------+---------+----------------------+---------+-----------------+
| Purpose  | Key id    | State   | Created              | Retired | Published until |
+----------+-----------+---------+----------------------+---------+-----------------+
| agent    | 3SR1Gx... | signing | 2026-11-16T18:43:39Z |         |                 |
| person   | L75eKq... | signing | 2026-11-16T18:43:39Z |         |                 |
| resource | 5aA9Zm... | signing | 2026-11-16T18:43:39Z |         |                 |
+----------+-----------+---------+----------------------+---------+-----------------+
```

| Line | Shows |
|---|---|
| `AAuth 0.1.0` | The package version. |
| `Enabled` | `yes` when the switch is on and the issuer is valid. |
| `Issuer` | The issuer in use. `(not set: DF_AAUTH_ISSUER)` when there is none; `[invalid]` after it when it breaks the [issuer rules](./install.md#choose-the-issuer). |
| `Cache store` | The store AAuth uses, its driver, and `shared` or `this node only`. A misspelled `DF_AAUTH_CACHE_STORE` is still shown as `shared`; see [Several nodes](./install.md#several-nodes). |
| `Consent sessions` | The session driver of the consent pages, and `shared` or `this node only`. |
| `Private hosts`, `Private networks` | The admitted entries as DreamFactory read them, or `(none)`. |
| `CA bundle` | The `DF_AAUTH_CA_BUNDLE` path, or `system trust store`. `[NOT READABLE]` when the file cannot be read. |
| `Sign-in` | The sign-in methods on the consent pages: `DreamFactory password`, `directory <name>` for each active LDAP or Active Directory service, and `single sign-on (DreamFactory login page)` when it is offered. |
| `Key overlap` | The effective overlap window (`DF_AAUTH_KEY_OVERLAP`, at least the longest token lifetime plus 5 minutes) in days, hours or seconds, then `rotate by hand` or `auto-rotate after N days`. |
| `Pending (live)` | Person and auth token requests that are open and not expired. |
| Key table | Every signing key with its purpose, key id, state and dates. Before AAuth was first switched on: `No signing keys yet (created on first use).` |

### Warnings

Every warning starts with `!`:

| Warning | Fix |
|---|---|
| `DF_AAUTH_ISSUER must be the public https origin of this DreamFactory (https://host, no port or path).` | The issuer is missing or invalid. Set `DF_AAUTH_ISSUER` as in [Choose the issuer](./install.md#choose-the-issuer). Despite the wording, an internal https name is valid and does not trigger this warning. |
| `DF_AAUTH_ALLOW_INSECURE is on: development only (http issuers, private discovery targets).` | Remove `DF_AAUTH_ALLOW_INSECURE` on any instance others can reach. |
| `The AAuth cache store (<store>) is local to this node. With more than one DreamFactory node set DF_AAUTH_CACHE_STORE to a shared store (redis) so replay protection and limits hold across nodes.` | With one node, nothing to do. With several, set a shared store. |
| `Consent pages use <driver> sessions. With more than one node and no sticky sessions set DF_AAUTH_SESSION_DRIVER=redis (or database).` | With one node or sticky sessions, nothing to do. Otherwise set `DF_AAUTH_SESSION_DRIVER`. |
| `DF_AAUTH_CA_BUNDLE is not readable: every discovery fetch fails.` | Fix the path or the file permissions for the web server user. |
| `The key rotation migration has not run: php artisan migrate --force` | Run the migrations. |
| `DF_AAUTH_SESSION_DRIVER=database needs the aauth_sessions table: php artisan migrate --force` | Run the migrations. |

### Errors and exit codes

| Message | Exit code |
|---|---|
| `The df-aauth tables are missing. Run: php artisan migrate --force` | 1 |
| `Unknown action '<action>'. Use status, rotate-keys or prune.` | 2 |
| `Unknown purpose '<purpose>' (resource, person or agent).` | 1 |
| `--older-than takes a whole number of days (1 or more).` | 1 |
| `The df-aauth key rotation migration has not run yet: php artisan migrate --force` | 1 |

`status` exits `0` whatever it reports. `prune` exits non-zero when a step failed.

### Over the admin API

The same facts are available to sys admins at `GET /api/v2/system/aauth/status`, as JSON with the keys `enabled`, `issuer`, `issuer_ok`, `cache`, `sessions`, `egress`, `sign_in`, `keys`, `pending_live` and `warnings`. It reports the configuration the web server sees, which matters in Docker, where `docker exec` sees the container's environment and PHP-FPM does not. Keys are listed and rotated at `/api/v2/system/aauth/keys` ([Keys through the admin API](#keys-through-the-admin-api)). Pruning has no API.

## Changing the issuer

The issuer is in every token DreamFactory issues, and in every grant and subject mapping its person server holds for DreamFactory's own APIs. Changing `DF_AAUTH_ISSUER`:

- invalidates every issued token: agents must discover the new issuer and start over;
- leaves the grants and subject mappings for the old issuer unused: people approve again;
- moves DreamFactory's own person server row (**This DreamFactory**) to the new issuer automatically;
- gives the Try it agent a new agent id (`aauth:playground@` followed by the new host), so it appears as a new agent;
- requires other AAuth resources that trusted DreamFactory as a person server to trust the new issuer.

Treat it as a migration and announce it to agent owners in advance. Update the proxy, the certificate and `DF_AAUTH_ISSUER` together, run `php artisan config:clear`, and check with `php artisan df:aauth status`.

## Performance

Each signed API request adds a few small writes to the system database: one activity row, the agent's request counter, the person server's last-used time for person and auth tokens and, for agent tokens, the key binding. Every signed request also reads its key's bindings to check for blocks. A request with one of DreamFactory's own person or auth tokens also reads that token's record (one primary-key lookup), and issuing such a token writes one. DreamFactory's own tokens are verified from the database without network calls. Tokens from other issuers need their metadata and key sets, which are fetched once and cached for 5 minutes (`DF_AAUTH_DISCOVERY_CACHE_SECONDS`). Limits, scripts and logging cost what they cost for any API key request.

## Upgrading and removing

To upgrade the package, see [Upgrading](./install.md#upgrading). To switch AAuth off or remove it, see [Turning AAuth off and removing it](./install.md#turning-aauth-off-and-removing-it).

## Responding to an incident

[Responding to an incident](./admin-guide.md#responding-to-an-incident) in Managing AAuth lists the admin controls: block an agent, remove a person server, revoke grants, remove a role from a person, disable a scope, or switch AAuth off. Most take effect on the next request; revoking a grant does not end auth tokens already issued, which stay valid for up to an hour. Activity rows are kept for the investigation. Two server-side cases are covered on this page:

- **A signing key may have leaked:** run `php artisan df:aauth rotate-keys --purpose=<purpose> --revoke`; see [If a key may have leaked](#if-a-key-may-have-leaked).
- **`APP_KEY` was lost or changed:** restore it, or reset AAuth's keys as described in [APP_KEY](#app_key).
