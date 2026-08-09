import React, { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { Quicksand_300Light, Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { useColorScheme, AppState } from 'react-native';
import { theme } from '../src/constants/theme';
import { useStore } from '../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import * as WebBrowser from 'expo-web-browser';
import { initRevenueCat, getCustomerInfo, getProEntitlementDetails } from '../src/services/revenueCatService';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomAlert from '../src/components/CustomAlert';
import MaintenanceOverlay from '../src/components/MaintenanceOverlay';
import UpdateOverlay from '../src/components/UpdateOverlay';
import { initNotifications } from '../src/services/notificationService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { initGlobalErrorHandlers, flushPendingCrashReports } from '../src/services/crashReporter';

// Required for Google OAuth redirect handling
WebBrowser.maybeCompleteAuthSession();

// Prevent auto hide of splash screen
SplashScreen.preventAutoHideAsync();

// Install global JS error & promise rejection handlers immediately
initGlobalErrorHandlers();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { hydrate, hasHydrated } = useStore(useShallow(state => ({
        hydrate: state.hydrate,
        hasHydrated: state.hasHydrated,
    })));

    const [fontsLoaded, fontError] = useFonts({
        Pacifico_400Regular,
        Quicksand_300Light,
        Quicksand_400Regular,
        Quicksand_500Medium,
        Quicksand_600SemiBold,
        Quicksand_700Bold,
    });

    useEffect(() => {
        const initApp = async () => {
            // 1. Instantly restore local state (<10ms)
            await hydrate();

            // 2. Run heavy network, RevenueCat, and Supabase tasks in parallel background
            (async () => {
                try {
                    const store = useStore.getState();
                    await initRevenueCat(store.userId || undefined);
                    flushPendingCrashReports().catch(() => {});

                    // Verify Pro status from RevenueCat and Supabase
                    try {
                        const customerInfo = await getCustomerInfo();
                        const rcPro = getProEntitlementDetails(customerInfo);
                        if (rcPro.isPro) {
                            store.setIsPro(true, rcPro.expiresAt);
                            if (store.userId) {
                                const api = await import('../src/services/api');
                                api.syncProStatusToBackend(store.userId, true, rcPro.expiresAt).catch(() => {});
                            }
                        }
                    } catch {}

                    // Background sync with Supabase (restores admin grants, promo codes, card counts)
                    if (store.isAuthenticated && store.userId) {
                        try {
                            await Promise.all([
                                store.syncWithSupabase(),
                                store.loadCardsFromSupabase(store.userId),
                                store.loadScoresFromSupabase(store.userId),
                                store.fetchCards(),
                            ]);
                        } catch {}
                    } else {
                        store.fetchCards().catch(() => {});
                    }

                    // Background initialize notifications
                    initNotifications().catch(() => {});
                } catch (e) {
                    if (__DEV__) console.warn('Background init task error:', e);
                }
            })();
        };

        initApp().catch((e) => {
            if (__DEV__) console.error('App init failed:', e);
        });

        // 6. Listen for Global Auth State Changes (Supabase)
        // This ensures the store stays in sync if session expires or user logs in/out
        import('../src/services/supabase').then(({ supabase }) => {
            supabase.auth.onAuthStateChange(async (event, session) => {
                try {
                    const store = useStore.getState();

                    // If we get a session, sync everything
                    if (session?.user) {
                        if (store.userId !== session.user.id || !store.isAuthenticated) {
                            store.setUserId(session.user.id);
                            await store.syncWithSupabase();
                        }
                    } else if (event === 'SIGNED_OUT') {
                        // Only logout if it's an explicit sign out event
                        if (store.isAuthenticated) {
                            store.logout();
                        }
                    }
                } catch (e) {
                    if (__DEV__) console.warn('Auth state change error:', e);
                }
            });
        }).catch((e) => {
            if (__DEV__) console.warn('Supabase import failed:', e);
        });

        // 7. Foreground Resume Sync (AppState)
        // When user switches back into app, instantly re-sync remote configs & pro status
        const subAppState = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                const store = useStore.getState();
                store.fetchRemoteConfigs().catch(() => {});
                if (store.isAuthenticated && store.userId) {
                    store.syncWithSupabase().catch(() => {});
                    store.setupRealtimeListeners();
                }
            }
        });

        return () => {
            subAppState.remove();
        };
    }, []);



    useEffect(() => {
        let isMounted = true;
        const hideSplash = () => {
            SplashScreen.hideAsync().catch(() => {});
        };

        if ((fontsLoaded || fontError) && hasHydrated) {
            hideSplash();
        }

        // Safety fallback: Never keep splash screen visible longer than 1000ms
        const timer = setTimeout(() => {
            if (isMounted) hideSplash();
        }, 1000);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [fontsLoaded, fontError, hasHydrated]);

    // Always render the Stack — never return null.
    // SplashScreen covers the UI while fonts/hydration are loading.
    return (
        <ErrorBoundary>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: isDark ? theme.colors.dark.background : theme.colors.light.background },
                            animation: 'fade',
                        }}
                    >
                        <Stack.Screen name="index" />
                        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
                        <Stack.Screen name="login" options={{ animation: 'slide_from_right' }} />
                        <Stack.Screen name="signup" options={{ animation: 'slide_from_right' }} />
                        <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right' }} />
                        <Stack.Screen name="verify-otp" options={{ animation: 'slide_from_right' }} />
                        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
                        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                        <Stack.Screen name="ai-generator" options={{ animation: 'slide_from_right', presentation: 'card' }} />
                        <Stack.Screen name="quiz" options={{ animation: 'slide_from_right', presentation: 'card' }} />
                        <Stack.Screen name="subscription" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
                        <Stack.Screen name="admin" options={{ animation: 'slide_from_right', presentation: 'card' }} />
                        <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right', presentation: 'card' }} />
                    </Stack>
                    <MaintenanceOverlay />
                    <UpdateOverlay />
                    <CustomAlert />
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </ErrorBoundary>
    );
}

