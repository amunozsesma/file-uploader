import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

interface GetPresignedUrlParams {
    fileType: string;
    fileName: string;
    maxFileSize: number;
    s3Client: S3Client;
}

export async function createPresignedUploadUrl({ fileType, fileName, maxFileSize, s3Client }: GetPresignedUrlParams) {
    const key = `uploads/${uuidv4()}/${fileName}`;

    const conditions: any[] = [
        ['content-length-range', 0, maxFileSize]
    ];

    if (fileType.startsWith('audio/')) {
        conditions.push(['starts-with', '$Content-Type', 'audio/']);
    }

    const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Conditions: conditions,
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

export async function getSignedUrl(key: string, s3Client: S3Client): Promise<string> {
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
export async function getFileByS3Key(s3Key: string, s3Client: S3Client): Promise<{ buffer: Buffer; size: number; contentType: string | undefined }> {
    try {
        if (!s3Key) {
            throw new Error('S3 key is required');
        }

        // Get a signed URL to access the file
        const fileUrl = await getSignedUrl(s3Key, s3Client);

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