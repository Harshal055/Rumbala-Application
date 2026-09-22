import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Keyboard, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/useStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

function TabIcon({ name, focused, color }: { name: any; focused: boolean; color: string }) {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withSpring(focused ? 1.15 : 1, {
            damping: 14,
            stiffness: 220,
        });
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[styles.tabIconWrap, focused && styles.tabIconActiveWrap, animatedStyle]}>
            <Ionicons name={focused ? name : `${name}-outline`} size={24} color={color} />
        </Animated.View>
    );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const roomId = useStore(s => s.roomId);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // Hide tab bar when keyboard is open or in an active LDR call room
    const currentRoute = state.routes[state.index];
    if (keyboardVisible || (!!roomId && currentRoute?.name === 'ldr')) {
        return null;
    }

    // Hide tab bar on sub-screens that should not display the bottom bar
    const hiddenRoutes = ['shop', 'chats', 'settings', 'history'];
    if (currentRoute && hiddenRoutes.includes(currentRoute.name)) {
        return null;
    }

    // Only render tabs that have a defined tabBarIcon
    const visibleRoutes = state.routes.filter(route => {
        const { options } = descriptors[route.key];
        return typeof options?.tabBarIcon === 'function';
    });

    const bottomOffset = Math.max(insets.bottom, 16);

    return (
        <View style={[styles.tabBarContainer, { bottom: bottomOffset }]}>
            {visibleRoutes.map((route) => {
                const { options } = descriptors[route.key];
                const isFocused = currentRoute?.name === route.name;

                const onPress = () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarButtonTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={styles.tabButton}
                        activeOpacity={0.7}
                    >
                        {options.tabBarIcon?.({
                            focused: isFocused,
                            color: isFocused ? '#FF6B35' : '#8E8E93',
                            size: 24,
                        })}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                sceneStyle: { backgroundColor: '#F8F4F4' },
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

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        left: 20,
        right: 20,
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.06)',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
    },
    tabButton: {
        flex: 1,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabIconWrap: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
    },
    tabIconActiveWrap: {
        backgroundColor: 'rgba(255, 107, 53, 0.12)',
    },
});
