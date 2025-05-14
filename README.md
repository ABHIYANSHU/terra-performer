# Terra Performer

A Node.js application that executes Terraform scripts with real-time output streaming.

## Features

- Forward requests to an AI API
- Extract and save Terraform code from API responses
- Execute Terraform scripts with AWS credentials
- Stream Terraform execution output in real-time via WebSockets

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   API_URL=your_api_url
   API_TOKEN=your_api_token
   ```
4. Build the application:
   ```
   npm run build
   ```
5. Start the server:
   ```
   npm start
   ```

## Usage

### Setting AWS Credentials

Before executing Terraform scripts, you need to set your AWS credentials:

```
POST /api/keys
Content-Type: application/json

{
  "accessKey": "your_aws_access_key",
  "secretKey": "your_aws_secret_key"
}
```

### Executing Terraform Scripts

To execute a Terraform script and receive real-time output:

1. Connect to the WebSocket server to receive real-time updates
2. Send a POST request to execute the Terraform script:

```
POST /api/terraform/apply
```

3. The server will respond immediately with a 202 Accepted status
4. Real-time output will be streamed via WebSocket events:
   - `terraform-output`: Contains the console output from Terraform
   - `terraform-status`: Contains status updates (started, completed, error)

### Example Client

An example client is available at:

```
http://localhost:3000/terraform-client
```

This client demonstrates how to connect to the WebSocket server and display real-time Terraform execution output.

## API Endpoints

- `POST /api/message`: Forward a prompt to the AI API
- `POST /api/keys`: Set AWS credentials
- `POST /api/terraform/apply`: Execute Terraform scripts

## WebSocket Events

- `terraform-output`: Emitted when there's new output from the Terraform execution
- `terraform-status`: Emitted when the Terraform execution status changes (started, completed, error)