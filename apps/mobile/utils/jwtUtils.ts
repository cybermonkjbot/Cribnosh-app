/**
 * JWT Token utilities for handling token expiration and validation
 */

export interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
  [key: string]: any;
}

/**
 * Decodes a JWT token without verification (client-side only)
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

/**
 * Checks if a JWT token is expired
 * @param token - JWT token string
 * @param bufferSeconds - Buffer time in seconds before actual expiration (default: 30)
 * @returns true if token is expired or will expire within buffer time
 */
export const isTokenExpired = (
  token: string,
  bufferSeconds: number = 30
): boolean => {
  const payload = decodeJWT(token);
  console.log("[JWT Utils] Token decoded:", !!payload);
  console.log("[JWT Utils] Token has exp field:", !!payload?.exp);
  
  if (!payload || !payload.exp) {
    console.log("[JWT Utils] Token invalid or missing exp field, treating as expired");
    return true; // Consider invalid tokens as expired
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = payload.exp;
  const timeUntilExpiration = expirationTime - currentTime;

  console.log("[JWT Utils] Current time:", currentTime);
  console.log("[JWT Utils] Expiration time:", expirationTime);
  console.log("[JWT Utils] Time until expiration:", timeUntilExpiration, "seconds");
  console.log("[JWT Utils] Buffer seconds:", bufferSeconds);

  // Add buffer time to prevent edge cases where token expires during request
  const isExpired = currentTime >= expirationTime - bufferSeconds;
  console.log("[JWT Utils] Token expired:", isExpired);
  
  return isExpired;
};

/**
 * Gets the time until token expiration in seconds
 * @param token - JWT token string
 * @returns Seconds until expiration, or 0 if expired/invalid
 */
export const getTimeUntilExpiration = (token: string): number => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = payload.exp;

  return Math.max(0, expirationTime - currentTime);
};

/**
 * Checks if a token will expire soon (within the next 5 minutes)
 * @param token - JWT token string
 * @returns true if token expires within 5 minutes
 */
export const isTokenExpiringSoon = (token: string): boolean => {
  const timeUntilExpiration = getTimeUntilExpiration(token);
  return timeUntilExpiration > 0 && timeUntilExpiration <= 300; // 5 minutes
};

