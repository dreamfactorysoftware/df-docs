---
sidebar_position: 7
title: AI Chat
id: ai-chat
description: Chat with your DreamFactory-governed data using AI and MCP tools. The AI queries databases, calls stored procedures, and accesses MCP services on your behalf.
keywords: [AI Chat, chat with data, agentic AI, tool calling, MCP, database query, natural language query, session management]
difficulty: intermediate
---

# AI Chat

AI Chat lets users have natural-language conversations with their DreamFactory-governed data. Behind the scenes, an AI model runs an agentic tool-calling loop: it reads table schemas, queries data, calls stored procedures, and accesses MCP services, then synthesizes the results into a human-readable answer. All data access is governed by DreamFactory's standard role-based access control.

:::info Commercial Feature
AI Chat requires a DreamFactory commercial license (Gold or Platinum).
:::

## How It Works

1. An admin creates an **AI Chat** service and links it to an **AI Connection** (the LLM provider) and a **DreamFactory role** (the data access scope).
2. A user creates a **chat session** via the API.
3. The user sends messages to the session. For each message, DreamFactory:
   - Passes the conversation history plus available tool definitions to the AI model.
   - If the AI wants to query data, it issues tool calls (get tables, get schema, query data, etc.). DreamFactory executes each tool call under the configured role's permissions and feeds the results back to the AI.
   - This loop continues until the AI produces a final text response or hits the tool-call limit.
4. The response (with token counts and tool-call metadata) is returned to the user.

### Tool Surface

The AI Chat service automatically discovers which tools to expose based on the role's service access grants:

- **Database services** (SQL, MongoDB, Snowflake, etc.): the AI gets `get_tables`, `get_table_schema`, `get_table_data`, `get_table_fields`, and `get_table_relationships` tools for each accessible database service.
- **MCP services**: the AI discovers available MCP tools at runtime via JSON-RPC `tools/list` and can invoke them during the conversation.
- **Excluded services**: AI Connection, AI Chat, System, User, Swagger, and API Docs services are never exposed to the AI.

Tool names are prefixed with the service name so the AI can work across multiple databases in a single conversation. For example, a database service named `hr_db` produces tools like `hr_db__get_tables`, `hr_db__get_table_data`, etc.

## Creating an AI Chat Service

1. In the DreamFactory admin panel, go to **Services > Create**.
2. Select **AI Chat** from the service type list.
3. Configure the required fields:

### Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| **AI Connection** | Yes | The AI Connection service (Anthropic, OpenAI, etc.) that powers this chat. The connection's system prompt, allowed models, and rate limits all still apply. |
| **AI Role (data access)** | Yes | The DreamFactory role the AI operates under for tool calls. Use a least-privilege role scoped to the data you want the AI to read. This is the only access bottleneck for tool calls. |
| **Default data services** | No | JSON array of service names the AI can access. Acts as a whitelist on top of the role's permissions (the AI sees the intersection). Leave blank to expose every service the role can access. Example: `["dellstore_db","hr_db"]` |
| **Default system prompt** | No | Instructions injected at the top of every chat session. Sets the assistant's persona, restricts topics, or describes the data it should query. |
| **Max tool calls per turn** | No | Hard cap on tool calls in a single user turn before the AI must respond. Default: 25. Increase for complex multi-step workflows. |
| **Max messages per session** | No | Hard cap on session length. Protects against runaway context costs. Default: 200. |

### Security Model

The AI role must appear in the linked AI Connection's **Allowed Roles** list. This is validated at session creation time. The actual data access enforcement happens at the wire level on every tool call: the orchestrator sends each request with the AI agent's JWT and the role-bound API key, and DreamFactory's standard RBAC pipeline gates the request server-side.

This means:

- Adding a database service to the role's access list makes it available to the AI.
- Removing it removes it. No parallel configuration is needed.
- If the role loses access between session creation and a tool call, the call returns a 403 which is surfaced to the AI as a tool error.

## API Endpoints

Assuming the AI Chat service is named `my_chat`:

### Create a Session

**`POST /api/v2/{service-name}/session`**

Creates a new chat session.

**Request:**

```json
{
  "data_services": ["dellstore_db", "hr_db"],
  "allowed_resources": {
    "dellstore_db": ["customers", "orders"]
  },
  "title": "Q4 Sales Analysis",
  "system_prompt": "You are a data analyst. Always show your SQL reasoning."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `data_services` | No | Override: limit the AI to these services for this session. Empty = use everything the role allows. |
| `allowed_resources` | No | Override: per-service table restrictions. |
| `title` | No | Session title. Auto-set to the first message if omitted. |
| `system_prompt` | No | Override the service's default system prompt for this session. |

**Response:**

```json
{
  "id": 42,
  "service_id": 5,
  "user_id": 1,
  "data_services": ["dellstore_db", "hr_db"],
  "title": "Q4 Sales Analysis",
  "status": "active",
  "total_input_tokens": 0,
  "total_output_tokens": 0,
  "tool_call_count": 0,
  "created_at": "2026-06-01T10:00:00.000000Z",
  "updated_at": "2026-06-01T10:00:00.000000Z"
}
```

### Send a Message

**`POST /api/v2/{service-name}/session/{session_id}`**

Send a user message and receive the AI's response.

**Request:**

```json
{
  "message": "What are the top 10 customers by total order value?"
}
```

**Response:**

```json
{
  "content": "Here are the top 10 customers by total order value:\n\n| Customer | Total Orders |\n|...",
  "input_tokens": 2450,
  "output_tokens": 380,
  "tool_calls_made": 3,
  "finish_reason": "stop"
}
```

The `tool_calls_made` field tells you how many database queries or MCP tool calls the AI executed to produce this answer.

### List Sessions

**`GET /api/v2/{service-name}/session`**

Returns all sessions for the current user. Admins see all sessions.

**Query parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `status` | `active` | Filter by status: `active`, `archived`, or `all`. |

### Get Session Detail

**`GET /api/v2/{service-name}/session/{session_id}`**

Returns the session with its message history.

**Query parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `message_limit` | 50 | Max messages to return (most recent first, reversed to chronological order). Capped at 500. |

The response includes a `messages` array where each message has:

| Field | Description |
|-------|-------------|
| `role` | `user`, `assistant`, `tool`, or `system` |
| `content` | Message text or tool result |
| `tool_calls` | Array of tool calls (for assistant messages that triggered tools) |
| `tool_name` | Name of the tool called (for tool-result messages) |
| `is_error` | Whether this tool result was an error |
| `input_tokens` | Tokens consumed by this turn |
| `output_tokens` | Tokens generated by this turn |
| `latency_ms` | Response time for this turn |

### Delete a Session

**`DELETE /api/v2/{service-name}/session/{session_id}`**

Deletes the session and all its messages. Non-admins can only delete their own sessions.

## Suggested follow-ups

When an assistant reply ends with a fenced block tagged `suggestions`, the chat UI turns each line of that block into a clickable follow-up chip and hides the block itself from the rendered message. Clicking a chip sends it as the next message.

Only a **closed fence at the very end** of the message is treated this way — a `suggestions` block in the middle of a reply is rendered as ordinary code, so a model explaining the convention does not accidentally produce chips.

Parsing is deliberately conservative: at most **four** chips are shown, a line longer than 120 characters is dropped rather than truncated, and a stray leading bullet or numbering (`-`, `*`, `•`, `1.`) is tolerated and stripped.

To offer follow-ups, have your system prompt end replies with:

````text
```suggestions
Show me last quarter instead
Break this down by region
```
````

The feature needs no configuration; it activates whenever a reply carries the fence.

## AI Chat vs. Data Chat

DreamFactory provides two ways to chat with your data:

| Feature | AI Chat (df-ai-chat) | Data Chat (df-ai, built-in) |
|---------|---------------------|---------------------------|
| **Service type** | Separate `ai_chat` service | Resource on `ai_connection` service (`/data-chat`) |
| **Sessions** | Persistent sessions with message history | Stateless (caller manages conversation) |
| **MCP tools** | Yes. Discovers and invokes MCP service tools | No |
| **Access control** | Dedicated AI role. Role-derived tool surface. | App-based (Data Access API Key) |
| **Tool-call tracking** | Per-session counters (total_input_tokens, tool_call_count) | Returned inline per request |
| **Usage logging** | Writes to `ai_usage_log` with `resource=chat-session` | Writes to `ai_usage_log` with `resource=data-chat` |

Use **AI Chat** when you need persistent sessions, MCP integration, or fine-grained role-based scoping. Use **Data Chat** for quick stateless queries where the caller manages conversation state.

## Usage Logging and Audit

Every AI provider call from the orchestrator is logged to `ai_usage_log` with `resource=chat-session`, distinct from direct REST gateway calls (`resource=chat`). Both contribute to the same AI Connection's cost attribution and monthly budget calculations.

Prompt logging and SIEM dispatch also apply to AI Chat sessions when configured on the underlying AI Connection. See [AI Gateway Analytics](ai-gateway.md) for details, and [AI Usage Monitoring & Cost Allocation](/AI/ai-usage-monitoring-and-cost-allocation) for the console analytics view and chargeback patterns.

## Configuration Limits

| Setting | Default | Config Key |
|---------|---------|------------|
| Max tool calls per message | 25 | `ai-chat.max_tool_calls_per_message` |
| Max messages per session | 200 | `ai-chat.max_messages_per_session` |
| Tool result max length | 50,000 chars | `ai-chat.tool_result_max_length` |
| Message limit max (API) | 500 | `ai-chat.message_limit_max` |

When a tool result exceeds the max length, it is truncated with a `[TRUNCATED]` marker instructing the AI to use filters or limits to narrow the query.
