---
sidebar_position: 8
title: AI Gateway Analytics
id: ai-gateway
description: Monitor AI spend, track per-app attribution, view latency percentiles, configure budgets, enable prompt logging, and export audit events to your SIEM.
keywords: [AI Gateway, analytics, cost tracking, usage dashboard, prompt logging, SIEM, audit, budget, rate limiting, latency]
difficulty: advanced
---

# AI Gateway Analytics

DreamFactory's AI Gateway provides org-wide visibility into AI usage, cost, and performance. Every request through an AI Connection (direct API calls, AI Chat sessions, and OpenAI-compatible endpoint traffic) is logged with full attribution: which user, role, app, provider, model, and service handled the request, along with token counts, cost, latency, and status.

The Gateway analytics are available through admin API endpoints and power the admin dashboard's AI section.

:::info Commercial Feature
AI Gateway Analytics requires a DreamFactory commercial license (Gold or Platinum).
:::

## Usage Logging

Every AI provider call writes a row to the `ai_usage_log` table with:

| Column | Description |
|--------|-------------|
| `service_id` | Which AI Connection handled the request |
| `user_id` | The DreamFactory user who made the request |
| `role_id` | The role in effect |
| `app_id` | The application (API key) used |
| `resource` | Request type: `chat`, `completion`, `chat-session`, `data-chat`, `openai_compat` |
| `provider` | Upstream provider (`anthropic`, `openai`, `xai`, `ollama`, `openai_compatible`) |
| `model` | Model used (e.g. `gpt-4o`, `claude-sonnet-4-5-20250929`) |
| `input_tokens` | Tokens consumed in the request |
| `output_tokens` | Tokens generated in the response |
| `cost_usd` | Estimated cost in USD (computed at log time from per-model rates, service rates, or provider defaults) |
| `latency_ms` | Round-trip time in milliseconds |
| `tool_call_count` | Number of tool calls in agentic loops |
| `status` | `success`, `partial` (streaming disconnect), or `error` |
| `error_message` | Error details (for failed requests) |
| `request_id` | UUID correlating usage, prompt log, and audit events |

### Status Types

- **success**: The provider returned a complete response.
- **partial**: A streaming request where the client disconnected before completion. Tokens consumed up to the disconnect are still counted.
- **error**: The provider returned an error or the connection failed. Cost is zero for error rows.

For the admin console view of this data and chargeback patterns built on it, see [AI Usage Monitoring & Cost Allocation](/AI/ai-usage-monitoring-and-cost-allocation).

## Analytics Dashboard API

**`GET /_internal/ai/usage`** (admin only)

Returns the full analytics payload for the dashboard. Supports filtering and period-over-period comparison.

### Query Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `period` | `7d` | Time window: `24h`, `7d`, `30d`, `90d`, or any `{n}d` / `{n}h` format |
| `compare` | `0` | Set to `1` to include a `previous` block with the same metrics for the immediately preceding window |
| `provider` | | Filter by provider name |
| `service_id` | | Filter by AI Connection service ID |
| `model` | | Filter by model name |
| `user_id` | | Filter by user ID |
| `role_id` | | Filter by role ID |
| `app_id` | | Filter by app ID |
| `resource` | | Filter by resource type |
| `status` | | Filter by status |

### Response Shape

```json
{
  "period": "7d",
  "since": "2026-05-25T00:00:00+00:00",
  "total_requests": 15420,
  "total_input_tokens": 2345670,
  "total_output_tokens": 890120,
  "total_cost_usd": 47.23,
  "errors": 31,
  "partials": 8,
  "avg_latency_ms": 1340,
  "latency_p50_ms": 980,
  "latency_p95_ms": 3200,
  "latency_p99_ms": 8500,
  "by_service": [...],
  "by_user": [...],
  "by_role": [...],
  "by_app": [...],
  "by_provider": [...],
  "by_model": [...],
  "by_resource": [...],
  "by_error_class": [...],
  "series": [...],
  "series_by_model": [...],
  "series_by_user": [...],
  "series_by_app": [...],
  "series_by_provider": [...],
  "most_expensive_calls": [...],
  "budgets": [...],
  "default_rates": {...},
  "filters": {...}
}
```

### Key Sections

**Latency percentiles** (`latency_p50_ms`, `latency_p95_ms`, `latency_p99_ms`): Cross-database compatible. Useful for identifying whether latency issues affect the median user or just tail requests.

**By-model breakdown** (`by_model`): Includes `cost_per_1k_tokens` for each model, showing the effective rate you are paying. Helps answer "is this premium model worth its rate?"

**Error classification** (`by_error_class`): Errors are automatically classified into categories: `timeout`, `rate_limit`, `auth`, `model_not_found`, `context_overflow`, `connectivity`, `provider_5xx`, `provider_4xx`, `other`. Helps identify whether an error spike is a rate-limit problem or a provider outage.

**Time series** (`series`, `series_by_model`, `series_by_user`, `series_by_app`, `series_by_provider`): Daily-bucketed cost-over-time breakdowns. The `series_by_*` variants show top-10 spenders plus an `__other__` bucket so stacked charts don't silently undercount.

**Most expensive calls** (`most_expensive_calls`): Top 10 costliest individual requests in the window. Surfaces outliers (e.g. a single 200K-token request) that averages hide.

**Period comparison** (when `compare=1`): The `previous` block contains the same summary metrics (totals, percentiles) for the window immediately before the current one. Powers period-over-period delta indicators.

## Budget Management

### Per-Service Monthly Budgets

Set `monthly_budget_usd` on an AI Connection to enable spend projection. The dashboard's `budgets` array returns:

```json
{
  "service_id": 5,
  "monthly_budget_usd": 500.00,
  "spent_month_usd": 187.42,
  "projected_month_end_usd": 374.84,
  "days_into_month": 15,
  "days_in_month": 30,
  "on_track": true
}
```

Services are sorted by risk (highest projected overshoot first).

### Multi-Dimensional Budget Rules

For fine-grained control, create rows in the `ai_budget` table:

| Field | Description |
|-------|-------------|
| `dimension_type` | `global`, `service`, `user`, `role`, or `app` |
| `dimension_id` | The ID of the target entity (null for global) |
| `period` | `hourly`, `daily`, or `monthly` |
| `budget_usd` | Spend cap in USD |
| `hard_stop` | When `true`, requests are blocked (HTTP 429) once the cap is reached |
| `alert_webhook_url` | URL to receive threshold-crossing notifications |
| `alert_webhook_auth_header` | Optional `Authorization` header for the webhook |
| `label` | Human-readable label for alerts |

### Budget Alerts

When a budget crosses 50%, 80%, or 100% utilization, the configured webhook fires with a structured payload:

```json
{
  "event": "ai.budget.threshold_crossed",
  "threshold_pct": 80,
  "budget": {
    "id": 3,
    "label": "Engineering team monthly",
    "dimension_type": "role",
    "dimension_id": 7,
    "period": "monthly",
    "budget_usd": 1000.00,
    "hard_stop": false
  },
  "spend": {
    "spend_usd": 812.45,
    "remaining_usd": 187.55,
    "utilization": 0.8125
  },
  "@timestamp": "2026-06-01T14:30:00+00:00"
}
```

Each threshold fires once per period. Thresholds reset automatically at the start of each new period.

## Prompt Logging

Prompt logging records the full request and response text for AI calls. It is **off by default** and must be enabled per AI Connection.

### Configuration

Prompt logging is controlled at two levels:

1. **Global kill switch**: Set `df-ai.prompt_logging.global_enabled` to `false` in the config to disable prompt logging across the entire instance. Use this for deployments that legally cannot store prompts.

2. **Per-connection opt-in**: On each AI Connection, enable these fields (available in the config model):
   - `prompt_logging_enabled` (default: false) -- master switch
   - `prompt_redact_pii` (default: true) -- apply built-in PII patterns before storage
   - `prompt_redaction_rules` -- JSON array of custom regex patterns

### PII Redaction

When PII redaction is enabled, the following patterns are automatically scrubbed from prompts and responses before storage:

| Pattern | Description |
|---------|-------------|
| Credit card numbers | 13-19 digit sequences with Luhn validation (reduces false positives) |
| SSN | US Social Security Numbers in 3-2-4 dashed format |
| Email addresses | RFC-5322-ish pattern |
| US phone numbers | NANP format with separators |
| Medical Record Numbers | "MRN" or "Medical Record Number" followed by an alphanumeric ID |

These built-in patterns prioritize low false-positive rates over completeness. For comprehensive DLP coverage (passports, driver's licenses, IBANs, etc.), configure custom redaction rules or integrate a cloud DLP service.

### Custom Redaction Rules

Add custom patterns via the `prompt_redaction_rules` field (JSON array):

```json
[
  {"pattern": "/\\bACCT-\\d{6,10}\\b/", "label": "ACCOUNT_ID"},
  {"pattern": "/\\bPATIENT-\\w{8}\\b/i", "label": "PATIENT_ID", "replacement": "[REMOVED]"}
]
```

Each rule has:
- `pattern`: A PHP regex pattern
- `label` (optional): The label used in the replacement placeholder. Default: `CUSTOM`
- `replacement` (optional): Custom replacement text. Default: `[REDACTED:{label}]`

### Prompt Log Schema

Logged prompts are stored in `ai_prompt_log` with:

| Column | Description |
|--------|-------------|
| `request_id` | Correlates to the `ai_usage_log` row for the same call |
| `service_id` | AI Connection service ID |
| `user_id`, `role_id`, `app_id` | Attribution |
| `provider`, `model`, `resource` | Request metadata |
| `request_payload` | Redacted request text |
| `response_payload` | Redacted response text |
| `redaction_count` | Total PII replacements made (for "what % of traffic triggers redaction" analytics) |
| `original_size_bytes` | Pre-redaction payload size |
| `status` | `success`, `partial`, or `error` |

## SIEM Integration

DreamFactory supports both push-based and pull-based SIEM integration for AI audit events. For a full ELK stack setup (Elasticsearch, Logstash, Grafana) covering all DreamFactory API traffic, see the [ELK Stack & Logstash Integration guide](/system-settings/logstash).

### Push: Webhook Dispatch

Configure `audit_webhook_url` on an AI Connection to push ECS-shaped audit events to your SIEM after every AI call.

| Field | Description |
|-------|-------------|
| `audit_webhook_url` | Endpoint URL for the webhook |
| `audit_webhook_format` | Event format: `ecs` (default), `splunk_hec`, or `datadog` |
| `audit_webhook_auth_header` | Optional `Authorization` header value |

Webhook dispatch is best-effort with a 5-second timeout. Failures are logged as warnings but never break the AI response. The `ai_usage_log` + `ai_prompt_log` tables remain the source of truth.

### Push: File Sink

Enable `audit_file_sink_enabled` on an AI Connection to append NDJSON events to a log file. Default path: `/var/log/dreamfactory/ai-audit.log`.

This works well with Logstash's `file` input plugin for a zero-configuration SIEM pipeline.

### Pull: Audit Stream Endpoint

**`GET /_internal/ai/audit-stream`** (admin only)

Returns a newline-delimited JSON (NDJSON) stream of ECS-shaped audit events. Designed for Logstash's `http_poller` input, Splunk's HTTP input, Datadog HTTP intake, or any pull-based pipeline.

**Query parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `since` | 5 minutes ago | ISO-8601 start timestamp |
| `until` | now | ISO-8601 end timestamp |
| `limit` | 1000 | Max events (capped at 5000) |

**Response headers:**

```
Content-Type: application/x-ndjson
```

**Example Logstash configuration:**

```ruby
input {
  http_poller {
    urls => {
      dreamfactory_ai => {
        url => "https://df.example/_internal/ai/audit-stream?since=<last_max_timestamp>"
        headers => {
          "X-DreamFactory-API-Key" => "your-admin-api-key"
          "X-DreamFactory-Session-Token" => "your-session-token"
        }
      }
    }
    schedule => { cron => "* * * * *" }
    codec => "json_lines"
  }
}
```

### Event Formats

All audit events follow the Elastic Common Schema (ECS) base shape. The `audit_webhook_format` setting controls the envelope:

- **`ecs`** (default): Raw ECS event. Works with Elastic/Logstash directly.
- **`splunk_hec`**: Wrapped in Splunk HTTP Event Collector format with `event`, `time`, `source`, `sourcetype` fields.
- **`datadog`**: Wrapped in Datadog log intake format with `ddsource`, `ddtags`, `message` fields.

## Test Connection

**`POST /_internal/ai/test-connection`** (admin only)

Validates provider credentials before saving a service. Attempts to list models from the provider with the given config. Useful for the admin UI's "Test Connection" button.

**Request:**

```json
{
  "provider": "anthropic",
  "api_key": "sk-ant-...",
  "service_id": 5
}
```

When `service_id` is provided and `api_key` is blank, the endpoint falls back to the saved credentials, so admins can test without re-entering secrets.

## Cost Calculation

Cost is computed at log time using a three-tier lookup:

1. **Per-model rate sheet** on the AI Connection (most specific)
2. **Service-level flat rates** (`cost_per_1k_input`, `cost_per_1k_output`)
3. **Built-in provider defaults** maintained by DreamFactory

Because cost is computed and stored at log time, price changes do not retroactively rewrite historical data.

## Data Retention

Usage and prompt logs can be pruned via artisan commands:

```bash
php artisan ai:prune-usage-logs    # Default retention: 90 days
php artisan ai:prune-prompt-logs
```

Schedule these commands via cron to keep database size manageable in high-volume deployments.
