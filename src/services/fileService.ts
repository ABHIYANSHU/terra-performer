import fs from 'fs';
import path from 'path';

/**
 * Clears only .tf files in the terraform-scripts directory
 */
export const clearTerraformScriptsDirectory = (): void => {
  try {
    const dirPath = path.resolve(process.cwd(), 'terraform-scripts');
    
    // Check if directory exists
    if (fs.existsSync(dirPath)) {
      // Read all files in the directory
      const files = fs.readdirSync(dirPath);
      
      // Delete only .tf files
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        
        // Check if it's a file (not a directory) and has .tf extension
        if (fs.statSync(filePath).isFile() && path.extname(filePath) === '.tf') {
          fs.unlinkSync(filePath);
        }
      }
      
      console.log('Cleared all .tf files from terraform-scripts directory');
    } else {
      // Create the directory if it doesn't exist
      fs.mkdirSync(dirPath, { recursive: true });
      console.log('Created terraform-scripts directory');
    }
  } catch (error) {
    console.error('Error clearing terraform-scripts directory:', error);
    throw error;
  }
};

/**
 * Extracts Terraform code blocks from a string
 * @param content The string to extract Terraform code blocks from
 * @returns Array of extracted Terraform code blocks
 */
export const extractTerraformCode = (content: string): string[] => {
  if (!content || typeof content !== 'string') {
    console.warn('Invalid content provided to extractTerraformCode:', content);
    return [];
  }

  try {
    // Match code blocks that are likely Terraform code
    // This regex looks for markdown code blocks with terraform, tf, or hcl language indicators
    // or code blocks that contain typical Terraform syntax
    const terraformRegex = /```(?:terraform|tf|hcl)?\s*((?:provider\s+"|resource\s+"|module\s+"|variable\s+"|output\s+"|data\s+"|locals\s+{|terraform\s+{)[\s\S]*?)```/g;
    
    const matches: string[] = [];
    let match;
    
    while ((match = terraformRegex.exec(content)) !== null) {
      if (match[1]) {
        matches.push(match[1].trim());
      }
    }
    
    return matches;
  } catch (error) {
    console.error('Error extracting Terraform code:', error);
    return [];
  }
};

/**
 * Adds timestamp to resource names in Terraform code
 * @param code The Terraform code to modify
 * @returns The modified Terraform code with timestamped resource names
 */
export const addTimestampToResourceNames = (code: string): string => {
  try {
    // Generate timestamp in format YYYYMMDD_HHMMSS
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:]/g, '')
      .replace(/\..+/, '')
      .replace('T', '_');
    
    // First, collect all resource names and their timestamped versions
    const resourceMap: Record<string, string> = {};
    const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*{/g;
    let match;
    
    // Create a copy of the code to find all resources
    let tempCode = code;
    while ((match = resourceRegex.exec(tempCode)) !== null) {
      const resourceType = match[1];
      const resourceName = match[2];
      const timestampedName = `${resourceName}_${timestamp}`;
      resourceMap[resourceName] = timestampedName;
    }
    
    // First, replace resource declarations
    let modifiedCode = code.replace(
      /resource\s+"([^"]+)"\s+"([^"]+)"\s*{/g, 
      (match, type, name) => `resource "${type}" "${name}_${timestamp}" {`
    );
    
    // Then, replace all references to these resources
    for (const [originalName, timestampedName] of Object.entries(resourceMap)) {
      // Replace references like aws_instance.app_server.id
      const referenceRegex = new RegExp(`([^"\\w])${originalName}\\.(\\w+)`, 'g');
      modifiedCode = modifiedCode.replace(referenceRegex, `$1${timestampedName}.$2`);
      
      // Replace references in square brackets like [aws_security_group.allow_all.name]
      const bracketRegex = new RegExp(`\\[(\\s*)${originalName}(\\s*)\\.`, 'g');
      modifiedCode = modifiedCode.replace(bracketRegex, `[$1${timestampedName}$2.`);
    }
    
    return modifiedCode;
  } catch (error) {
    console.error('Error adding timestamps to resource names:', error);
    return code;
  }
};

/**
 * Saves Terraform code to a file
 * @param code The Terraform code to save
 * @returns The path to the saved file
 */
export const saveTerraformCode = (code: string): string => {
  try {
    // Create a filename with the current date and time
    const now = new Date();
    const dateTime = now.toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');
    
    // Add timestamps to resource names
    const modifiedCode = addTimestampToResourceNames(code);
    
    const fileName = `main-${dateTime}.tf`;
    const dirPath = path.resolve(process.cwd(), 'terraform-scripts');
    const filePath = path.join(dirPath, fileName);
    
    // Ensure the directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write the code to the file
    fs.writeFileSync(filePath, modifiedCode);
    
    return filePath;
  } catch (error) {
    console.error('Error saving Terraform code:', error);
    throw error;
  }
};