'use client';

import { useState, useEffect } from 'react';
import { useFileUploader } from './hooks/useFileUploader';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);

  const { isUploading, uploadFile, reset } = useFileUploader({
    file,
    allowedFileTypes: '*',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    onUploadComplete: (key: string) => {
      setUploadedKey(key);
      setUploadProgress(100);
    },
    onUploadError: (error: Error) => {
      setError(error.message);
      setUploadProgress(0);
    },
    onUploadProgress: (progress: number) => {
      setUploadProgress(progress);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setUploadProgress(0);
      setUploadedKey(null);
      reset(); // Reset the uploader state

      // Automatically start upload when file is selected
      uploadFile(selectedFile).catch(err => {
        // Error is handled by onUploadError
      });
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">File Uploader</h1>

        <div className="space-y-6">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose a file
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Progress Bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {uploadedKey && (
            <div className="p-4 bg-green-50 rounded-md">
              <p className="text-sm text-green-700">
                File uploaded successfully! Key: {uploadedKey}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
