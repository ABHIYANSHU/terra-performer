import axios from 'axios';
import { config } from '../config';

export interface ChatMessage {
  role: string;
  content: string;
}

export interface SavedTerraformFile {
  filePath: string;
  fileName: string;
}

export const forwardRequest = async (prompt: string): Promise<string> => {
  try {

    console.log('Received prompt:', JSON.stringify(prompt).replace(/[\r\n]/g, ''));

    const requestBody = {
      prompt: prompt
    };

    const response = await axios.post(
      config.apiUrl,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Received response:', JSON.stringify(response.data.response).replace(/[\r\n]/g, ''));
    
    return response.data.response as string;
  } catch (error) {
    console.error('Error forwarding request:', error);
    throw error;
  }
};