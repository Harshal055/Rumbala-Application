import React, { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { Quicksand_300Light, Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { useColorScheme } from 'react-native';
import { theme } from '../src/constants/theme';
import { useStore } from '../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import * as WebBrowser from 'expo-web-browser';
import { initRevenueCat, getCustomerInfo, checkProEntitlement } from '../src/services/revenueCatService';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomAlert from '../src/components/CustomAlert';
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
    const { hydrate } = useStore(useShallow(state => ({
        hydrate: state.hydrate,
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
            // 1. Restore local state and initialize RevenueCat in parallel
            const store = useStore.getState();
            const [_, rcReady] = await Promise.all([
                hydrate(),
                initRevenueCat(store.userId || undefined),
            ]);
            
            const userId = useStore.getState().userId;

            // 2. Flush any pending crash reports from previous sessions
            flushPendingCrashReports().catch(() => {});

            // 3. Verify real Pro status from RevenueCat (overrides AsyncStorage cache)
            if (store.isAuthenticated) {
                try {
                    const customerInfo = await getCustomerInfo();
                    const isReallyPro = checkProEntitlement(customerInfo);

                    if (isReallyPro !== store.isPro) {
                        store.setIsPro(isReallyPro);
                    }
                } catch (e) {
                    // RC not reachable — keep last known state
                }

                // 4. Load card count & scores from Supabase for logged-in users
                if (userId) {
                    try {
                        await store.loadCardsFromSupabase(userId);
                        await store.loadScoresFromSupabase(userId);
                    } catch (e) {
                        // Supabase not reachable — keep cached values
                    }
                }
            }
            // 5. Initialize daily notifications
            try {
                await initNotifications();
            } catch (e) {
                if (__DEV__) console.warn('Notification init failed:', e);
            }
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
    }, []);



    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

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
                        <Stack.Screen name="login" />
                        <Stack.Screen name="signup" />
                        <Stack.Screen name="welcome" />
                        <Stack.Screen name="(tabs)" />
                    </Stack>
                    <CustomAlert />
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </ErrorBoundary>
    );
}

