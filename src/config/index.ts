import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  // server: {
  //   port: process.env.PORT || 3000,
  //   nodeEnv: process.env.NODE_ENV || 'development',
  // },
  falkorDB: {
    host: process.env.FALKORDB_HOST || 'localhost',
    port: parseInt(process.env.FALKORDB_PORT || '6379'),
    username: process.env.FALKORDB_USERNAME || '',
    password: process.env.FALKORDB_PASSWORD || '',
  },
  mcp: {
    apiKey: process.env.EE_API_KEY || '',
  },
};