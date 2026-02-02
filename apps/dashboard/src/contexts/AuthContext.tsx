/**
 * Auth Context — Device-Based Authentication
 * 
 * Operators' machines are pre-registered and can access the dashboard
 * without login prompts. No Google OAuth required.
 */

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import {
    getDeviceId,
    isDeviceAuthorized,
    registerDevice,
    revokeDevice,
    getDeviceInfo,
    getAuthorizedDevices,
} from '../lib/deviceAuth';

interface Operator {
    deviceId: string;
    isPrimaryDevice: boolean;
    registeredAt: string;
}

interface AuthContextType {
    operator: Operator | null;
    isAuthenticated: boolean;
    loading: boolean;
    deviceId: string;
    authorizedDevices: string[];
    registerThisDevice: () => void;
    revokeDeviceById: (deviceId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [operator, setOperator] = useState<Operator | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deviceId, setDeviceId] = useState('');
    const [authorizedDevices, setAuthorizedDevices] = useState<string[]>([]);

    useEffect(() => {
        // Check device authorization on mount
        const checkDevice = () => {
            const id = getDeviceId();
            setDeviceId(id);

            const authorized = isDeviceAuthorized();
            setIsAuthenticated(authorized);

            const devices = getAuthorizedDevices();
            setAuthorizedDevices(devices);

            if (authorized) {
                const info = getDeviceInfo();
                setOperator({
                    deviceId: id,
                    isPrimaryDevice: info.isPrimaryDevice,
                    registeredAt: new Date().toISOString(),
                });
                console.log('[Auth] Device authenticated:', id);
            } else {
                console.log('[Auth] Device not authorized:', id);
            }

            setLoading(false);
        };

        checkDevice();
    }, []);

    const registerThisDevice = () => {
        registerDevice();
        setIsAuthenticated(true);
        setAuthorizedDevices(getAuthorizedDevices());
        const info = getDeviceInfo();
        setOperator({
            deviceId: info.deviceId,
            isPrimaryDevice: info.isPrimaryDevice,
            registeredAt: new Date().toISOString(),
        });
    };

    const revokeDeviceById = (id: string) => {
        revokeDevice(id);
        setAuthorizedDevices(getAuthorizedDevices());
        // If we revoked our own device, update auth state
        if (id === deviceId) {
            setIsAuthenticated(false);
            setOperator(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                operator,
                isAuthenticated,
                loading,
                deviceId,
                authorizedDevices,
                registerThisDevice,
                revokeDeviceById,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
