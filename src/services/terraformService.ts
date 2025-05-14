import { spawn } from 'child_process';
import path from 'path';
import { getAwsAccessKey, getAwsSecretKey } from './keysService';
import { emitTerraformOutput, emitTerraformStatus } from './socketService';

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