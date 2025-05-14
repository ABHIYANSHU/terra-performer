import { Request, Response } from 'express';
import { runTerraformApply } from '../services/terraformService';

/**
 * Apply terraform configuration using stored AWS credentials
 * @param req Express request object
 * @param res Express response object
 */
export const applyTerraform = async (req: Request, res: Response): Promise<void> => {
  try {
    // Immediately respond that the process has started
    res.status(202).json({
      success: true,
      message: 'Terraform apply started. Connect to WebSocket to receive real-time updates.',
      socketEvent: 'terraform-output'
    });
    
    // Execute terraform apply asynchronously
    runTerraformApply()
      .then(() => {
        console.log('Terraform apply completed successfully');
      })
      .catch((error) => {
        console.error('Error applying terraform:', error);
      });
  } catch (error: any) {
    console.error('Error initiating terraform apply:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate terraform configuration'
    });
  }
};