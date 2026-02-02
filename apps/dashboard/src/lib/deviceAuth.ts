/**
 * Device-Based Authentication for FirmOS Dashboard
 * 
 * Operators' machines are pre-registered and can access the dashboard
 * without login prompts. This replaces Google OAuth.
 */

const DEVICE_ID_KEY = 'firmos-device-id';
const AUTHORIZED_DEVICES_KEY = 'firmos-authorized-devices';

/**
 * Generate a unique device fingerprint
 */
function generateDeviceId(): string {
    const uuid = crypto.randomUUID();
    return `firmos-device-${uuid}`;
}

/**
 * Get or create device ID for this machine
 */
export function getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
        console.log('[DeviceAuth] Generated new device ID:', deviceId);
    }
    
    return deviceId;
}

/**
 * Get list of authorized device IDs
 */
export function getAuthorizedDevices(): string[] {
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
 * Check if the current device is authorized
 */
export function isDeviceAuthorized(): boolean {
    const deviceId = getDeviceId();
    const authorized = getAuthorizedDevices();
    
    // If no devices are registered yet, auto-register this one as primary
    if (authorized.length === 0) {
        console.log('[DeviceAuth] No devices registered. Auto-registering this device as primary operator.');
        registerDevice(deviceId);
        return true;
    }
    
    return authorized.includes(deviceId);
}

/**
 * Register a device as authorized
 */
export function registerDevice(deviceId?: string): void {
    const id = deviceId || getDeviceId();
    const authorized = getAuthorizedDevices();
    
    if (!authorized.includes(id)) {
        authorized.push(id);
        localStorage.setItem(AUTHORIZED_DEVICES_KEY, JSON.stringify(authorized));
        console.log('[DeviceAuth] Device registered:', id);
    }
}

/**
 * Revoke a device's authorization
 */
export function revokeDevice(deviceId: string): void {
    const authorized = getAuthorizedDevices();
    const filtered = authorized.filter(id => id !== deviceId);
    localStorage.setItem(AUTHORIZED_DEVICES_KEY, JSON.stringify(filtered));
    console.log('[DeviceAuth] Device revoked:', deviceId);
}

/**
 * Get device info for display
 */
export function getDeviceInfo(): {
    deviceId: string;
    isAuthorized: boolean;
    authorizedDevices: string[];
    isPrimaryDevice: boolean;
} {
    const deviceId = getDeviceId();
    const authorized = getAuthorizedDevices();
    const isAuthorized = authorized.includes(deviceId);
    const isPrimaryDevice = authorized.length > 0 && authorized[0] === deviceId;
    
    return {
        deviceId,
        isAuthorized,
        authorizedDevices: authorized,
        isPrimaryDevice,
    };
}

/**
 * Clear all device auth data (for testing/reset)
 */
export function clearDeviceAuth(): void {
    localStorage.removeItem(DEVICE_ID_KEY);
    localStorage.removeItem(AUTHORIZED_DEVICES_KEY);
    console.log('[DeviceAuth] All device auth data cleared');
}
