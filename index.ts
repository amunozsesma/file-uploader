// Export components
export { default as FileUploader } from './app/components/FileUploader';

// Export API route handlers
export { createUploadHandler } from './app/api/upload/presigned-url/route';
export { createDownloadHandler } from './app/api/download/route';

// Export S3 utilities
export {
    createPresignedUploadUrl,
    getSignedUrl,
    getFileByS3Key
} from './lib/s3';
