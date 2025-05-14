import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getAwsAccessKey, getAwsSecretKey } from './keysService';
import { emitTerraformOutput, emitTerraformStatus } from './socketService';

/**
 * Interface representing a Terraform resource
 */
export interface TerraformResource {
  type: string;
  name: string;
  file: string;
}

/**
 * Runs terraform apply command with stored AWS credentials and streams output
 * @param scriptPath Optional path to specific terraform script file
 * @returns Promise that resolves when the command completes or rejects with an error
 */
export const runTerraformApply = (scriptPath?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const accessKey = getAwsAccessKey();
    const secretKey = getAwsSecretKey();
    
    if (!accessKey || !secretKey) {
      const error = new Error('AWS credentials not found. Please set them using the /api/keys endpoint first.');
      emitTerraformStatus('error', error.message);
      return reject(error);
    }
    
    const terraformDir = path.resolve(process.cwd(), 'terraform-scripts');
    
    // Notify clients that Terraform execution is starting
    emitTerraformStatus('started', 'Terraform apply started');
    
    // Use spawn instead of exec to get real-time output
    const terraformProcess = spawn('terraform', [
      'apply',
      `-var=aws_access_key=${accessKey}`,
      `-var=aws_secret_key=${secretKey}`,
      '--auto-approve'
    ], { 
      cwd: terraformDir,
      shell: true
    });
    
    let outputData = '';
    
    // Stream stdout in real-time
    terraformProcess.stdout.on('data', (data) => {
      const output = data.toString();
      outputData += output;
      emitTerraformOutput(output);
      console.log(`Terraform stdout: ${output}`);
    });
    
    // Stream stderr in real-time
    terraformProcess.stderr.on('data', (data) => {
      const output = data.toString();
      outputData += output;
      console.log(outputData);
      emitTerraformOutput(output);
      console.warn(`Terraform stderr: ${output}`);
    });
    
    // Handle process completion
    terraformProcess.on('close', (code) => {
      if (code !== 0) {
        const errorMsg = `Terraform process exited with code ${code}`;
        emitTerraformStatus('error', errorMsg);
        reject(new Error(errorMsg));
      } else {
        emitTerraformStatus('completed', 'Terraform apply completed successfully');
        console.log('Terraform apply completed successfully');
        resolve(outputData);
      }
    });
    
    // Handle process errors
    terraformProcess.on('error', (error) => {
      emitTerraformStatus('error', error.message);
      console.error(`Terraform process error: ${error.message}`);
      reject(error);
    });
  });
};

/**
 * Gets all resource names from Terraform scripts in the terraform-scripts folder
 * @returns Array of Terraform resources with type, name, and file information
 */
export const getTerraformResourceNames = (): TerraformResource[] => {
  const terraformDir = path.join(process.cwd(), 'terraform-scripts');
  const resources: TerraformResource[] = [];
  
  try {
    // Get all .tf files from the terraform-scripts directory
    const files = fs.readdirSync(terraformDir)
      .filter(file => file.endsWith('.tf'));
    
    // Process each file
    for (const file of files) {
      const filePath = path.join(terraformDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Use regex to find resource declarations
      // Format: resource "type" "name" { ... }
      const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*{/g;
      let match;
      
      while ((match = resourceRegex.exec(content)) !== null) {
        const resourceType = match[1];
        const resourceName = match[2];
        
        resources.push({
          type: resourceType,
          name: resourceName,
          file: file
        });
      }
    }
    
    return resources;
  } catch (error) {
    console.error('Error reading Terraform files:', error);
    return [];
  }
};

/**
 * Gets a formatted string of existing resource names
 * @returns String containing resource names
 */
export const getExistingResourceNames = (): string => {
  const resources = getTerraformResourceNames();
  
  if (resources.length === 0) {
    return '';
  }
  
  // Group resources by type for better readability
  const resourcesByType: Record<string, string[]> = {};
  
  resources.forEach(resource => {
    if (!resourcesByType[resource.type]) {
      resourcesByType[resource.type] = [];
    }
    resourcesByType[resource.type].push(resource.name);
  });
  
  // Format the output
  let result = '';
  
  for (const [type, names] of Object.entries(resourcesByType)) {
    result += `${type}: ${names.join(', ')}\n`;
  }
  
  return result;
};