import { Redirect } from 'expo-router';
import { useStore } from '../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
    const { hasHydrated, isAuthChecked, hasSeenOnboarding, isAuthenticated, partner1 } = useStore(useShallow(state => ({
        hasHydrated: state.hasHydrated,
        isAuthChecked: state.isAuthChecked,
        hasSeenOnboarding: state.hasSeenOnboarding,
        isAuthenticated: state.isAuthenticated,
        partner1: state.partner1
    })));

    const hasSeenSubscription = useStore(state => state.hasSeenSubscription);
    const isPro = useStore(state => state.isPro);

    if (!hasHydrated || !isAuthChecked) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C000B' }} edges={['top', 'left', 'right']}>
                <ActivityIndicator size="large" color="#FF1493" />
            </SafeAreaView>
        );
    }

    // 1. If never seen onboarding, go there first
    if (!hasSeenOnboarding) {
        return <Redirect href="/onboarding" />;
    }

    // 2. If names not entered yet, go to welcome (before login)
    if (!partner1) {
        return <Redirect href="/welcome" />;
    }

    // 3. If names done but not logged in, go to login
    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    // 4. Go straight to home; home will show the paywall popup if needed
    return <Redirect href="/(tabs)" />;
}

