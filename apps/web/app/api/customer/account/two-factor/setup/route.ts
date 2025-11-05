import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import jwt from 'jsonwebtoken';
import { scryptSync, randomBytes } from 'crypto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /customer/account/two-factor/setup:
 *   post:
 *     summary: Setup Two-Factor Authentication
 *     description: Generate a 2FA secret, backup codes, and return QR code data for setup
 *     tags: [Customer, Security]
 *     responses:
 *       200:
 *         description: 2FA setup successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     secret:
 *                       type: string
 *                       description: The 2FA secret (for manual entry)
 *                     backupCodes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: One-time backup codes (display only once)
 *                     qrCode:
 *                       type: string
 *                       description: Base64 encoded QR code image
 *                 message:
 *                   type: string
 *                   example: "2FA setup successful"
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can access this endpoint.');
    }
    
    const convex = getConvexClient();
    const userId = payload.user_id;
    
    // Get user to get email for QR code label
    const user = await convex.query(api.queries.users.getById, { userId });
    if (!user) {
      return ResponseFactory.notFound('User not found.');
    }
    
    // Generate 2FA secret
    const secret = authenticator.generateSecret();
    
    // Generate 8 backup codes
    const backupCodes: string[] = [];
    const unhashedBackupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      unhashedBackupCodes.push(code);
      // Hash backup code using scrypt
      const salt = randomBytes(16).toString('hex');
      const hashedCode = `${salt}:${scryptSync(code, salt, 64).toString('hex')}`;
      backupCodes.push(hashedCode);
    }
    
    // Store encrypted secret and hashed backup codes
    // For now, we'll store the secret as-is (in production, encrypt it)
    const encryptedSecret = secret; // Store base32 encoded secret
    
    // Store in database
    await convex.mutation(api.mutations.users.setupTwoFactor, {
      userId: userId as any,
      secret: encryptedSecret,
      backupCodes: backupCodes,
    });
    
    // Generate QR code
    // Use email if available, otherwise fallback to phone number or user ID
    const serviceName = 'Cribnosh';
    const accountName = user.email || user.phone_number || user.name || `user_${userId}`;
    const otpauthUrl = authenticator.keyuri(accountName, serviceName, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    
    return ResponseFactory.success({
      secret: secret, // Return base32 for manual entry
      backupCodes: unhashedBackupCodes, // Return unhashed codes (one-time only)
      qrCode: qrCodeDataUrl, // Return base64 QR code image
    });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to setup 2FA.');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

