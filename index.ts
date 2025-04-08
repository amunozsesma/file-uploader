// Export hooks
export { default as useFileUploader } from './app/hooks/useFileUploader';

// Export API route handlers
export { createUploadHandler } from './app/api/upload/route';
export { createDownloadHandler } from './app/api/download/route';

// Export S3 utilities
export {
    createPresignedUploadUrl,
    getSignedUrl,
    getFileByS3Key
} from './lib/s3';

// Export types
export type { UseFileUploaderProps, UseFileUploaderResult, FileUploaderConfig } from './app/hooks/useFileUploader';

// Export type utilities
export type { DeepPartial } from './app/hooks/useFileUploader';
