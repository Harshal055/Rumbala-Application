import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../services/networkMonitor';

export default function OfflineBanner() {
    const insets = useSafeAreaInsets();
    const { isOnline, wasOffline, clearWasOffline } = useNetworkStatus();

    const translateY = useRef(new Animated.Value(-80)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const isVisible = !isOnline || wasOffline;

    useEffect(() => {
        let dismissTimer: ReturnType<typeof setTimeout> | null = null;

        if (isVisible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    damping: 15,
                    mass: 1,
                    stiffness: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();

            // If back online, auto dismiss after 2.5 seconds
            if (isOnline && wasOffline) {
                dismissTimer = setTimeout(() => {
                    Animated.parallel([
                        Animated.timing(translateY, {
                            toValue: -80,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        clearWasOffline();
                    });
                }, 2500);
            }
        } else {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -80,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }

        return () => {
            if (dismissTimer) clearTimeout(dismissTimer);
        };
    }, [isVisible, isOnline, wasOffline, clearWasOffline, translateY, opacity]);

    if (!isVisible) {
        return null;
    }

    const topPosition = Math.max(insets.top, 12) + 6;
    const isRestored = isOnline && wasOffline;

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.container,
                { top: topPosition },
                {
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <View style={[styles.pill, isRestored ? styles.onlinePill : styles.offlinePill]}>
                <Ionicons
                    name={isRestored ? 'checkmark-circle' : 'cloud-offline'}
                    size={15}
                    color={isRestored ? '#34D399' : '#FBBF24'}
                />
                <Text style={styles.bannerText}>
                    {isRestored ? 'Back online' : 'Offline • Playing with saved cards'}
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 8,
    },
    offlinePill: {
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.4)',
    },
    onlinePill: {
        backgroundColor: '#064E3B',
        borderWidth: 1,
        borderColor: 'rgba(52, 211, 153, 0.5)',
    },
    bannerText: {
        color: '#FFFFFF',
        fontSize: 12.5,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
});
