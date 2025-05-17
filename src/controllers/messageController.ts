import { Request, Response } from 'express';
import { forwardRequest, SavedTerraformFile } from '../services/apiService';
import { clearTerraformScriptsDirectory, extractTerraformCode, saveTerraformCode } from '../services/fileService';
import path from 'path';

export const processMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const result: string = await forwardRequest(prompt);

    const apiResponse = {
      message: result,
      savedTerraformFiles: [] as SavedTerraformFile[]
    }
  
    // Check if the response contains Terraform code
    if (apiResponse && apiResponse.message) {
      // Extract Terraform code blocks from the response
      const terraformCodeBlocks = extractTerraformCode(apiResponse.message);
      
      console.log(`Found ${terraformCodeBlocks.length} Terraform code blocks in the response`);
      
      // If Terraform code blocks are found, save them to files
      if (terraformCodeBlocks.length > 0) {
        const savedFiles: SavedTerraformFile[] = terraformCodeBlocks.map(code => {
          try {
            const filePath = saveTerraformCode(code);
            const fileName = path.basename(filePath);
            console.log(`Saved Terraform code to ${filePath}`);
            return {
              filePath,
              fileName
            };
          } catch (err) {
            console.error('Error saving Terraform code:', err);
            return null;
          }
        }).filter(file => file !== null) as SavedTerraformFile[];
        
        // Add information about saved files to the response
        apiResponse.savedTerraformFiles = savedFiles;
        
        // Include information about saved files in the response to the client
        const fileInfo = savedFiles.map(file => file.fileName).join(', ');
        const responseWithFileInfo = result + 
          `\n\n---\n*Terraform code has been saved to: ${fileInfo}*`;
        
        res.status(200).json({ 
          message: responseWithFileInfo.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
          savedFiles: savedFiles
        });
        return;
      }
    }
    
    res.status(200).json({ message: result.replace(/</g, "&lt;").replace(/>/g, "&gt;") });
  } catch (error: any) {
    console.error('Error processing message:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message 
    });
  }
};