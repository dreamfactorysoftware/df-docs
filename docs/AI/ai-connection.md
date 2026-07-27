---
sidebar_position: 6
title: AI Connection
id: ai-connection
description: Connect DreamFactory to AI/LLM providers (Anthropic, OpenAI, xAI, Ollama, OpenAI-compatible) with built-in rate limiting, cost tracking, prompt logging, and fallback chains.
keywords: [AI, LLM, Anthropic, OpenAI, xAI, Ollama, AI Connection, AI Gateway, chat, completion, embeddings, streaming]
difficulty: intermediate
---

# AI Connection

The AI Connection service type lets DreamFactory act as a unified gateway to AI/LLM providers. Instead of embedding provider API keys in every application, you create one or more AI Connection services in DreamFactory, and your applications call DreamFactory's REST endpoints. DreamFactory handles authentication, rate limiting, usage logging, cost tracking, prompt auditing, and provider failover behind the scenes.

:::info Commercial Feature
AI Connection requires a DreamFactory commercial license (Gold or Platinum).
:::

## Supported Providers

| Provider | Config Value | Default Base URL | API Key Required | Notes |
|----------|-------------|------------------|-----------------|-------|
| **Anthropic (Claude)** | `anthropic` | `https://api.anthropic.com` | Yes | Supports chat, completion, streaming, tool use |
| **OpenAI (GPT)** | `openai` | `https://api.openai.com` | Yes | Supports chat, completion, embeddings, streaming, tool use |
| **xAI (Grok)** | `xai` | `https://api.x.ai` | Yes | Supports chat, completion, streaming, tool use |
| **Ollama (Local)** | `ollama` | `http://localhost:11434` | No | Self-hosted models. Supports chat, completion, embeddings, tool use (model-dependent) |
| **OpenAI-Compatible** | `openai_compatible` | *(must set manually)* | Varies | Any endpoint implementing the OpenAI API shape (vLLM, LiteLLM, Azure OpenAI, etc.) |

When you select a provider, the Base URL is auto-filled. Override it for self-hosted endpoints, regional gateways, or proxy configurations.

## Creating an AI Connection

1. In the DreamFactory admin panel, go to **Services > Create**.
2. Select **AI Connection** from the service type list.
3. Fill in the required fields:

### Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| **AI Provider** | Yes | Which LLM provider this connection talks to. Picking one auto-fills the Base URL. |
| **API Key** | Varies | Provider API key (encrypted at rest). Required for Anthropic, OpenAI, and xAI. Not required for Ollama. |
| **Base URL** | Auto | Where requests are sent. Auto-filled from the provider. Override for self-hosted or proxied endpoints. |
| **Default Model** | No | Model used when a caller does not specify one (e.g. `claude-sonnet-4-5`, `gpt-4o`, `grok-2`, `llama3.2`). |
| **Max Output Tokens** | No | Cap on response length in tokens. Each request can override. Default: 1024. |
| **Temperature** | No | Controls randomness. 0 = deterministic, 0.7 = balanced, 1.0 = creative. Default: 0.7. |
| **Timeout (seconds)** | No | Abort if the provider has not responded. Increase for local Ollama models or long completions. Default: 30. |
| **Organization ID** | No | OpenAI team-plan billing. Most providers ignore this. |
| **System Prompt** | No | Instructions injected at the top of every conversation. Cannot be removed by callers. Use for tone, topic restrictions, or persona. |
| **Rate Limit (RPM)** | No | Per-user cap on requests per minute. 0 or blank = unlimited. |
| **Allowed Models** | No | JSON array restricting which models callers can request. Empty = all. Example: `["claude-sonnet-4-5","claude-haiku-4-5"]` |
| **Allowed Roles** | No | JSON array of DreamFactory role IDs permitted to use this connection. Empty = any authenticated user. |
| **Data Access API Key** | No | When the AI runs tools (read database, list files), it acts under this API key's role. Create a least-privilege key. |
| **Extra Headers** | No | JSON object of extra HTTP headers for every request. Example: `{"anthropic-version":"2023-06-01"}` |
| **Extra Parameters** | No | JSON object merged into every request body for provider-specific options. Example: `{"top_p":0.9}` |

### Cost Tracking Fields

| Field | Description |
|-------|-------------|
| **Default cost per 1k input tokens** | Fallback USD rate for the Gateway dashboard. Per-model rates take priority. |
| **Default cost per 1k output tokens** | Fallback USD rate. Output tokens typically cost 4-5x input tokens. |
| **Per-model rate sheet** | JSON array of per-model prices for accurate multi-model cost tracking. |
| **Monthly budget (USD)** | Spend cap per calendar month. The Gateway dashboard projects whether you will exceed it. Does not block requests. |

**Per-model rate sheet example:**

```json
[
  {"model": "gpt-4o", "input_per_1k": 0.0025, "output_per_1k": 0.01},
  {"model": "gpt-4o-mini", "input_per_1k": 0.00015, "output_per_1k": 0.0006}
]
```

## Endpoints

Once an AI Connection service is created (for example, named `my_ai`), the following endpoints are available.

### Completion

**`POST /api/v2/{service-name}/completion`**

Single-turn text completion. Send a prompt, get a response.

**Request:**

```json
{
  "prompt": "Explain what DreamFactory is in one sentence.",
  "model": "claude-sonnet-4-5",
  "max_tokens": 256,
  "temperature": 0.7,
  "stream": false
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `prompt` | Yes | The text prompt. Max 100,000 characters. |
| `model` | No | Overrides the service default model. |
| `max_tokens` | No | Max response tokens. Default: 1024. |
| `temperature` | No | 0.0-2.0. Default: 0.7. |
| `stream` | No | Set `true` for Server-Sent Events streaming. |

**Response:**

```json
{
  "content": "DreamFactory is an API gateway that generates REST APIs for databases and services.",
  "provider": "anthropic",
  "model": "claude-sonnet-4-5-20250929",
  "input_tokens": 14,
  "output_tokens": 28,
  "finish_reason": "end_turn",
  "latency_ms": 1240
}
```

### Chat

**`POST /api/v2/{service-name}/chat`**

Multi-turn conversation. Send an array of messages with roles.

**Request:**

```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What databases does DreamFactory support?"}
  ],
  "model": "gpt-4o",
  "max_tokens": 512,
  "temperature": 0.7,
  "stream": false
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `messages` | Yes | Array of message objects, each with `role` ("system", "user", or "assistant") and `content`. |
| `model` | No | Overrides the service default. |
| `max_tokens` | No | Default: 1024. |
| `temperature` | No | 0.0-2.0. Default: 0.7. |
| `stream` | No | Set `true` for SSE streaming. |

**Response:**

```json
{
  "content": "DreamFactory supports MySQL, PostgreSQL, SQL Server, Oracle, MongoDB, Snowflake, and many more.",
  "provider": "openai",
  "model": "gpt-4o",
  "input_tokens": 34,
  "output_tokens": 42,
  "finish_reason": "stop",
  "latency_ms": 1850
}
```

### Streaming

Both the `/completion` and `/chat` endpoints support streaming by setting `"stream": true` in the request body. The response uses Server-Sent Events (SSE) in the OpenAI `chat.completion.chunk` format, regardless of the upstream provider. This means any OpenAI-compatible SDK can consume the stream unchanged.

**Response headers:**

```
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
```

**SSE frame format:**

```
data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"},"index":0}],"model":"claude-sonnet-4-5"}

data: [DONE]
```

Streaming requests are logged to `ai_usage_log` with accurate token counts. Partial deliveries (client disconnect before completion) are logged with `status=partial`.

### Embeddings

**`POST /api/v2/{service-name}/embeddings`**

Generate vector embeddings from text. Supported by OpenAI, Ollama, and OpenAI-compatible providers. Not all providers support this endpoint.

**Request:**

```json
{
  "input": ["DreamFactory is an API gateway.", "It supports many databases."],
  "model": "text-embedding-3-small"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `input` | Yes | A string or array of strings to embed. |
| `model` | No | Embedding model. Overrides service default. |

**Response:**

```json
{
  "data": [
    {"embedding": [0.0023, -0.0091, ...], "index": 0},
    {"embedding": [0.0041, -0.0012, ...], "index": 1}
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 12,
    "total_tokens": 12
  }
}
```

### Models

**`GET /api/v2/{service-name}/models`**

List the models available from this provider. Filtered by the connection's `allowed_models` setting if configured.

**Response:**

```json
{
  "resource": [
    {"id": "claude-sonnet-4-5-20250929", "name": "Claude Sonnet 4.5", "context_window": 200000},
    {"id": "claude-haiku-4-5-20251001", "name": "Claude Haiku 4.5", "context_window": 200000}
  ]
}
```

### Health

**`GET /api/v2/{service-name}/health`**

Check whether the AI provider is reachable and responsive.

**Response:**

```json
{
  "available": true,
  "provider": "anthropic",
  "model": "claude-sonnet-4-5",
  "model_count": 42,
  "latency_ms": 245
}
```

### Usage

**`GET /api/v2/{service-name}/usage`**

Retrieve aggregated usage statistics for this AI Connection. Supports period filtering.

**Query parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `period` | `24h` | Time window. Examples: `24h`, `7d`, `30d`, `90d`. |

**Response:**

```json
{
  "total_requests": 1547,
  "total_input_tokens": 234567,
  "total_output_tokens": 89012,
  "avg_latency_ms": 1340,
  "errors": 3,
  "period": "7d",
  "since": "2026-05-25T00:00:00+00:00",
  "by_model": {
    "gpt-4o": {"requests": 1200, "input_tokens": 180000, "output_tokens": 70000},
    "gpt-4o-mini": {"requests": 347, "input_tokens": 54567, "output_tokens": 19012}
  },
  "by_user": [
    {"user_id": 1, "requests": 800, "input_tokens": 120000}
  ]
}
```

### Data Chat

**`POST /api/v2/{service-name}/data-chat`** and **`GET /api/v2/{service-name}/data-chat`**

A stateless "chat with your data" endpoint built into every AI Connection. It runs an agentic tool-calling loop where the AI can query your DreamFactory-governed databases (get tables, get schema, query data, call stored procedures/functions) and return answers in natural language.

**GET** returns the current configuration (which databases are accessible, whether tool use is supported).

**POST** runs the agentic loop:

```json
{
  "messages": [
    {"role": "user", "content": "How many orders were placed last month?"}
  ],
  "model": "gpt-4o",
  "maxTokens": 4096,
  "temperature": 0.2
}
```

The AI uses the **Data Access API Key** configured on the service to determine which databases and tables it can access.

## OpenAI-Compatible Drop-in Endpoint

DreamFactory provides an OpenAI-compatible gateway that lets existing applications work without code changes. Point your OpenAI SDK at DreamFactory:

```python
from openai import OpenAI

client = OpenAI(
    api_key="<your-dreamfactory-api-key>",
    base_url="https://your-df-host/api/v2/_ai/v1",
)

response = client.chat.completions.create(
    model="claude-sonnet",
    messages=[{"role": "user", "content": "Hello!"}],
)
```

**Endpoints:**

| Endpoint | Description |
|----------|-------------|
| `POST /api/v2/_ai/v1/chat/completions` | Chat completions (sync + streaming) |
| `GET /api/v2/_ai/v1/models` | List available model aliases |

Requests are routed via **model aliases**. An admin creates aliases that map logical names (like `claude-sonnet`) to specific AI Connection services and physical model names. This provides a layer of indirection: you can switch the underlying provider without changing client code.

Model aliases, rate limits, prompt logging, SIEM audit, and fallback chains all apply to OpenAI-compatible requests.

## Fallback Chains

An AI Connection can be configured with fallback service IDs. When the primary provider returns a retryable error (429 rate limit, 5xx server error, or connection timeout), DreamFactory automatically tries the next provider in the chain. Non-retryable errors (401, 403, 400, 422) are not retried.

Each attempt in the chain writes its own `ai_usage_log` row, so cost and latency stay attributable per-provider. A customer sees "Anthropic 429, then OpenAI succeeded" as two separate entries, not one fudged row.

## Rate Limiting

The **Rate limit (RPM)** field on an AI Connection enforces a per-user cap on requests per minute. When a user exceeds the limit, the request returns HTTP 429. This is applied before the provider call, so no tokens are consumed.

## Budget Enforcement

Budgets can be configured at multiple dimensions (global, per-service, per-user, per-role, per-app) with configurable periods (hourly, daily, monthly). Budgets with `hard_stop` enabled block requests when the cumulative spend for the period reaches the cap (HTTP 429). Non-hard-stop budgets are observability-only and trigger webhook alerts at 50%, 80%, and 100% thresholds.

Budget alerting webhooks fire once per threshold per period and include structured payloads with spend details and utilization ratios.

For monitoring spend against these limits and building per-app chargeback reports, see [AI Usage Monitoring & Cost Allocation](/AI/ai-usage-monitoring-and-cost-allocation).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DF_MCP_HOST` | `http://127.0.0.1:8006` | Internal MCP server host for data-chat tool calls |

## Artisan Commands

| Command | Description |
|---------|-------------|
| `ai:prune-usage-logs` | Remove usage log entries older than the configured retention period (default 90 days) |
| `ai:prune-prompt-logs` | Remove prompt log entries older than the configured retention period |
