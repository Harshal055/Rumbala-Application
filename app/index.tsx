import React from 'react';
import { Redirect } from 'expo-router';
import { useStore } from '../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
    const { hasHydrated, isAuthChecked, isAuthenticated, gender, relationshipStatus, appPurpose } = useStore(useShallow(state => ({
        hasHydrated: state.hasHydrated,
        isAuthChecked: state.isAuthChecked,
        isAuthenticated: state.isAuthenticated,
        gender: state.gender,
        relationshipStatus: state.relationshipStatus,
        appPurpose: state.appPurpose,
    })));

    if (!hasHydrated || !isAuthChecked) {
        return null;
    }

    // 1. If not logged in, go to welcome screen (guest play or login)
    if (!isAuthenticated) {
        return <Redirect href="/welcome" />;
    }

    // 2. If logged in but hasn't completed the questionnaire, ask them now
    if (!gender || !relationshipStatus || !appPurpose) {
        return <Redirect href="/onboarding" />;
    }

    // 3. Go straight to home
    return <Redirect href="/(tabs)" />;
}

