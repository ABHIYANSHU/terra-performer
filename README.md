# Terra-Performer

A Node.js backend application that listens for POST requests, forwards them to an AI API endpoint, and saves any Terraform code blocks in the response.

## Features

- Receives POST requests with prompt content
- Forwards requests to the specified AI API endpoint
- Extracts and saves Terraform code blocks from responses
- Clears existing Terraform files before saving new ones
- Handles authentication with API token
- Built with TypeScript for type safety

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   API_URL=https://labs-ai-proxy.acloud.guru/rest/openai/chatgpt-4o/v1/chat/completions
   API_TOKEN=your_api_token
   ```

## Usage

### Development

```
npm run dev
```

### Production

```
npm run build
npm start
```

## API Endpoints

### POST /api/message

Accepts a prompt and forwards it to the AI API. If the response contains Terraform code blocks, it clears the `terraform-scripts` directory and saves the new code blocks as files.

**Request Body:**
```json
{
  "prompt": "Your message here"
}
```

**Response:**
The response from the AI API will be returned in this format:
```json
{
  "message": {
    "role": "assistant",
    "content": "Response from AI"
  },
  "promptInput": "Your message here",
  "inputTokens": 123,
  "outputTokens": 456,
  "cost": 0.000123,
  "savedTerraformFiles": [
    {
      "filePath": "/path/to/terraform-scripts/main-2023-10-25_12-34-56.tf",
      "fileName": "main-2023-10-25_12-34-56.tf"
    }
  ]
}
```

The `savedTerraformFiles` field will only be present if Terraform code blocks were found in the response.

### GET /health

Health check endpoint to verify the service is running.

**Response:**
```json
{
  "status": "ok"
}
```

## Terraform Code Extraction

The application automatically detects and extracts Terraform code blocks from the AI response. It looks for:

- Code blocks marked with ```terraform, ```tf, or ```hcl
- Code blocks containing typical Terraform syntax (provider, resource, module, etc.)

Each extracted code block is saved as a separate file in the `terraform-scripts` directory with a filename format of `main-{date-time}.tf`. Before saving new files, the application clears all existing files in the directory.