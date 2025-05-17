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
    // Log the content to a file for debugging
    const logDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logPath = path.join(logDir, `terraform-extraction-${Date.now()}.log`);
    fs.writeFileSync(logPath, `Content to extract from:\n${content}`);

    // Match code blocks that are likely Terraform code
    // This regex looks for markdown code blocks with terraform, tf, or hcl language indicators
    // or code blocks that contain typical Terraform syntax
    const terraformRegex = /```(?:terraform|tf|hcl)?\s*((?:provider\s+"|resource\s+"|module\s+"|variable\s+"|output\s+"|data\s+"|locals\s+{|terraform\s+{)[\s\S]*?)```/g;
    
    // Also try to match code that looks like Terraform even without markdown code blocks
    const fallbackRegex = /((?:resource\s+"|aws_[a-z_]+\s+"|provider\s+"|module\s+"|variable\s+"|output\s+"|data\s+")[\s\S]*?(?:^}$|\n}\n))/gm;
    
    const matches: string[] = [];
    let match;
    
    // First try with markdown code blocks
    while ((match = terraformRegex.exec(content)) !== null) {
      if (match[1]) {
        matches.push(match[1].trim());
      }
    }
    
    // If no matches found with markdown blocks, try the fallback regex
    if (matches.length === 0) {
      while ((match = fallbackRegex.exec(content)) !== null) {
        if (match[1]) {
          matches.push(match[1].trim());
        }
      }
    }
    
    // Log the extracted code
    if (matches.length > 0) {
      fs.appendFileSync(logPath, `\n\nExtracted ${matches.length} Terraform code blocks:\n`);
      matches.forEach((code, index) => {
        fs.appendFileSync(logPath, `\n--- Block ${index + 1} ---\n${code}\n`);
      });
    } else {
      fs.appendFileSync(logPath, `\n\nNo Terraform code blocks extracted.`);
    }
    
    return matches;
  } catch (error) {
    console.error('Error extracting Terraform code:', error);
    return [];
  }
};

/**
 * Adds timestamp to resource and output names in Terraform code and ensures VPC and subnet references use data sources
 * @param code The Terraform code to modify
 * @returns The modified Terraform code with timestamped resource names and proper VPC/subnet references
 */
export const addTimestampToResourceNames = (code: string): string => {
  try {
    // Generate timestamp in format YYYYMMDDHHMMSS (no underscores for resource names)
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:T]/g, '')
      .replace(/\..+/, '');
    
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
    
    // Add timestamps to output names
    modifiedCode = modifiedCode.replace(
      /output\s+"([^"]+)"\s*{/g,
      (match, name) => `output "${name}_${timestamp}" {`
    );
    
    // Add timestamps to resource name attributes with length limit check and alphanumeric validation
    modifiedCode = modifiedCode.replace(
      /name\s*=\s*"([^"]+)"/g,
      (match, name) => {
        // Skip if name already contains a timestamp or is a variable reference
        if (name.includes("${") || name.includes(timestamp)) {
          return match;
        }
        
        // Create a shortened timestamp (last 8 chars) to avoid exceeding AWS name limits
        // Replace underscores with hyphens to ensure alphanumeric+hyphen compliance
        const shortTimestamp = timestamp.slice(-8).replace(/_/g, '-');
        
        // Ensure the final name doesn't exceed 32 characters (AWS limit for many resources)
        const maxBaseLength = 23; // 32 - 1 (hyphen) - 8 (short timestamp)
        const baseName = name.length > maxBaseLength ? name.slice(0, maxBaseLength) : name;
        
        return `name = "${baseName}-${shortTimestamp}"`;
      }
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
    
    // Replace any hardcoded VPC IDs with data.aws_vpc.default.id
    modifiedCode = modifiedCode.replace(
      /vpc_id\s*=\s*(?:"[^"]*"|'[^']*'|<[^>]*>|[^"\s,{}]+)/g,
      'vpc_id = data.aws_vpc.default.id'
    );
    
    // Replace any subnet references with data.aws_subnets.default.ids
    modifiedCode = modifiedCode.replace(
      /subnets\s*=\s*(?:\[[^\]]*\]|var\.[a-zA-Z0-9_]+|"[^"]*"|'[^']*'|<[^>]*>)/g,
      'subnets = data.aws_subnets.default.ids'
    );
    
    // Also handle singular subnet_id references
    modifiedCode = modifiedCode.replace(
      /subnet_id\s*=\s*(?:"[^"]*"|'[^']*'|<[^>]*>|[^"\s,{}]+)/g,
      'subnet_id = tolist(data.aws_subnets.default.ids)[0]'
    );
    
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