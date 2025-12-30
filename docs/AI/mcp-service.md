---
sidebar_position: 1
title: MCP Server
id: mcp-server
---

# MCP Server

The MCP (Model Context Protocol) server is a powerful feature in DreamFactory that enables integration with external tools and AI assistants through a standardized protocol. This server allows you to expose your DreamFactory database services as MCP-compatible endpoints, making them accessible to development tools, AI assistants, and other MCP clients. The server bridges DreamFactory's REST API with the Model Context Protocol, providing a consistent interface for interacting with your database services.

## MCP Protocol Overview

The Model Context Protocol (MCP) is a standardized way for tools and services to communicate with AI assistants and development environments. DreamFactory's MCP server implements the Streamable HTTP transport, which allows for efficient bidirectional communication between clients and your database services.

**Key Features:**
- **Session Management**: Each MCP connection maintains its own session with stored credentials and tool context
- **Tool Registration**: Automatically exposes DreamFactory database operations as MCP tools
- **Streaming Support**: Supports Server-Sent Events (SSE) for real-time data streaming
- **Persistent Connections**: Keeps connections alive for optimal performance

## Available Tools

The MCP server provides a comprehensive set of tools for interacting with DreamFactory database services:

### Database Exploration Tools

- **get_tables**: Retrieve a list of all available tables in your database
- **get_table_schema**: Get the complete schema definition for a specific table
- **get_table_data**: Query table data with advanced filtering, pagination, and sorting options
- **get_table_fields**: Retrieve detailed field definitions including data types and constraints
- **get_table_relationships**: Get relationship definitions showing how tables are connected

### Record Management Tools

- **create_records**: Create one or more new records in a table
- **update_records**: Update existing records with support for batch operations
- **delete_records**: Delete records with filtering and batch deletion support

### Stored Procedure and Function Tools

- **get_stored_procedures**: List all available stored procedures in your database
- **call_stored_procedure**: Execute a stored procedure with custom parameters
- **get_stored_functions**: List all available stored functions
- **call_stored_function**: Execute a stored function and retrieve results

### Utility Tools

- **get_database_resources**: Get all resources available in the database service
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

Once initialized, you can use any of the available MCP tools. For example, to list all tables:

```bash
curl -X POST https://your-dreamfactory-host/mcp/{service-name} \
  -H "Content-Type: application/json" \
  -H "MCP-Session-Id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_tables",
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

- **AI Assistant Integration**: Connect AI assistants like ChatGPT, Claude, or Cursor to your DreamFactory database for natural language queries
- **Development Tools**: Integrate with IDEs and development environments that support MCP
- **Automated Workflows**: Enable automated database operations through MCP-compatible workflow tools
- **Data Exploration**: Provide a standardized interface for exploring and querying database structures

By leveraging the MCP server, you can extend DreamFactory's functionality and create powerful integrations with AI assistants and development tools, making your database services more accessible and easier to work with.
