---
sidebar_position: 11
title: Agents
id: agents
description: "Register AI agents in DreamFactory with their own identity, role-scoped API key, and skills, and route tasks to the right agent with a deterministic capability router"
keywords: [AI agents, agent identity, capability router, agent registry, RBAC, API key, skills]
difficulty: "intermediate"
---

# Agents

The **Agents** service gives every AI agent its own identity inside DreamFactory: a named record, a role that scopes what it may reach, its own API key with an optional lifetime, and a list of skills. Because an agent is a first-class record rather than a shared key, you can see which agent did what, revoke one without disturbing the others, and route work to the right agent programmatically.

Create the service from **API Generation & Connections** by adding a service of type **Agents**. It exposes three resources:

| Resource | Purpose |
| --- | --- |
| `/api/v2/agents/agents` | The agent registry — create, read, update, delete agents |
| `/api/v2/agents/requests` | The pending access-request queue |
| `/api/v2/agents/route` | Deterministic capability router (POST only) |

---

## Registering an agent

An agent record carries:

| Field | Description |
| --- | --- |
| `name` | The agent's name. Also scored by the router. |
| `description` | Free-text description. Also scored by the router. |
| `role_id` | The role that scopes what this agent may reach. |
| `owner_id` | The user who owns the agent. |
| `api_key` | The agent's own API key. |
| `key_ttl_hours` | Optional lifetime for the key, in hours. |
| `skills` | JSON array of capability keywords, for example `["invoice reconciliation", "refunds"]`. |
| `chat_service_id` | Optional AI chat service to use as this agent's persona. |
| `is_active` | Only active agents are considered by the router. |

Scope each agent with a role exactly as you would an application. See [Role-Based Access Control](/Security/role-based-access).

---

## Approving access requests

Requests queue under `/api/v2/agents/requests`. Approving or denying one is a `PATCH` that sets the status — the model applies the side effects, including the resolution stamp, key rotation on approval, and the alert:

```bash
curl -X PATCH \
  "https://{instance}/api/v2/agents/requests/{id}" \
  -H "X-DreamFactory-API-Key: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

Use `"denied"` to reject. The admin UI's one-click approve is this same call.

---

## Routing a task to an agent

`POST /api/v2/agents/route` answers "which registered agent should handle this?" without calling a model. The scoring is pure and deterministic: the same task and the same registry always produce the same answer.

```bash
curl -X POST \
  "https://{instance}/api/v2/agents/route" \
  -H "X-DreamFactory-API-Key: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{"task": "reconcile last month'\''s invoices", "top": 3}'
```

| Field | Description |
| --- | --- |
| `task` | **Required.** Free-form description of the work. |
| `top` | How many scored agents to return. Defaults to `3`, clamped to `1`–`25`. |

A match returns the winner, its chat persona service if one is configured, a human-readable reason, and the leaderboard:

```json
{
  "routed_to": { "id": 4, "name": "Finance Bot" },
  "chat_service_id": 12,
  "chat_service": "finance_chat",
  "reason": "matched: skill:invoice reconciliation",
  "scores": [
    { "id": 4, "name": "Finance Bot", "score": 4 },
    { "id": 7, "name": "Support Bot", "score": 1 }
  ]
}
```

When nothing scores above zero, `routed_to` and the chat fields are `null` and `reason` is `no registered agent matches` — the caller decides what to do next.

### How scoring works

Only active agents are considered. The task, each skill keyword, and each agent's name plus description are tokenized the same way: lowercased, split on runs of non-alphanumeric characters, tokens shorter than three characters dropped, then de-duplicated. Then:

- **+3** for each skill keyword whose tokens *all* appear in the task, so a multi-word skill like `invoice reconciliation` counts once as a single hit rather than twice as two words
- **+1** for each name or description token found in the task, skipping any token already counted as part of a matched skill, so nothing is double-counted

Results are sorted by score, ties broken by lowest id. The practical consequence: **skills drive routing**, and name and description only break ties. If an agent is being picked for the wrong work, edit its skills first.

:::note[The router returns a decision, never a credential]
The response contains an agent id, name, and chat service. It never returns `api_key` or any other credential material — the routing call is safe to expose to a client that is not itself trusted with agent keys. `GET` is not supported on this resource; routing is a computed action, so it is `POST` only.
:::

---

## Next steps

- **[Role-Based Access Control](/Security/role-based-access)**: Scope what an agent may reach
- **[AI Chat](/AI/ai-chat)**: Configure the chat service an agent uses as its persona
- **[MCP Server](/AI/mcp-server)**: Expose your APIs to agents as tools
