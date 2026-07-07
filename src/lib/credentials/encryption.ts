import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const KEY_HEX_LENGTH = 64;

function getMasterKey(): Buffer {
  const hex = process.env.MASTER_ENCRYPTION_KEY;
  if (!hex || hex.length !== KEY_HEX_LENGTH) {
    throw new Error(
      `MASTER_ENCRYPTION_KEY must be a ${KEY_HEX_LENGTH}-character hex string`,
    );
  }
  return Buffer.from(hex, "hex");
}

export async function encryptPayload(
  plaintext: string,
): Promise<{ ciphertext: Buffer; iv: Buffer; authTag: Buffer }> {
  const key = getMasterKey();
  return aesEncrypt(plaintext, key);
}

export async function decryptPayload(
  ciphertext: Buffer,
  iv: Buffer,
  authTag: Buffer,
): Promise<string> {
  const key = getMasterKey();
  return aesDecrypt(ciphertext, key, iv, authTag);
}

export function aesEncrypt(
  plaintext: string,
  key: Buffer,
): { ciphertext: Buffer; iv: Buffer; authTag: Buffer } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return { ciphertext: encrypted, iv, authTag };
}

export function aesDecrypt(
  ciphertext: Buffer,
  key: Buffer,
  iv: Buffer,
  authTag: Buffer,
): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
