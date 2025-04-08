'use client';

import { useState, useEffect, useRef } from 'react';

export interface FileUploaderConfig {
    allowedFileTypes: string[];
    maxFileSize: number;
    apiBaseUrl: string;
    endpoints: {
        uploadUrl: string;
    }
}

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface UseFileUploaderProps {
    file: File | null;
    allowedFileTypes: string[] | '*';
    maxFileSize: number;
    onUploadComplete?: (fileKey: string) => void;
    onUploadError?: (error: Error) => void;
    onUploadProgress?: (progress: number) => void;
    config?: Omit<DeepPartial<FileUploaderConfig>, 'allowedFileTypes' | 'maxFileSize'>;
}

interface UploadPostData {
    url: string;
    fields: Record<string, string>;
    key: string;
}

export interface UseFileUploaderResult {
    isUploading: boolean;
    uploadFile: (file: File) => Promise<void>;
    reset: () => void;
}

export function useFileUploader({
    file,
    allowedFileTypes,
    maxFileSize,
    onUploadComplete,
    onUploadError,
    onUploadProgress,
    config = {}
}: UseFileUploaderProps): UseFileUploaderResult {
    // Default configuration
    const DEFAULT_CONFIG: Omit<FileUploaderConfig, 'allowedFileTypes' | 'maxFileSize'> = {
        apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '',
        endpoints: {
            uploadUrl: '/api/upload'
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

    // Get upload URL
    const getUploaddUrl = async (file: File): Promise<UploadPostData> => {
        const url = `${finalConfig.apiBaseUrl}${finalConfig.endpoints.uploadUrl}`;
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
            throw new Error(errorData?.message || 'Failed to get upload URL');
        }

        return response.json();
    };

    // Upload to S3 using XMLHttpRequest for progress tracking
    const uploadToS3 = async (file: File, uploadPost: UploadPostData) => {
        const formData = new FormData();
        Object.entries(uploadPost.fields).forEach(([key, value]) => {
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

            xhr.open('POST', uploadPost.url);
            xhr.send(formData);
        });
    };

    // Handle file upload
    useEffect(() => {
        if (!file || isUploading || !uploadAttempted.current) return;

        const performUpload = async () => {
            setIsUploading(true);

            try {
                // Check if file type is allowed (skip check if allowedFileTypes is '*')
                if (allowedFileTypes !== '*' && !allowedFileTypes.includes(file.type)) {
                    throw new Error(`File type not supported. Allowed types: ${allowedFileTypes.join(', ')}`);
                }

                if (file.size > finalConfig.maxFileSize) {
                    throw new Error(`File too large (max ${Math.round(finalConfig.maxFileSize / (1024 * 1024))}MB)`);
                }

                // Step 1: Get upload URL
                const uploadPost = await getUploaddUrl(file);

                // Step 2: Upload to S3
                await uploadToS3(file, uploadPost);

                onUploadComplete?.(uploadPost.key);
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Upload failed');
                onUploadError?.(error);
            } finally {
                setIsUploading(false);
                uploadAttempted.current = false;
            }
        };

        performUpload();
    }, [file, isUploading, uploadAttempted.current]);

    const uploadFile = async (fileToUpload: File) => {
        if (isUploading) return;

        uploadAttempted.current = true;

        setIsUploading(true);
        try {
            // Check if file type is allowed (skip check if allowedFileTypes is '*')
            if (allowedFileTypes !== '*' && !allowedFileTypes.includes(fileToUpload.type)) {
                throw new Error(`File type not supported. Allowed types: ${allowedFileTypes.join(', ')}`);
            }

            if (fileToUpload.size > finalConfig.maxFileSize) {
                throw new Error(`File too large (max ${Math.round(finalConfig.maxFileSize / (1024 * 1024))}MB)`);
            }

            // Step 1: Get upload URL
            const uploadPost = await getUploaddUrl(fileToUpload);

            // Step 2: Upload to S3
            await uploadToS3(fileToUpload, uploadPost);

            onUploadComplete?.(uploadPost.key);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Upload failed');
            onUploadError?.(error);
            throw error;
        } finally {
            setIsUploading(false);
            uploadAttempted.current = false;
        }
    };

    const reset = () => {
        uploadAttempted.current = false;
        setIsUploading(false);
    };

    return {
        isUploading,
        uploadFile,
        reset
    };
}

// For backward compatibility
export default useFileUploader; 