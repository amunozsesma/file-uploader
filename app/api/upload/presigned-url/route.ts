import { NextResponse } from 'next/server';
import { createPresignedUploadUrl } from '@/lib/s3';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/constants';

// Default handler using project constants
export async function POST(request: Request) {
    return handleUpload(request, {
        allowedFileTypes: ALLOWED_FILE_TYPES,
        maxFileSize: MAX_FILE_SIZE
    });
}

// Configurable handler for external consumers
export function createUploadHandler(config: {
    allowedFileTypes: string[] | '*',
    maxFileSize: number
}) {
    return async (request: Request) => {
        return handleUpload(request, config);
    };
}

// Core implementation
async function handleUpload(
    request: Request,
    config: { allowedFileTypes: string[] | '*', maxFileSize: number }
) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (error) {
            return new NextResponse('Invalid JSON in request body', { status: 400 });
        }

        const { fileName, fileType, fileSize } = body;

        if (!fileName || !fileType || !fileSize) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // Skip type check if allowedFileTypes is '*'
        if (config.allowedFileTypes !== '*' && !config.allowedFileTypes.includes(fileType)) {
            return new NextResponse('File type not allowed', { status: 400 });
        }

        if (fileSize > config.maxFileSize) {
            return new NextResponse('File too large', { status: 400 });
        }

        const presignedPost = await createPresignedUploadUrl({
            fileName,
            fileType,
        });

        return NextResponse.json(presignedPost);
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 