import { ErrorFactory, ErrorCode } from '@/lib/errors';

const DEFAULT_TTL_SECONDS = 60; // short-lived handoff

type TransferPayload = {
  t: string; // session token
  exp: number; // unix seconds
};

function getSecret(): string {
  const secret = process.env.SESSION_TRANSFER_SECRET 
    || process.env.NEXTAUTH_SECRET 
    || process.env.AUTH_SECRET 
    || process.env.JWT_SECRET 
    || '';
  if (!secret) {
    throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'SESSION_TRANSFER_SECRET (or JWT_SECRET/NEXTAUTH_SECRET/AUTH_SECRET) is not set');
  }
  return secret;
}

function toBase64UrlFromBytes(bytes: ArrayBuffer | ArrayBufferLike): string {
  const arr = new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlEncodeString(input: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  return toBase64UrlFromBytes(bytes.buffer);
}

function base64UrlDecodeToString(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionTransferToken(sessionToken: string, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<string> {
  const payload: TransferPayload = {
    t: sessionToken,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payloadStr = JSON.stringify(payload);
  const secret = getSecret();
  const key = await getKey(secret);
  const encoder = new TextEncoder();
  const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadStr));
  const sig = toBase64UrlFromBytes(sigBytes);
  const token = base64UrlEncodeString(payloadStr) + '.' + sig;
  return token;
}

export async function verifySessionTransferToken(token: string): Promise<TransferPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  let payloadStr = '';
  try {
    payloadStr = base64UrlDecodeToString(payloadB64);
  } catch {
    return null;
  }
  const secret = getSecret();
  const key = await getKey(secret);
  const encoder = new TextEncoder();
  const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const expected = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadStr));
  const expectedB64 = toBase64UrlFromBytes(expected);
  if (sig !== expectedB64) return null;
  let payload: TransferPayload;
  try {
    payload = JSON.parse(payloadStr);
  } catch {
    return null;
  }
  if (!payload || !payload.t || !payload.exp) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}


