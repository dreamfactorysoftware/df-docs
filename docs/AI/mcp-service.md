---
sidebar_position: 1
title: MCP Server
id: mcp-server
description: Integrate DreamFactory with AI assistants and dev tools using the Model Context Protocol (MCP) for database and file operations.
keywords: [MCP, Model Context Protocol, AI integration, Claude, ChatGPT, database tools, file storage, streaming API, JSON-RPC]
difficulty: advanced
---

# MCP Server

The MCP (Model Context Protocol) server is a powerful feature in DreamFactory that enables integration with external tools and AI assistants through a standardized protocol. This server allows you to expose your DreamFactory services as MCP-compatible endpoints, making them accessible to development tools, AI assistants, and other MCP clients. The server bridges DreamFactory's REST API with the Model Context Protocol, providing a consistent interface for interacting with your services.

## MCP Protocol Overview

The Model Context Protocol (MCP) is a standardized way for tools and services to communicate with AI assistants and development environments. DreamFactory's MCP server implements the Streamable HTTP transport, which allows for efficient bidirectional communication between clients and your services.

**Key Features:**
- **Automatic Service Discovery**: Automatically discovers and exposes all database and file storage services configured in your DreamFactory instance
- **Multiple API Support**: A single MCP server provides tools for all your connected services — no need to create separate MCP services per database or file API
- **Session Management**: Each MCP connection maintains its own session with stored credentials and tool context
- **Tool Registration**: Automatically exposes DreamFactory operations as MCP tools, prefixed per API for clarity
- **Streaming Support**: Supports Server-Sent Events (SSE) for real-time data streaming
- **Persistent Connections**: Keeps connections alive for optimal performance

## Available Tools

The MCP server automatically discovers all database and file storage services in your DreamFactory instance and registers tools for each one. All tools are **prefixed with the API name** to distinguish between services. For example, if you have a database service named `mysql` and a file service named `s3`, the tools would be `mysql_get_tables`, `s3_list_files`, etc.

### Discovery & Overview Tools

- **list_apis**: List all available APIs (database and file) accessible through this MCP server
- **`<prefix>`\_get_data_model**: Get a condensed schema overview including all tables, columns, foreign keys, and row counts — the recommended starting point for any data exploration
- **`<prefix>`\_get_api_spec**: Retrieve the OpenAPI spec with query syntax hints

### Database Exploration Tools

- **`<prefix>`\_get_tables**: Retrieve a list of all available tables in a database
- **`<prefix>`\_get_table_schema**: Get the complete schema definition for a specific table
- **`<prefix>`\_get_table_data**: Query table data with advanced filtering, pagination, and sorting options
- **`<prefix>`\_get_table_fields**: Retrieve detailed field definitions including data types and constraints
- **`<prefix>`\_get_table_relationships**: Get relationship definitions showing how tables are connected
- **`<prefix>`\_aggregate_data**: Compute SUM, COUNT, AVG, MIN, MAX aggregations in a single call

### Record Management Tools

- **`<prefix>`\_create_records**: Create one or more new records in a table
- **`<prefix>`\_update_records**: Update existing records with support for batch operations
- **`<prefix>`\_delete_records**: Delete records with filtering and batch deletion support

### Stored Procedure and Function Tools

- **`<prefix>`\_get_stored_procedures**: List all available stored procedures in a database
- **`<prefix>`\_call_stored_procedure**: Execute a stored procedure with custom parameters
- **`<prefix>`\_get_stored_functions**: List all available stored functions
- **`<prefix>`\_call_stored_function**: Execute a stored function and retrieve results

### File Storage Tools

For file storage services (e.g., local file system, S3, Azure Blob, SFTP):

- **`<prefix>`\_list_files**: List files and folders in a given path
- **`<prefix>`\_get_file_content**: Retrieve the content of a file
- **`<prefix>`\_create_folder**: Create a new folder
- **`<prefix>`\_delete_file**: Delete a file or folder

### Utility Tools

- **`<prefix>`\_get_database_resources**: Get all resources available in a database service
- **list_tools**: List all available MCP tools for the current session

## Using the MCP Server

### Initializing a Connection

To establish a connection with the MCP server, send an initialization request to your DreamFactory MCP endpoint. Replace `{service-name}` with the name of your MCP service configured in DreamFactory:

```bash
curl -i -X POST https://your-dreamfactory-host/mcp/{service-name} \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {
        "experimental": {
          "openai/visibility": {
            "enabled": true
          }
        }
      },
      "clientInfo": {
        "name": "df-mcp-client",
        "version": "1.0.0"
      }
    }
  }'
```

**Important:** The response will include an `MCP-Session-Id` header. Save this value and include it in subsequent requests to maintain your session context.

### Making Tool Calls

Once initialized, you can use any of the available MCP tools. Start by listing all available APIs, then use prefixed tools to interact with specific services. For example, to list all available APIs:

```bash
curl -X POST https://your-dreamfactory-host/mcp/{service-name} \
  -H "Content-Type: application/json" \
  -H "MCP-Session-Id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "list_apis",
      "arguments": {}
    }
  }'
```

Then use the API-prefixed tools. For example, if you have a database service named `mysql`:

```bash
curl -X POST https://your-dreamfactory-host/mcp/{service-name} \
  -H "Content-Type: application/json" \
  -H "MCP-Session-Id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "mysql_get_tables",
      "arguments": {}
    }
  }'
```

### Required Headers

Every MCP request requires only standard HTTP headers:

| **Header** | **Required** | **Description** |
| ---------- |--------------| --------------- |
| **Content-Type** | Yes          | Must be `application/json` for POST requests |
| **MCP-Session-Id** | Yes*         | Session identifier returned during initialization (*required for subsequent requests to maintain session context) |

DreamFactory automatically handles service configuration and API key management internally, so you don't need to include authentication headers in your requests.

## Use Cases

The MCP server enables several powerful use cases:

- **AI Assistant Integration**: Connect AI assistants like ChatGPT, Claude, or Cursor to all your DreamFactory databases and file storage through a single endpoint
- **Development Tools**: Integrate with IDEs and development environments that support MCP
- **Automated Workflows**: Enable automated database and file operations through MCP-compatible workflow tools
- **Data Exploration**: Provide a standardized interface for exploring and querying database structures
- **File Management**: Allow AI assistants to browse, read, and manage files across your connected storage services (local, S3, Azure Blob, SFTP, etc.)

By leveraging the MCP server, you can extend DreamFactory's functionality and create powerful integrations with AI assistants and development tools, making your services more accessible and easier to work with.
