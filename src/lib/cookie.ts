import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// Auto-generated key used when COOKIE_SECRET is not set.
// Persists for the lifetime of the server process — cookies invalidate on restart.
let generatedKey: Buffer | null = null;

function getSecret(): Buffer {
  const hex = process.env.COOKIE_SECRET;
  if (hex && hex.length === 64) {
    return Buffer.from(hex, "hex");
  }
  if (!generatedKey) {
    generatedKey = randomBytes(32);
    console.warn("[cookie] No COOKIE_SECRET set — using auto-generated key. Sessions will reset on server restart.");
  }
  return generatedKey;
}

export function encrypt(plaintext: string): string {
  const key = getSecret();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv + tag + ciphertext, base64-encoded
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decrypt(encoded: string): string {
  const key = getSecret();
  const buf = Buffer.from(encoded, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final("utf8");
}
