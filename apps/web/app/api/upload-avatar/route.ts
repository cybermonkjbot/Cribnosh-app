import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { IncomingForm } from 'formidable';
import type { Id } from '@/convex/_generated/dataModel';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ErrorFactory, ErrorCode } from '@/lib/errors';

/**
 * @swagger
 * /upload-avatar:
 *   post:
 *     summary: Upload User Avatar
 *     description: Upload and store a user avatar image file
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload as avatar
 *                 maxLength: 5242880
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL to access the uploaded avatar
 *                   example: "/api/files/j1234567890abcdef"
 *                 storageId:
 *                   type: string
 *                   description: Convex storage ID for the uploaded file
 *                   example: "j1234567890abcdef"
 *       400:
 *         description: Bad request - invalid file or missing file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No file uploaded"
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Method not allowed"
 *       500:
 *         description: Internal server error during upload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to upload image"
 *                 details:
 *                   type: string
 *                   example: "Convex upload error"
 *     security:
 *       - bearerAuth: []
 */

// Define types for the file upload
type FormidableFile = {
  filepath: string;
  originalFilename: string | null;
  mimetype: string | null;
  size: number;
  newFilename: string;
  hashAlgorithm: false | 'sha1' | 'md5' | 'sha256';
};

// Define types for form data
type FormData = {
  fields: Record<string, string[]>;
  files: Record<string, FormidableFile[]>;
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();
  
  try {
    const { fields, files } = await new Promise<FormData>((resolve, reject) => {
      form.parse(req, (err: Error | null, fields: Record<string, string[]>, files: Record<string, FormidableFile[]>) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ fields, files });
      });
    });
    
    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const uploadedFile = file;
    
    if (!uploadedFile.mimetype?.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }
    
    if (uploadedFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 5MB' });
    }
    
    try {
      const convex = getConvexClient();
      // 1. Generate a Convex upload URL
      const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);
      
      // 2. Upload the file to Convex storage
      const fileBuffer = fs.readFileSync(uploadedFile.filepath);
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': uploadedFile.mimetype || 'application/octet-stream',
        },
        body: fileBuffer,
      });
      if (!uploadRes.ok) {
        return res.status(500).json({ error: 'Failed to upload to Convex storage' });
      }
      const result = await uploadRes.json();
      if (!result.storageId) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'No storageId in upload response');
      }
      const { storageId } = result;
      // 3. Return the Convex file URL (or storageId)
      const fileUrl = `/api/files/${storageId}`;
      return res.status(200).json({ url: fileUrl, storageId });
    } catch (e) {
      console.error('Convex upload error:', e);
      return res.status(500).json({ error: 'Failed to upload image', details: e instanceof Error ? e.message : e });
    }
  } catch (error) {
    console.error('Error processing upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ error: 'Error processing file upload', details: errorMessage });
  }
} 