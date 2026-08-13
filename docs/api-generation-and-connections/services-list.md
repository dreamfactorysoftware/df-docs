---
sidebar_position: 10
title: The Services List
id: services-list
description: "Read the Services list in the DreamFactory admin console, including the Health column that scores role access and probes each service's live connection"
keywords: [services list, API health, service health, connection check, RBAC, admin console]
difficulty: "beginner"
---

# The Services List

Every generated API appears in the Services list, grouped by type under **API Generation & Connections** — Database, Scripting, Network, File, Utility, and the read-only **DreamFactory Platform APIs**.

Alongside each service's name, label, description and type, the list carries a **Health** column.

---

## The Health column

Health answers a narrow, practical question: *would a call to this service work right now?* It combines two independent signals.

**Governance** — does any active role grant a key access to this service? A service no role can reach is unreachable by any API key, however well configured it otherwise is.

**Connection** — can the service actually answer? DreamFactory probes it live: `/_schema` for database services, `/` for file storage. Service types with no defined probe are not guessed at.

| Chip | Meaning |
| --- | --- |
| **Healthy** | A role grants access *and* the connection answered |
| **Action required** | Something is wrong — open the service to see what |
| **Not checked** | Governance passed, but this API type has no automatic connection check |
| **Checking…** | The probe is in flight |

:::note[Healthy means verified, not assumed]
"Not checked" is deliberately distinct from "Healthy". A scripting, remote or authentication service has no connection DreamFactory knows how to test, so it reports that it was not checked rather than claiming health it cannot prove. Only a service whose connection actually answered reports Healthy.
:::

Selecting a flagged chip lists the failing checks, each linking to the configuration that clears it.

### What it costs

The connection probe runs for the services **on the current page** of the list, not the whole catalog — cost tracks your page size, not how many services you have. Verdicts are cached per service, so paging back and forth does not reopen connections.

The **DreamFactory Platform APIs** list has no Health column: those services are reached with an admin session rather than a role grant, and have no connection to probe, so neither signal would say anything meaningful.

---

## Health on a service's own page

Opening a service shows the same verdict expanded: one row per failing check, each with a link to the configuration that fixes it, and — for a failed connection — the error from the driver, with the status, request and raw response behind a **Details** expander.

A service with nothing to act on collapses to a single line, so the panel stays out of the way of the configuration form.

---

## Next steps

- **[Role-Based Access Control](/Security/role-based-access)**: Grant a role access to a service
- **[API Keys](./api-keys)**: Bind a key to a role
