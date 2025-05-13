import { Request, Response } from 'express';
import { storeAwsCredentials } from '../services/keysService';

/**
 * Store AWS credentials
 * @param req Express request object
 * @param res Express response object
 */
export const storeKeys = (req: Request, res: Response): void => {
  try {
    const { accessKey, secretKey } = req.body;
    
    // Validate input
    if (!accessKey || !secretKey) {
      res.status(400).json({ 
        success: false, 
        message: 'Both accessKey and secretKey are required' 
      });
      return;
    }
    
    // Store credentials
    storeAwsCredentials(accessKey, secretKey);
    
    res.status(200).json({ 
      success: true, 
      message: 'AWS credentials stored successfully' 
    });
  } catch (error) {
    console.error('Error storing AWS credentials:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to store AWS credentials' 
    });
  }
};