import React from 'react';
import { Redirect } from 'expo-router';
import { useStore } from '../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
    const { hasHydrated, isAuthChecked, isAuthenticated, gender, relationshipStatus, appPurpose, partner1 } = useStore(useShallow(state => ({
        hasHydrated: state.hasHydrated,
        isAuthChecked: state.isAuthChecked,
        isAuthenticated: state.isAuthenticated,
        gender: state.gender,
        relationshipStatus: state.relationshipStatus,
        appPurpose: state.appPurpose,
        partner1: state.partner1,
    })));

    if (!hasHydrated || !isAuthChecked) {
        return null;
    }

    // 1. If not logged in, go to intro screen
    if (!isAuthenticated) {
        return <Redirect href="/intro" />;
    }

    // 2. If logged in but missing partner setup names:
    if (!partner1) {
        if (!gender || !relationshipStatus || !appPurpose) {
            return <Redirect href="/onboarding" />;
        }
        return <Redirect href="/welcome" />;
    }

    // 3. Go straight to home
    return <Redirect href="/(tabs)" />;
}

