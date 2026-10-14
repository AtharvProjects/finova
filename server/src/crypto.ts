import crypto from 'crypto';

/**
 * Deterministically sorts object keys recursively to produce a canonical JSON string.
 * This guarantees that two identical objects will produce the exact same SHA-256 hash
 * regardless of key insertion order.
 */
export function canonicalStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalStringify(item)).join(',') + ']';
  }

  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => {
    return `${JSON.stringify(key)}:${canonicalStringify(obj[key])}`;
  });

  return '{' + pairs.join(',') + '}';
}

/**
 * Computes the SHA-256 hash of a deterministic canonical JSON representation
 */
export function computeCanonicalSha256(payload: any): { canonicalJson: string; hash: string } {
  const canonicalJson = canonicalStringify(payload);
  const hash = crypto.createHash('sha256').update(canonicalJson, 'utf8').digest('hex');
  return { canonicalJson, hash };
}

/**
 * Verifies the integrity of a record by comparing its stored canonical hash
 * with the newly computed hash of the current payload.
 */
export function verifyRecordIntegrity(
  payload: any,
  storedHash: string
): {
  isValid: boolean;
  computedHash: string;
  storedHash: string;
  match: boolean;
} {
  const { hash: computedHash } = computeCanonicalSha256(payload);
  const match = computedHash.toLowerCase() === storedHash.toLowerCase();
  return {
    isValid: match,
    computedHash,
    storedHash,
    match,
  };
}

/**
 * Simulates a tamper demonstration by intentionally modifying a specific field
 * on a temporary clone, re-computing the hash, and proving cryptographic mismatch.
 */
export function simulateTamperTest(
  originalPayload: any,
  storedHash: string,
  fieldToTamper: string = 'risk_score',
  tamperedValue: any = 15
): {
  originalHash: string;
  tamperedPayload: any;
  tamperedHash: string;
  isTamperedValid: boolean;
  tamperedField: string;
  originalValue: any;
  tamperedValue: any;
  message: string;
} {
  const originalClone = JSON.parse(JSON.stringify(originalPayload));
  const tamperedClone = JSON.parse(JSON.stringify(originalPayload));

  const originalValue = originalClone[fieldToTamper];
  tamperedClone[fieldToTamper] = tamperedValue;

  const { hash: originalComputedHash } = computeCanonicalSha256(originalClone);
  const { hash: tamperedHash } = computeCanonicalSha256(tamperedClone);

  const isTamperedValid = tamperedHash.toLowerCase() === storedHash.toLowerCase();

  return {
    originalHash: storedHash || originalComputedHash,
    tamperedPayload: tamperedClone,
    tamperedHash,
    isTamperedValid,
    tamperedField: fieldToTamper,
    originalValue,
    tamperedValue,
    message: isTamperedValid
      ? 'Verification passed (No change detected)'
      : `CRYPTOGRAPHIC MISMATCH DETECTED: Field "${fieldToTamper}" altered from [${originalValue}] to [${tamperedValue}]. Hash changed from ${storedHash.slice(0, 12)}... to ${tamperedHash.slice(0, 12)}...`,
  };
}
