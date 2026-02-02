/**
 * Device Authentication — DEPRECATED
 * 
 * ⚠️ This module is deprecated and should not be used for security.
 * Use Supabase Auth via AuthContext instead.
 * 
 * The deviceId functions are kept for device tracking/analytics only,
 * NOT for authorization decisions.
 */

const DEVICE_ID_KEY = 'firmos-device-id';

// ⚠️ DEPRECATED: These functions are no longer used for auth
// Keep for backwards compatibility only
const AUTHORIZED_DEVICES_KEY = 'firmos-authorized-devices';

/**
 * Generate a unique device fingerprint
 * (Still useful for analytics/tracking)
 */
function generateDeviceId(): string {
    const uuid = crypto.randomUUID();
    return `firmos-device-${uuid}`;
}

/**
 * Get or create device ID for this machine
 * (Useful for tracking, NOT for authorization)
 */
export function getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
        console.log('[DeviceAuth] Generated device ID for tracking:', deviceId);
    }

    return deviceId;
}

/**
 * @deprecated Use Supabase Auth instead
 */
export function getAuthorizedDevices(): string[] {
    console.warn('[DeviceAuth] getAuthorizedDevices is deprecated. Use Supabase Auth.');
    const stored = localStorage.getItem(AUTHORIZED_DEVICES_KEY);
    if (!stored) {
        return [];
    }
    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

/**
 * @deprecated Use Supabase Auth instead
 * Authorization is NO LONGER based on device registration.
 */
export function isDeviceAuthorized(): boolean {
    console.warn('[DeviceAuth] isDeviceAuthorized is deprecated. Use Supabase Auth.');
    // Always return false to prevent insecure auth
    return false;
}

/**
 * @deprecated Use Supabase Auth instead
 */
export function registerDevice(_deviceId?: string): void {
    console.warn('[DeviceAuth] registerDevice is deprecated. Use Supabase Auth.');
    // No-op: Device registration no longer grants access
}

/**
 * @deprecated Use Supabase Auth instead
 */
export function revokeDevice(_deviceId: string): void {
    console.warn('[DeviceAuth] revokeDevice is deprecated. Use Supabase Auth signOut.');
    // No-op
}

/**
 * Get device info (for analytics/tracking only)
 */
export function getDeviceInfo(): {
    deviceId: string;
    isAuthorized: boolean;
    authorizedDevices: string[];
    isPrimaryDevice: boolean;
} {
    const deviceId = getDeviceId();

    return {
        deviceId,
        isAuthorized: false, // Always false - use Supabase Auth
        authorizedDevices: [],
        isPrimaryDevice: false,
    };
}

/**
 * Clear all device auth data (for testing/reset)
 */
export function clearDeviceAuth(): void {
    localStorage.removeItem(DEVICE_ID_KEY);
    localStorage.removeItem(AUTHORIZED_DEVICES_KEY);
    console.log('[DeviceAuth] Device data cleared');
}
