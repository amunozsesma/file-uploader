# File Uploader

A reusable file uploader hook with AWS S3 integration for Next.js applications.

## Features

- 📁 Generic file uploader hook with progress tracking
- 🔄 S3 pre-signed URL upload flow
- 📥 Download API for retrieving files
- ⚙️ Fully configurable routes and hooks
- 🔌 Easy to integrate in any Next.js project
- 📦 TypeScript support with exported types

## Installation

You can install the package directly from npm:

```bash
# Using npm
npm install file-uploader

# Using yarn
yarn add file-uploader

# Using pnpm
pnpm add file-uploader
```

Or you can install from your GitLab repository:

```bash
# Using npm
npm install git+https://gitlab.com/your-username/file-uploader.git

# Using yarn
yarn add git+https://gitlab.com/your-username/file-uploader.git

# Using pnpm
pnpm add git+https://gitlab.com/your-username/file-uploader.git
```

## Environment Variables

Create a `.env` file in your project root with the following variables:

```
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET=your_bucket_name

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Usage

### useFileUploader Hook

```tsx
import { useState } from 'react';
import { useFileUploader } from 'file-uploader';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { isUploading, uploadFile, reset } = useFileUploader({
    file,
    allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    onUploadComplete: (key) => {
      console.log('Uploaded:', key);
      setUploadedKey(key);
    },
    onUploadError: (error) => {
      console.error('Error:', error);
      setError(error.message);
    },
    onUploadProgress: (progress) => {
      console.log('Progress:', progress);
      setUploadProgress(progress);
    },
    config: {
      apiBaseUrl: 'https://your-api.com',
      endpoints: {
        uploadUrl: '/api/custom/upload'
      }
    }
  });
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      setFile(selectedFile);
      reset(); // Reset the upload state
      
      // Optionally start upload immediately
      uploadFile(selectedFile).catch((err) => {
        // Error is handled by onUploadError
      });
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        onChange={handleFileChange} 
        disabled={isUploading}
      />
      
      {uploadProgress > 0 && (
        <div>Upload progress: {uploadProgress}%</div>
      )}
      
      {error && (
        <div>Error: {error}</div>
      )}
      
      {uploadedKey && (
        <div>File uploaded successfully! Key: {uploadedKey}</div>
      )}
    </div>
  );
}

// Or allow any file type with the wildcard option
function AnyFileUploader() {
  const [file, setFile] = useState<File | null>(null);
  
  const { isUploading, uploadFile } = useFileUploader({
    file,
    allowedFileTypes: '*', // Accept any file type
    maxFileSize: 10 * 1024 * 1024,
    onUploadComplete: (key) => console.log('Uploaded:', key)
  });
  
  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => {
          const selectedFile = e.target.files?.[0] || null;
          if (selectedFile) {
            setFile(selectedFile);
            uploadFile(selectedFile);
          }
        }} 
        disabled={isUploading}
      />
    </div>
  );
}
```

### API Routes

#### Upload Route

In your Next.js API route:

```ts
// app/api/upload/route.ts
import { createUploadHandler } from 'file-uploader';

// Custom configuration with specific file types
export const POST = createUploadHandler({
  allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  maxFileSize: 10 * 1024 * 1024 // 10MB
});

// Or allow any file type
export const POST = createUploadHandler({
  allowedFileTypes: '*',
  maxFileSize: 10 * 1024 * 1024 // 10MB
});
```

#### Download Route

In your Next.js API route:

```ts
// app/api/download/route.ts
import { createDownloadHandler } from 'file-uploader';

// With optional hook
export const POST = createDownloadHandler({
  onDownload: async (s3Key) => {
    // Log download or update analytics
    console.log(`File downloaded: ${s3Key}`);
  }
});
```

### S3 Utilities

```ts
import { createPresignedUploadUrl, getSignedUrl, getFileByS3Key } from 'file-uploader';

// Generate a pre-signed upload URL
const { url, fields, key } = await createPresignedUploadUrl({
  fileName: 'document.pdf',
  fileType: 'application/pdf'
});

// Get a signed URL for an existing file
const signedUrl = await getSignedUrl('uploads/123/document.pdf');

// Retrieve a file from S3
const { buffer, size, contentType } = await getFileByS3Key('uploads/123/document.pdf');
```

## Configuration

### useFileUploader Props

| Prop | Type | Description |
|------|------|-------------|
| `file` | `File \| null` | The file to upload (pass null initially) |
| `allowedFileTypes` | `string[]` or `'*'` | List of allowed MIME types or `'*'` for any type (required) |
| `maxFileSize` | `number` | Maximum file size in bytes (required) |
| `onUploadComplete` | `(key: string) => void` | Callback when upload completes |
| `onUploadError` | `(error: Error) => void` | Callback when upload fails |
| `onUploadProgress` | `(progress: number) => void` | Callback for upload progress |
| `config` | `FileUploaderConfig` | Additional configuration options |

### useFileUploader Return Value

```typescript
interface UseFileUploaderResult {
  isUploading: boolean;       // Whether a file is currently being uploaded
  uploadFile: (file: File) => Promise<void>;  // Function to manually trigger upload
  reset: () => void;          // Function to reset the upload state
}
```

### FileUploaderConfig

```typescript
interface FileUploaderConfig {
  apiBaseUrl?: string;
  endpoints?: {
    uploadUrl?: string;
  };
}
```

## Development

### Setup

1. **Prerequisites**
   - Node.js (v18 or later)
   - npm or yarn
   - AWS Account

2. **Project Setup**
   ```bash
   # Clone the repository
   git clone https://github.com/your-username/file-uploader.git
   cd file-uploader

   # Install dependencies
   npm install
   ```

3. **AWS Configuration**
   1. Create an S3 Bucket:
      - Go to S3 in AWS Console
      - Click "Create bucket"
      - Enter a unique bucket name (e.g., "my-app-files")
      - Choose your region (use "us-east-1" as in .env)
      - Enable versioning and default encryption
   
   2. Create IAM User:
      - Go to IAM in AWS Console
      - Create a new user with programmatic access
      - Attach a policy with S3 permissions:
      ```json
      {
          "Version": "2012-10-17",
          "Statement": [
              {
                  "Effect": "Allow",
                  "Action": [
                      "s3:PutObject",
                      "s3:GetObject",
                      "s3:DeleteObject",
                      "s3:ListBucket"
                  ],
                  "Resource": [
                      "arn:aws:s3:::your-bucket-name/*",
                      "arn:aws:s3:::your-bucket-name"
                  ]
              }
          ]
      }
      ```
      - Save the Access Key ID and Secret Access Key
   
   3. Configure CORS:
      - Go to your bucket in S3 Console
      - Click "Permissions" → "CORS"
      - Add this configuration:
      ```json
      [
          {
              "AllowedHeaders": ["*"],
              "AllowedMethods": ["PUT", "POST", "DELETE", "GET"],
              "AllowedOrigins": [
                  "http://localhost:3000",
                  "https://your-production-domain.com"
              ],
              "ExposeHeaders": ["ETag"]
          }
      ]
      ```

4. **Environment Setup**
   Create a `.env` file in your project root:
   ```env
   # AWS S3 Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_S3_BUCKET=your_bucket_name

   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

### Common Errors

1. **Missing Environment Variables**
   - Ensure all required environment variables are set in your `.env` file
   - Check that AWS credentials are correct and have proper permissions

2. **CORS Issues**
   - Verify your S3 bucket CORS configuration
   - Ensure your domain is listed in the allowed origins

3. **File Size Limits**
   - Check that your file size is within the configured limits
   - Verify S3 bucket policies allow the file size

4. **File Type Restrictions**
   - Ensure the file type is included in `allowedFileTypes`
   - Use `'*'` to allow any file type

## License

MIT