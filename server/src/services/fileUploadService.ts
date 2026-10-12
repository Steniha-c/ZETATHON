import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { PPTFileMetadata } from '../types/index.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');

export function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

// Maximum allowed PPT/PDF size: 25 Megabytes
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export type DetectedFileType = 'pdf' | 'pptx' | 'ppt' | 'invalid';

/**
 * Validates actual binary content using standard magic byte signatures.
 * Does NOT trust client-supplied extensions or MIME headers.
 */
export function inspectFileMagicBytes(buffer: Buffer): { valid: boolean; type: DetectedFileType; error?: string } {
  if (!buffer || buffer.length < 4) {
    return { valid: false, type: 'invalid', error: 'File is empty or corrupted (too small to inspect headers).' };
  }

  // 1. PDF Signature: %PDF- (0x25 0x50 0x44 0x46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { valid: true, type: 'pdf' };
  }

  // 2. PPTX (Office Open XML / PK Zip archive): PK\x03\x04 (0x50 0x4B 0x03 0x04)
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
    (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08)
  ) {
    return { valid: true, type: 'pptx' };
  }

  // 3. Legacy PPT (Microsoft OLE Compound Document Header): 0xD0 0xCF 0x11 0xE0 0xA1 0xB1 0x1A 0xE1
  if (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1
  ) {
    return { valid: true, type: 'ppt' };
  }

  return {
    valid: false,
    type: 'invalid',
    error: 'Invalid file format: Actual file binary content does not match a valid PDF, PPTX, or PPT presentation.',
  };
}

/**
 * Persists an inspected, valid buffer safely to the private uploads directory.
 * Generates an unguessable UUID-based server filename to prevent path traversal.
 */
export function saveUploadedPPT(
  buffer: Buffer,
  originalFilename: string,
  detectedType: DetectedFileType
): PPTFileMetadata {
  ensureUploadsDir();

  const safeOriginalName = path.basename(originalFilename).replace(/[^\w\.\-\s]/gi, '_');
  const ext = detectedType === 'pdf' ? 'pdf' : detectedType === 'pptx' ? 'pptx' : 'ppt';
  const fileId = `ppt-${crypto.randomUUID()}.${ext}`;
  const targetPath = path.join(UPLOADS_DIR, fileId);

  // Write file to disk securely
  fs.writeFileSync(targetPath, buffer);

  let mimeType = 'application/octet-stream';
  if (detectedType === 'pdf') mimeType = 'application/pdf';
  else if (detectedType === 'pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  else if (detectedType === 'ppt') mimeType = 'application/vnd.ms-powerpoint';

  return {
    fileId,
    originalName: safeOriginalName,
    mimeType,
    sizeBytes: buffer.length,
    uploadedAt: new Date().toISOString(),
    storedPath: targetPath,
  };
}

/**
 * Retrieves the absolute path of an uploaded file, verifying it stays within the upload directory.
 */
export function getUploadedFilePath(fileId: string): string | null {
  ensureUploadsDir();

  // Prevent path traversal
  const cleanId = path.basename(fileId);
  const fullPath = path.resolve(UPLOADS_DIR, cleanId);

  // Verify path containment
  if (!fullPath.startsWith(UPLOADS_DIR)) {
    return null;
  }

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return fullPath;
}

// Multer memory storage configuration with 25MB limit
export const uploadPPTMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.pptx', '.ppt'];
    if (!allowedExts.includes(ext)) {
      cb(new Error('Only .pdf, .pptx, and .ppt presentation files are accepted.'));
      return;
    }
    cb(null, true);
  },
});
