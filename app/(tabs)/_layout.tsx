import React, { useEffect } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/useStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import SafeScreen from '../../src/components/SafeScreen';

function TabIcon({ name, focused, color }: { name: any, focused: boolean, color: string }) {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withSpring(focused ? 1.2 : 1, {
            damping: 12,
            stiffness: 200,
        });
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Ionicons name={focused ? name : `${name}-outline`} size={22} color={color} />
        </Animated.View>
    );
}

/**
 * Wraps a tab screen's component with a SafeScreen error boundary.
 * This ensures that if a single tab crashes, only that tab shows the
 * recovery UI — the rest of the app continues working normally.
 */
function withSafeScreen(ScreenComponent: React.ComponentType, screenName: string) {
    return function SafeWrappedScreen(props: any) {
        return (
            <SafeScreen name={screenName}>
                <ScreenComponent {...props} />
            </SafeScreen>
        );
    };
}

export default function TabLayout() {
    const roomId = useStore(state => state.roomId);
    const pathname = usePathname();
    const insets = useSafeAreaInsets();

    // Only hide tab bar when in an active room AND on the LDR screen
    const isLdrActive = !!roomId && pathname.includes('ldr');

    const bottomInset = Math.max(insets.bottom, 8);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                // Only use the dark background for LDR tab if roomId exists
                // We'll use a transparent sceneStyle or handle it per-tab
                sceneStyle: { backgroundColor: '#F8F4F4' },
                tabBarStyle: isLdrActive
                    ? { display: 'none' as const, height: 0, overflow: 'hidden' as const }
                    : {
                        position: 'absolute',
                        bottom: bottomInset > 0 ? bottomInset : 24,
                        left: 24,
                        right: 24,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderTopWidth: 0,
                        height: 64,
                        paddingBottom: 0,
                        paddingTop: 0,
                        elevation: 15,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.1,
                        shadowRadius: 25,
                        borderRadius: 32,
                    },
                tabBarActiveTintColor: '#FF6B35',
                tabBarInactiveTintColor: '#999999',
                tabBarShowLabel: false,
                tabBarItemStyle: {
                    justifyContent: 'center',
                    alignItems: 'center',
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => <TabIcon name="home" focused={focused} color={color} />,
                }}
            />

            <Tabs.Screen
                name="daily"
                options={{
                    title: 'Daily',
                    tabBarIcon: ({ color, focused }) => <TabIcon name="flame" focused={focused} color={color} />,
                }}
            />

            <Tabs.Screen
                name="ldr"
                options={{
                    title: 'LDR',
                    tabBarIcon: ({ color, focused }) => <TabIcon name="heart" focused={focused} color={color} />,
                }}
            />
            <Tabs.Screen
                name="shop"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="pro"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => <TabIcon name="person-circle" focused={focused} color={color} />,
                }}
            />
            <Tabs.Screen
                name="chats"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
