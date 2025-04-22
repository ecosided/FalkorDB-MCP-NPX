import { falkorDBService } from './services/falkordb.service';
import {
  MCPResponse,
  MCPProviderMetadata
} from './models/mcp.types';
import { z } from "zod";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Create an MCP server
const server = new McpServer({
  name: "EE-GRAPH-MCP",
  version: "1.0.0",
  description: "Evolution Engineering Graph MCP Server",
});

// Add a tools
server.tool("get-metadata", {}, async (args, extra) => {
  const metadata: MCPProviderMetadata = {
    provider: 'FalkorDB MCP Server',
    version: '1.0.0',
    capabilities: [
      'graph.query',
      'graph.list',
      'node.properties',
      'relationship.properties'
    ],
    graphTypes: ['property', 'directed'],
    queryLanguages: ['cypher'],
  };
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(metadata),
      },
    ],
  };
});

server.tool("list-graphs", {}, async (args, extra) => {
  const startTime = Date.now();
  const graphNames = await falkorDBService.listGraphs('falkordb_mcp_server_key_2024');
  const queryTime = Date.now() - startTime;
  // remove schemas
  const formattedGraphNames = graphNames.filter(name => !name.includes('schema')).map(name => ({ name }));

  // Format the result according to MCP standards
  const formattedResult: MCPResponse = {
    data: formattedGraphNames,
    metadata: {
      timestamp: new Date().toISOString(),
      queryTime,
      provider: 'FalkorDB MCP Server',
      source: 'falkordb'
    }
  };
  console.log("Graph Names: " + JSON.stringify(formattedGraphNames));

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(formattedResult),
      },
    ],
  };
});

server.tool("query-graph", { query: z.string(), graphName: z.string() }, async (args, extra) => {
  if (!args.graphName) {
    throw new Error('Missing graphName parameter');
  }
  console.log("Graph Name: " + args.graphName);
  try {
    const startTime = Date.now();

    // Execute the query using FalkorDB service
    const result = await falkorDBService.executeQuery(
      args.graphName,
      args.query,
      'falkordb_mcp_server_key_2024'
    );
    const queryTime = Date.now() - startTime;

    // Format the result according to MCP standards
    const formattedResult: MCPResponse = {
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        queryTime,
        provider: 'FalkorDB MCP Server',
        source: 'falkordb'
      }
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(formattedResult),
        },
      ],
      _meta: {
        timestamp: new Date().toISOString(),
        queryTime
      }
    };
  } catch (error: any) {
    console.error('Error processing MCP context request:', error);
    return {
      content: [
        {
          type: "text",
          text: error.message,
        },
      ],
      _meta: {
        timestamp: new Date().toISOString()
      },
      isError: true
    };
  }
});



// Start receiving messages on stdin and sending messages on stdout
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("EE MCP Server running on stdio");
}


process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  // Close database connections
  await falkorDBService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  // Close database connections
  await falkorDBService.close();
  process.exit(0);
});

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

