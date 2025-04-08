'use client';

import { useState, useEffect, useRef } from 'react';

export interface FileUploaderConfig {
    allowedFileTypes: string[];
    maxFileSize: number;
    apiBaseUrl: string;
    endpoints: {
        presignedUrl: string;
    }
}

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface FileUploaderProps {
    file: File;
    allowedFileTypes: string[] | '*';
    maxFileSize: number;
    onUploadComplete?: (fileKey: string) => void;
    onUploadError?: (error: Error) => void;
    onUploadProgress?: (progress: number) => void;
    config?: Omit<DeepPartial<FileUploaderConfig>, 'allowedFileTypes' | 'maxFileSize'>;
}

interface PresignedPostData {
    url: string;
    fields: Record<string, string>;
    key: string;
}

export default function FileUploader({
    file,
    allowedFileTypes,
    maxFileSize,
    onUploadComplete,
    onUploadError,
    onUploadProgress,
    config = {}
}: FileUploaderProps) {
    // Default configuration
    const DEFAULT_CONFIG: Omit<FileUploaderConfig, 'allowedFileTypes' | 'maxFileSize'> = {
        apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '',
        endpoints: {
            presignedUrl: '/api/upload'
        }
    };

    // Merge default config with provided config
    const finalConfig = {
        ...DEFAULT_CONFIG,
        ...config,
        allowedFileTypes,
        maxFileSize,
        endpoints: {
            ...DEFAULT_CONFIG.endpoints,
            ...(config.endpoints || {})
        }
    };

    const [isUploading, setIsUploading] = useState(false);
    const uploadAttempted = useRef(false);

    // Handle file upload
    useEffect(() => {
        if (!file || isUploading || uploadAttempted.current) return;

        const uploadFile = async () => {
            setIsUploading(true);
            uploadAttempted.current = true;

            try {
                // Check if file type is allowed (skip check if allowedFileTypes is '*')
                if (allowedFileTypes !== '*' && !allowedFileTypes.includes(file.type)) {
                    throw new Error(`File type not supported. Allowed types: ${allowedFileTypes.join(', ')}`);
                }

                if (file.size > finalConfig.maxFileSize) {
                    throw new Error(`File too large (max ${Math.round(finalConfig.maxFileSize / (1024 * 1024))}MB)`);
                }

                // Step 1: Get presigned URL
                const presignedPost = await getPresignedUrl(file);

                // Step 2: Upload to S3
                await uploadToS3(file, presignedPost);

                onUploadComplete?.(presignedPost.key);
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Upload failed');
                onUploadError?.(error);
            } finally {
                setIsUploading(false);
            }
        };

        uploadFile();
    }, [file, finalConfig, onUploadComplete, onUploadError]);

    // Get presigned URL
    const getPresignedUrl = async (file: File): Promise<PresignedPostData> => {
        const url = `${finalConfig.apiBaseUrl}${finalConfig.endpoints.presignedUrl}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || 'Failed to get presigned URL');
        }

        return response.json();
    };

    // Upload to S3 using XMLHttpRequest for progress tracking
    const uploadToS3 = async (file: File, presignedPost: PresignedPostData) => {
        const formData = new FormData();
        Object.entries(presignedPost.fields).forEach(([key, value]) => {
            formData.append(key, value);
        });
        formData.append('file', file);

        return new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    const progress = Math.round(percentComplete);
                    onUploadProgress?.(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 204) {
                    resolve();
                } else {
                    reject(new Error('Upload failed'));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('POST', presignedPost.url);
            xhr.send(formData);
        });
    };

    return null; // Component doesn't render anything, it just handles the upload
} 