import { NextRequest, NextResponse } from 'next/server';
import { getFileByS3Key } from '@/lib/s3';
import { S3Client } from '@aws-sdk/client-s3';

/**
* Default POST handler for s3 downloads
*/
export async function POST(req: NextRequest) {
    return handleDownload(req);
}

/**
 * Configurable handler for external consumers
 */
export function createDownloadHandler(options?: {
    onDownload?: (s3Key: string) => Promise<void>;
}) {
    return async (req: NextRequest) => {
        return handleDownload(req, options);
    };
}

/**
 * Core implementation for handling downloads
 */
async function handleDownload(
    req: NextRequest,
    options?: {
        onDownload?: (s3Key: string) => Promise<void>;
        s3Client?: S3Client;
    }
) {
    try {
        // Parse the request body
        const body = await req.json();

        // Get the s3Key (required parameter)
        const { s3Key } = body;

        // Extract optional metadata
        const { metadata = {} } = body;

        if (!s3Key) {
            return NextResponse.json({ error: 'Missing S3 key' }, { status: 400 });
        }

        if (!options?.s3Client) {
            return NextResponse.json({ error: 'Missing s3 client' }, { status: 400 });
        }

        // Get the file from S3
        const { buffer, size, contentType } = await getFileByS3Key(s3Key, options.s3Client);

        if (!buffer) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Call optional hook if provided
        if (options?.onDownload) {
            await options.onDownload(s3Key);
        }

        // Return the file data
        return NextResponse.json({
            buffer: buffer.toString('base64'),
            size,
            contentType,
            metadata
        });
    } catch (error) {
        console.error('Error downloading file:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}