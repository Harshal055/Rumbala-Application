import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { useNetworkStatus } from '../services/networkMonitor';

export default function OfflineBanner() {
    const insets = useSafeAreaInsets();
    const { isOnline, wasOffline, clearWasOffline } = useNetworkStatus();

    const translateY = useSharedValue(-80);
    const opacity = useSharedValue(0);

    const isVisible = !isOnline || wasOffline;

    useEffect(() => {
        if (isVisible) {
            translateY.value = withSpring(0, { damping: 15, stiffness: 180 });
            opacity.value = withTiming(1, { duration: 250 });

            // If back online, auto dismiss after 2.5 seconds
            if (isOnline && wasOffline) {
                const dismissTimer = setTimeout(() => {
                    translateY.value = withTiming(-80, { duration: 300, easing: Easing.in(Easing.ease) });
                    opacity.value = withTiming(0, { duration: 250 });
                    const cleanupTimer = setTimeout(() => {
                        clearWasOffline();
                    }, 300);
                    return () => clearTimeout(cleanupTimer);
                }, 2500);
                return () => clearTimeout(dismissTimer);
            }
        } else {
            translateY.value = withTiming(-80, { duration: 250 });
            opacity.value = withTiming(0, { duration: 200 });
        }
    }, [isVisible, isOnline, wasOffline]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    if (!isVisible && opacity.value === 0) {
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
                animatedStyle,
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
