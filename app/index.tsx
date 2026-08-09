import React from 'react';
import { Redirect } from 'expo-router';
import { useStore } from '../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
    const { hasHydrated, isAuthChecked, hasSeenOnboarding, isAuthenticated } = useStore(useShallow(state => ({
        hasHydrated: state.hasHydrated,
        isAuthChecked: state.isAuthChecked,
        hasSeenOnboarding: state.hasSeenOnboarding,
        isAuthenticated: state.isAuthenticated,
    })));

    if (!hasHydrated || !isAuthChecked) {
        return null;
    }

    // 1. If never seen onboarding, go there first
    if (!hasSeenOnboarding) {
        return <Redirect href="/onboarding" />;
    }

    // 2. If not logged in, go to login / auth screen (guest play supported)
    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    // 3. Go straight to home
    return <Redirect href="/(tabs)" />;
}

