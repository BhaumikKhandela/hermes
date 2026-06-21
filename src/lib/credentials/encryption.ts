import {
  KMSClient,
  GenerateDataKeyCommand,
  DecryptCommand,
} from "@aws-sdk/client-kms";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKmsClient(): KMSClient {
  return new KMSClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });
}

function getKeyId(): string {
  return process.env.AWS_KMS_KEY_ID || "";
}

export async function kmsGenerateDEK(): Promise<{
  plaintextKey: Buffer;
  encryptedKey: Buffer;
}> {
  const client = getKmsClient();
  const cmd = new GenerateDataKeyCommand({
    KeyId: getKeyId(),
    KeySpec: "AES_256",
  });
  const res = await client.send(cmd);
  return {
    plaintextKey: Buffer.from(res.Plaintext!),
    encryptedKey: Buffer.from(res.CiphertextBlob!),
  };
}

export async function kmsDecrypt(encryptedKey: Buffer): Promise<Buffer> {
  const client = getKmsClient();
  const cmd = new DecryptCommand({
    CiphertextBlob: encryptedKey,
    KeyId: getKeyId(),
  });
  const res = await client.send(cmd);
  return Buffer.from(res.Plaintext!);
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
