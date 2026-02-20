// @ts-nocheck
'use node';
import { v } from 'convex/values';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { Buffer } from 'node:buffer';
import { action } from '../_generated/server';

export const hashPasswordAction = action({
  args: { password: v.string() },
  handler: async (_ctx, args) => {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(args.password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  },
});

export const verifyPasswordAction = action({
  args: {
    password: v.string(),
    hashedPassword: v.string(),
  },
  handler: async (_ctx, args) => {
    try {
      const [salt, storedHash] = args.hashedPassword.split(':');
      if (!salt || !storedHash) {
        console.error('Password verification failed: malformed hashedPassword');
        return false;
      }

      const hash = scryptSync(args.password, salt, 64).toString('hex');
      const hashBuf = Buffer.from(hash, 'hex');
      const storedBuf = Buffer.from(storedHash, 'hex');

      if (hashBuf.length !== storedBuf.length) {
        console.error(`Password verification failed: length mismatch (hashBuf: ${hashBuf.length}, storedBuf: ${storedBuf.length})`);
        return false;
      }

      const isValid = timingSafeEqual(hashBuf, storedBuf);
      if (!isValid) {
        console.error('Password verification failed: hash does not match storedHash');
      }
      return isValid;
    } catch (error) {
      console.error('Error during password verification:', error);
      return false;
    }
  },
});