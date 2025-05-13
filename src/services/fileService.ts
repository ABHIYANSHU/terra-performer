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
    
    const fileName = `main-${dateTime}.tf`;
    const dirPath = path.resolve(process.cwd(), 'terraform-scripts');
    const filePath = path.join(dirPath, fileName);
    
    // Ensure the directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write the code to the file
    fs.writeFileSync(filePath, code);
    
    return filePath;
  } catch (error) {
    console.error('Error saving Terraform code:', error);
    throw error;
  }
};