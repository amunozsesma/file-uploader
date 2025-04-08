import { NextResponse } from 'next/server';
import { createPresignedUploadUrl } from '@/lib/s3';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/constants';
import { S3Client } from '@aws-sdk/client-s3';

// Default handler using project constants
export async function POST(request: Request) {
    return handleUpload(request, {
        allowedFileTypes: ALLOWED_FILE_TYPES,
        maxFileSize: MAX_FILE_SIZE,
    });
}

// Configurable handler for external consumers
export function createUploadHandler(config: {
    allowedFileTypes: string[],
    maxFileSize: number,
    s3Client?: S3Client
}) {
    return async (request: Request) => {
        return handleUpload(request, config);
    };
}

// Core implementation
async function handleUpload(
    request: Request,
    config: { allowedFileTypes: string[] | '*', maxFileSize: number, s3Client?: S3Client }
) {
    try {
        const { fileName, fileType, fileSize } = await request.json();

        if (!fileName || !fileType || !fileSize) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        if (!config.allowedFileTypes.includes(fileType)) {
            return new NextResponse('File type not allowed', { status: 400 });
        }

        if (fileSize > config.maxFileSize) {
            return new NextResponse('File too large', { status: 400 });
        }

        if (!config.s3Client) {
            return new NextResponse('Missing s3 client', { status: 400 });
        }
        const presignedPost = await createPresignedUploadUrl({
            fileName,
            fileType,
            maxFileSize: config.maxFileSize,
            s3Client: config.s3Client
        });

        return NextResponse.json(presignedPost);
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 