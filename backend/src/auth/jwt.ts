import jwt from 'jsonwebtoken';
import { getEnv } from '../env.js';

export interface JwtPayload {
  sub: string; // User ID
  role: string;
  branchId?: string;
  email?: string;
}

/**
 * Sign JWT token
 * @param payload - Token payload
 * @returns Signed JWT token
 */
export function signToken(payload: JwtPayload): string {
  const env = getEnv();
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
    issuer: 'a7-smart-pos',
    audience: 'a7-smart-pos-api',
  });
}

/**
 * Verify JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload
 * @throws Error if token is invalid
 */
export function verifyToken(token: string): JwtPayload {
  const env = getEnv();
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'a7-smart-pos',
      audience: 'a7-smart-pos-api',
    }) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

