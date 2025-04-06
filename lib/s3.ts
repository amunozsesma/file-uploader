import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from './constants';

if (!process.env.AWS_REGION) throw new Error('AWS_REGION is not defined');
if (!process.env.AWS_ACCESS_KEY_ID) throw new Error('AWS_ACCESS_KEY_ID is not defined');
if (!process.env.AWS_SECRET_ACCESS_KEY) throw new Error('AWS_SECRET_ACCESS_KEY is not defined');
if (!process.env.AWS_S3_BUCKET) throw new Error('AWS_S3_BUCKET is not defined');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export { s3Client };

interface GetPresignedUrlParams {
    fileType: string;
    fileName: string;
}

export async function createPresignedUploadUrl({ fileType, fileName }: GetPresignedUrlParams) {
    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
        throw new Error('File type not allowed');
    }

    const key = `uploads/${uuidv4()}/${fileName}`;

    const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Conditions: [
            ['content-length-range', 0, MAX_FILE_SIZE],
            ['starts-with', '$Content-Type', 'audio/'],
        ],
        Fields: {
            'Content-Type': fileType,
        },
        Expires: 600, // URL expires in 10 minutes
    });

    return {
        url,
        fields,
        key,
    };
}

export async function getSignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
    });

    return awsGetSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
}

/**
 * Get file from S3 by s3Key
 * @param s3Key The S3 key of the file
 * @returns Buffer and metadata for the file
 */
export async function getFileByS3Key(s3Key: string): Promise<{ buffer: Buffer; size: number; contentType: string | undefined }> {
    try {
        if (!s3Key) {
            throw new Error('S3 key is required');
        }

        // Get a signed URL to access the file
        const fileUrl = await getSignedUrl(s3Key);

        // Fetch the file content
        const response = await fetch(fileUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch file from S3: ${response.statusText}`);
        }

        // Get content type from response headers
        const contentType = response.headers.get('content-type') || undefined;

        // Convert to buffer for processing
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return {
            buffer,
            size: buffer.length,
            contentType
        };
    } catch (error) {
        console.error('Error retrieving file from S3:', error);
        throw error;
    }
} 