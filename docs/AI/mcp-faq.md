---
sidebar_position: 4
title: MCP FAQ
id: mcp-faq
description: Frequently asked questions about DreamFactory's Model Context Protocol (MCP) server — what it is, what tools it provides, and how to use it.
keywords: [MCP, Model Context Protocol, FAQ, tools, AI integration, DreamFactory MCP]
---

# MCP Frequently Asked Questions

## What is the Model Context Protocol?

The Model Context Protocol (MCP) is an open standard that allows AI assistants (like Claude, ChatGPT, and Cursor) to connect to external tools and data sources through a consistent interface. Instead of each AI tool needing a custom integration, MCP provides a single protocol that any compatible client can use.

In DreamFactory, MCP means you can connect an AI assistant directly to all your databases and file storage through a single endpoint — the AI can then query tables, read files, and manipulate data using natural language.

## What is DreamFactory's MCP Server service?

DreamFactory's MCP Server service is a built-in feature that exposes your DreamFactory APIs as MCP-compatible tools. When an AI client connects, it automatically discovers all database and file storage services in your DreamFactory instance and can interact with them using the MCP protocol over Streamable HTTP (JSON-RPC).

Key facts:
- **One MCP service covers all your APIs** — no need to create one per database
- **Authentication** uses OAuth 2.0 with auto-generated Client ID and Client Secret
- **Transport** is Streamable HTTP with Server-Sent Events (SSE) for streaming
- **Created in the admin UI** under the AI tab

## What tools does the MCP server provide?

Tools are automatically generated for every connected database and file service. All tool names are prefixed with the API name (e.g., `mysql_get_tables`, `s3_list_files`).

### Discovery tools
- `list_apis` — list all available APIs accessible through this MCP server
- `list_tools` — list all available MCP tools for the current session
- `{prefix}_get_data_model` — get full schema overview (tables, columns, foreign keys, row counts)
- `{prefix}_get_api_spec` — retrieve the OpenAPI spec with query syntax hints

### Database tools
- `{prefix}_get_tables` — list all tables
- `{prefix}_get_table_schema` — get schema for a specific table
- `{prefix}_get_table_data` — query data with filtering, pagination, sorting
- `{prefix}_get_table_fields` — get field definitions including types and constraints
- `{prefix}_get_table_relationships` — get foreign key relationships
- `{prefix}_aggregate_data` — SUM, COUNT, AVG, MIN, MAX aggregations
- `{prefix}_create_records` — insert new records
- `{prefix}_update_records` — update existing records
- `{prefix}_delete_records` — delete records
- `{prefix}_get_stored_procedures` — list stored procedures
- `{prefix}_call_stored_procedure` — execute a stored procedure
- `{prefix}_get_stored_functions` — list stored functions
- `{prefix}_call_stored_function` — execute a stored function

### File storage tools
- `{prefix}_list_files` — list files and folders
- `{prefix}_get_file_content` — read a file
- `{prefix}_create_folder` — create a folder
- `{prefix}_delete_file` — delete a file or folder

## How do I create an MCP Server service?

1. Log in as admin → click the **AI** tab
2. Click the purple **+** button → select **MCP Server Service**
3. Fill in **API namespace** (lowercase alphanumeric), **label**, and **description**
4. Save — DreamFactory auto-generates OAuth Client ID and Client Secret
5. Give the Client ID and Secret to your AI client (ChatGPT, Claude, Cursor, etc.)

See [Creating an MCP Server Service](mcp-service-creation.md) for the full walkthrough.

## How does an AI client connect to the MCP server?

The client sends an initialization request to `POST /mcp/{service-name}`:

```bash
curl -i -X POST https://your-dreamfactory-host/mcp/{service-name} \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "clientInfo": {"name": "my-client", "version": "1.0.0"}
    }
  }'
```

The response includes an `MCP-Session-Id` header — include this in all subsequent requests.

## What AI clients are supported?

Any MCP-compatible client: **ChatGPT**, **Claude Desktop**, **Cursor**, or any custom client implementing the MCP protocol.

## Can I use a custom login page for MCP OAuth?

Yes. Set the **Custom Login URL** field in the MCP service's Advanced Options. See [Custom Login Page for MCP](mcp-custom-login-page.md).
