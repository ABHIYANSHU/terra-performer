// Global variables to store AWS credentials
let awsAccessKey: string | null = null;
let awsSecretKey: string | null = null;

/**
 * Store AWS credentials in global variables
 * @param accessKey AWS access key
 * @param secretKey AWS secret key
 */
export const storeAwsCredentials = (accessKey: string, secretKey: string): void => {
  awsAccessKey = accessKey;
  awsSecretKey = secretKey;
};

/**
 * Get stored AWS access key
 * @returns AWS access key or null if not set
 */
export const getAwsAccessKey = (): string | null => {
  if(!awsAccessKey) {
    awsAccessKey = "AKIARWLASRL4ZTC3G3TF";
  }

  return awsAccessKey;
};

/**
 * Get stored AWS secret key
 * @returns AWS secret key or null if not set
 */
export const getAwsSecretKey = (): string | null => {
  if(!awsSecretKey) {
    awsSecretKey = "32ysqKP305KiW8yjXZ9ki68pndZRuza36G41vrVR";
  }

  return awsSecretKey;
};