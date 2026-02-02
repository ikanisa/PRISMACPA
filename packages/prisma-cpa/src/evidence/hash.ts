/**
 * Cryptographic Hash Utilities
 *
 * SHA-256 hashing for evidence integrity verification.
 */

/**
 * Compute SHA-256 hash of a Uint8Array.
 * Uses Web Crypto API for browser/Node.js compatibility.
 */
export async function hashBytes(bytes: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute SHA-256 hash of a string (UTF-8 encoded).
 */
export async function hashString(text: string): Promise<string> {
    const encoder = new TextEncoder();
    return hashBytes(encoder.encode(text));
}

/**
 * Compute a combined hash of multiple hashes (Merkle-style).
 * Simply concatenates hashes and hashes the result.
 */
export async function combineHashes(hashes: string[]): Promise<string> {
    const sorted = hashes.toSorted(); // Deterministic ordering (non-mutating)
    return hashString(sorted.join(''));
}

/**
 * Verify that a hash matches expected bytes.
 */
export async function verifyHash(
    bytes: Uint8Array,
    expectedHash: string
): Promise<boolean> {
    const actualHash = await hashBytes(bytes);
    return actualHash === expectedHash;
}
