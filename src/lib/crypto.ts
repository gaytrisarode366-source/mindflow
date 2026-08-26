/**
 * Web Crypto API Utility for Client-Side Zero-Knowledge AES-GCM 256-bit Encryption
 * Ensures private mood notes and sensitive journal reflections are encrypted locally
 * before ever reaching Firestore or any network wire.
 */

const ITERATIONS = 100000;
const KEY_LEN = 256;
const VAULT_SESSION_KEY = 'mindflow_vault_session_key';
const VAULT_SALT_KEY = 'mindflow_vault_salt';

// Convert ArrayBuffer to Hex string
function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex string to Uint8Array
function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Derive AES-GCM Key from user passphrase and salt via PBKDF2
export async function deriveKey(passphrase: string, saltHex: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const salt = hexToBuf(saltHex);

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: KEY_LEN },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext with AES-GCM
export async function encryptData(
  plainText: string,
  passphrase: string,
  existingSaltHex?: string
): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const salt = existingSaltHex
    ? hexToBuf(existingSaltHex)
    : window.crypto.getRandomValues(new Uint8Array(16));
  const saltHex = existingSaltHex || bufToHex(salt.buffer);

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ivHex = bufToHex(iv.buffer);

  const key = await deriveKey(passphrase, saltHex);
  const enc = new TextEncoder();

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    enc.encode(plainText)
  );

  const ciphertextHex = bufToHex(encryptedBuffer);

  return {
    ciphertext: ciphertextHex,
    iv: ivHex,
    salt: saltHex,
  };
}

// Decrypt ciphertext with AES-GCM
export async function decryptData(
  ciphertextHex: string,
  ivHex: string,
  saltHex: string,
  passphrase: string
): Promise<string> {
  try {
    const key = await deriveKey(passphrase, saltHex);
    const iv = hexToBuf(ivHex);
    const ciphertext = hexToBuf(ciphertextHex);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      ciphertext as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (error) {
    throw new Error('Failed to decrypt data. Invalid vault key or corrupted payload.');
  }
}

// Session Passphrase Storage (Kept only in memory / tab session)
export function getStoredVaultKey(): string | null {
  return sessionStorage.getItem(VAULT_SESSION_KEY);
}

export function setStoredVaultKey(key: string): void {
  sessionStorage.setItem(VAULT_SESSION_KEY, key);
}

export function clearStoredVaultKey(): void {
  sessionStorage.removeItem(VAULT_SESSION_KEY);
}

export function getOrCreateVaultSalt(): string {
  let salt = localStorage.getItem(VAULT_SALT_KEY);
  if (!salt) {
    const randomSalt = window.crypto.getRandomValues(new Uint8Array(16));
    salt = bufToHex(randomSalt.buffer);
    localStorage.setItem(VAULT_SALT_KEY, salt);
  }
  return salt;
}
