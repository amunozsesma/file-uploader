# File Uploader

A reusable file uploader component with AWS S3 integration for Next.js applications.

## Features

- 📁 Generic file uploader component with progress bar
- 🔄 S3 pre-signed URL upload flow
- 📥 Download API for retrieving files
- ⚙️ Fully configurable routes and components
- 🔌 Easy to integrate in any Next.js project

## Installation

```bash
npm install file-uploader
# or
yarn add file-uploader
# or
pnpm add file-uploader
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

### FileUploader Component

```tsx
import { FileUploader } from 'file-uploader';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  
  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files?.[0] || null)} 
      />
      
      {file && (
        <FileUploader
          file={file}
          allowedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
          maxFileSize={10 * 1024 * 1024} // 10MB
          onUploadComplete={(key) => console.log('Uploaded:', key)}
          onUploadError={(error) => console.error('Error:', error)}
          onUploadProgress={(progress) => console.log('Progress:', progress)}
          config={{
            apiBaseUrl: 'https://your-api.com',
            endpoints: {
              presignedUrl: '/api/custom/upload'
            }
          }}
        />
      )}
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

// Custom configuration
export const POST = createUploadHandler({
  allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
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

### FileUploader Props

| Prop | Type | Description |
|------|------|-------------|
| `file` | `File` | The file to upload (required) |
| `allowedFileTypes` | `string[]` | List of allowed MIME types (required) |
| `maxFileSize` | `number` | Maximum file size in bytes (required) |
| `onUploadComplete` | `(key: string) => void` | Callback when upload completes |
| `onUploadError` | `(error: Error) => void` | Callback when upload fails |
| `onUploadProgress` | `(progress: number) => void` | Callback for upload progress |
| `config` | `object` | Additional configuration options |

## License

MIT
