import { FalkorDB } from 'falkordb';
import { config } from '../config';

class FalkorDBService {
  private client: FalkorDB | null = null;

  constructor() {
    this.init();
  }

  /**
   * Returns the API key for MCP
   * @returns API key as string
   */
  private verifyApiKey(apiKey: string) {
    if (config.mcp.apiKey == apiKey) {
      return true
    } else {
      throw new Error('API KEY is not valid');
    }
  }

  private async init() {
    // if (!config.mcp.apiKey) {
    //   throw new Error('Missing API key');
    // } // Ensure API key is set before proceeding
    try {
      this.client = await FalkorDB.connect({
        socket: {
          host: config.falkorDB.host,
          port: config.falkorDB.port,
        },
        password: config.falkorDB.password,
        username: config.falkorDB.username,
      });

      // Test connection
      const connection = await this.client.connection;
      await connection.ping();
      console.log('Successfully connected to FalkorDB');
    } catch (error) {
      console.error('Failed to connect to FalkorDB:', error);
      console.error(config.falkorDB);
      // Retry connection after a delay
      setTimeout(() => this.init(), 5000);
    }
  }

  async executeQuery(graphName: string, query: string, apiKey: string, params?: Record<string, any>): Promise<any> {
    if (!this.client) {
      throw new Error('FalkorDB client not initialized');
    }
    if (this.verifyApiKey(apiKey)) {
      try {
        const graph = this.client.selectGraph(graphName);
        const result = await graph.query(query, params);
        return result;
      } catch (error) {
        const sanitizedGraphName = graphName.replace(/\n|\r/g, "");
        console.error('Error executing FalkorDB query on graph %s:', sanitizedGraphName, error);
        throw error;
      }
    } // Ensure API key is valid before proceeding
  }

  /**
   * Lists all available graphs in FalkorDB
   * @returns Array of graph names
   */
  async listGraphs(apiKey: string): Promise<string[]> {
    if (!this.client) {
      throw new Error('FalkorDB client not initialized');
    }
    this.verifyApiKey(apiKey); // This will throw if API key is invalid
    try {
      // Using the simplified list method which always returns an array
      return await this.client.list();
    } catch (error) {
      console.error('Error listing FalkorDB graphs:', error);
      throw error;
    }
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }
}

// Export a singleton instance
export const falkorDBService = new FalkorDBService();