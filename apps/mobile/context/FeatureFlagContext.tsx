import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { FEATURE_FLAGS, FeatureFlagKey } from '../config/featureFlags';

interface FeatureFlagContextType {
    flags: Record<string, boolean>;
    isLoading: boolean;
    isEnabled: (key: FeatureFlagKey | string) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
    // Fetch flags for 'mobile_home' group as well as 'system' group (global)
    // Ideally, valid usage would be to fetch ALL flags or specific groups relevant to mobile.
    // The existing query `api.featureFlags.get` accepts an optional group. 
    // If we pass nothing, it returns all. Let's fetch all to be safe and cover all use cases.
    const remoteFlags = useQuery(api.featureFlags.get);
    const [flags, setFlags] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (remoteFlags) {
            const newFlags: Record<string, boolean> = {};

            // Initialize with defaults
            (Object.keys(FEATURE_FLAGS) as FeatureFlagKey[]).forEach(key => {
                newFlags[key] = FEATURE_FLAGS[key];
            });

            // Override with remote values
            remoteFlags.forEach((flag: any) => {
                // The key from backend should match the keys in FEATURE_FLAGS
                if (flag.value !== undefined) {
                    newFlags[flag.key] = flag.value;
                }
            });

            setFlags(newFlags);
        } else {
            // Fallback to defaults if query hasn't loaded (or loading)
            // We might want to persist these to AsyncStorage for offline support later
            const defaultFlags: Record<string, boolean> = {};
            (Object.keys(FEATURE_FLAGS) as FeatureFlagKey[]).forEach(key => {
                defaultFlags[key] = FEATURE_FLAGS[key];
            });
            setFlags(defaultFlags);
        }
    }, [remoteFlags]);

    const isEnabled = (key: FeatureFlagKey | string) => {
        // If we have a specific value, return it. Otherwise default to the static config (safe fallback)
        // For dynamic keys not in static config, default to false if not found in flags
        if (key in flags) return flags[key];
        if (key in FEATURE_FLAGS) return FEATURE_FLAGS[key as FeatureFlagKey];
        return false;
    };

    return (
        <FeatureFlagContext.Provider value={{ flags, isLoading: remoteFlags === undefined, isEnabled }}>
            {children}
        </FeatureFlagContext.Provider>
    );
}

export const useFeatureFlag = () => {
    const context = useContext(FeatureFlagContext);
    if (context === undefined) {
        throw new Error('useFeatureFlag must be used within a FeatureFlagProvider');
    }
    return context;
};
