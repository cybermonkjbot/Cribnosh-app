// @ts-nocheck
'use node';
import { v } from 'convex/values';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
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
        return false;
      }

      const hash = scryptSync(args.password, salt, 64).toString('hex');
      return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
    } catch (error) {
      console.error('Error during password verification:', error);
      return false;
    }
  },
});