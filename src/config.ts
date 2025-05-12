import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  apiUrl: process.env.API_URL || 'https://labs-ai-proxy.acloud.guru/rest/openai/chatgpt-4o/v1/chat/completions',
  apiToken: process.env.API_TOKEN
};