import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/app/server/constants';

export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Validates file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Only ${ALLOWED_FILE_TYPES.join(', ')} are accepted`,
    };
  }

  return { valid: true };
}

/**
 * Generates a unique filename for uploaded files
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Simulates file upload (in production, this would upload to cloud storage)
 * For now, returns a mock URL
 */
export async function uploadFile(file: File): Promise<FileUploadResult> {
  const validation = validateFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    // In production, upload to cloud storage (AWS S3, Cloudinary, etc.)
    // For now, return a mock URL
    const filename = generateUniqueFilename(file.name);
    const mockUrl = `/uploads/resumes/${filename}`;

    return {
      success: true,
      url: mockUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'File upload failed',
    };
  }
}

/**
 * Handles base64 file upload (for client-side uploads)
 */
export async function uploadBase64File(
  base64Data: string,
  filename: string
): Promise<FileUploadResult> {
  try {
    // Convert base64 to File
    const arr = base64Data.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    const file = new File([u8arr], filename, { type: mime });

    return await uploadFile(file);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Base64 file upload failed',
    };
  }
}
