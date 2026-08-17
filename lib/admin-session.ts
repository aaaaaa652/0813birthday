import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function getSessionSecret(): string | null {
  const adminPassword = process.env.ADMIN_PASSWORD;
  return adminPassword ? `birthday-admin-session:${adminPassword}` : null;
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createAdminSession(): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('ADMIN_PASSWORD environment variable is not configured');
  }

  const expiresAt = Date.now() + SESSION_TTL_MS;
  const nonce = randomBytes(16).toString('base64url');
  const payload = `${expiresAt}.${nonce}`;
  const signature = signPayload(payload, secret);

  return `${payload}.${signature}`;
}

export function validateAdminSession(sessionId: string | null | undefined): boolean {
  const secret = getSessionSecret();
  if (!secret || !sessionId) {
    return false;
  }

  const [expiresAtValue, nonce, signature, ...extraParts] = sessionId.split('.');
  if (!expiresAtValue || !nonce || !signature || extraParts.length > 0) {
    return false;
  }

  const expiresAt = Number(expiresAtValue);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return false;
  }

  const payload = `${expiresAtValue}.${nonce}`;
  const expectedSignature = signPayload(payload, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  return actualBuffer.length === expectedBuffer.length
    && timingSafeEqual(actualBuffer, expectedBuffer);
}
