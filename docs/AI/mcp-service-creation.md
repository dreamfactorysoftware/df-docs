---
sidebar_position: 2
title: Creating an MCP Server Service
id: mcp-service-creation
---

# Creating an MCP Server Service

The Model Context Protocol (MCP) is a standardized protocol that enables AI assistants and development tools to interact with your DreamFactory database services through a consistent interface. Despite the growing popularity of direct API integrations, MCP-based connections remain an essential part of modern development workflows, allowing AI assistants like ChatGPT, Claude, and Cursor to seamlessly query and manipulate your database resources.

But incorporating MCP functionality into your development environment can be challenging. Fortunately, you can use DreamFactory to easily create a full-featured MCP server that exposes your database services through the Model Context Protocol. This server can perform all of the standard database operations, including:

- Exploring database schemas, tables, and relationships
- Querying and filtering table data with advanced options
- Creating, updating, and deleting records
- Calling stored procedures and functions
- Managing database resources

In this tutorial we'll show you how to configure DreamFactory's MCP server service, and then walk through several usage examples.

## Generating the MCP Server and Companion Documentation

To generate an SFTP REST API, log in to your DreamFactory instance using an administrator account and select the API Generation & Connections tab. Set your API Type to Utility, and then click the purple plus button to establish a new connection:

![utility api creation](/img/api-generation-and-connections/api-types/utility/creating-mcp-server/utility-api-creation.png)

Numerous Utility methods such as AWS SES, Local Cache, Redis, and more are available. There's a lot to review in this menu, but for the moment let's stay on track and search for MCP Server Service:

![utility api selection](/img/api-generation-and-connections/api-types/utility/creating-mcp-server/mcp-service-selection.png)

You'll be prompted to supply an **API name**, **label**, and **description**. Keep in mind the name must be lowercase and alphanumeric, as it will be used as the namespace within your generated API URI structure. The label and description are used for reference purposes within the administration console so you're free to title these as you please:

![mcp service_config](/img/api-generation-and-connections/api-types/utility/creating-mcp-server/mcp-service-config.png)

Next, you'll scroll down to the **Advanced options** section. There you'll need to supply the following details. There are only 2 required fields:

| Field | Description |
|-------|-------------|
| **API Name** | Select the DreamFactory database service that you want to expose through MCP. This must be an existing database service configured in your DreamFactory instance. The dropdown will show all available database services. |
| **API Key** | The API key associated with the selected database service. This key will be used to authenticate requests made through the MCP server. |

The **API Name** field is a dropdown that lists all available database services in your DreamFactory instance. Simply select the database service you want to expose through MCP. This service must already be configured in DreamFactory before you can select it.

After saving your changes, head over to the **API Docs** tab to review the generated documentation. You'll be presented with information about the MCP endpoint by running the GET request:

![mcp service_docs](/img/api-generation-and-connections/api-types/utility/creating-mcp-server/mcp-service-docs.png)

The **mcp_endpoint** field is what you should use for your AI Agents:
![mcp service_details](/img/api-generation-and-connections/api-types/utility/creating-mcp-server/mcp-service-details.png)

## Initializing an MCP Connection

**Note:** The initialization process will be done automatically with your Agent:

For using any MCP tools, you need to initialize a connection with the MCP server. This establishes a session that maintains your configuration and tool context. To initialize, send a POST request to your MCP endpoint. Replace `{service-name}` with the API name you configured earlier:

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

**Important:** The response will include an `MCP-Session-Id` header in the response. Save this value and include it in all subsequent requests to maintain your session context. The response will look similar to this:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-03-26",
    "capabilities": {
      "tools": {
        "listChanged": true
      }
    },
    "serverInfo": {
      "name": "DreamFactory MCP (your-service-name)",
      "version": "1.0.0"
    }
  }
}
```

## Example Of Usage

First of all you should get your **mcp_endpoint** that we will use in our Agent.

### ChatGPT
To connect your MCP server with ChatGPT:

1. Make sure Developer Mode is enabled in ChatGPT.
2. Create a new application by navigating to:
   Settings -> Apps -> Advanced Settings -> Create app
![mcp-example-creation](/img/api-generation-and-connections/api-types/utility/creating-mcp-server/mcp-example-creation.png)
3. Use the generated mcp_endpoint in your Agent configuration to connect to your MCP server.
![mcp-example-app](/img/api-generation-and-connections/api-types/utility/creating-mcp-server/mcp-example-app.png)

After creating the application, you can attach it to your chat and use its tools. For example, to show the database tables:
1. Attach your newly created application to the chat.
![mcp-example-connect](/img/api-generation-and-connections/api-types/utility/creating-mcp-server/mcp-example-connect.png)
2. Use the Agent commands to query the MCP server. For example:
```
Show me tables in my database/list tables
```
![mcp-example-list](/img/api-generation-and-connections/api-types/utility/creating-mcp-server/mcp-example-list.png)

The Agent will connect to the MCP server using the mcp_endpoint and return the available database tables, allowing you to interact with your data directly from ChatGPT.