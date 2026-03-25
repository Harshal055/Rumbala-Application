import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { Platform } from 'react-native';

interface AnimatedBackgroundProps {
    colors: string[];
    style?: any;
    intensity?: 'low' | 'medium' | 'high';
    children?: React.ReactNode;
}

export default function AnimatedBackground({
    colors,
    style,
    intensity = 'medium',
    children,
}: AnimatedBackgroundProps) {
    const animation = useSharedValue(0);

    useEffect(() => {
        animation.value = withRepeat(
            withSequence(
                withTiming(1, {
                    duration: 6000,
                    easing: Easing.inOut(Easing.ease),
                }),
                withTiming(0, {
                    duration: 6000,
                    easing: Easing.inOut(Easing.ease),
                })
            ),
            -1,
            true
        );
    }, []);

    const getFloatingElementCount = () => {
        switch (intensity) {
            case 'low':
                return 3;
            case 'high':
                return Platform.OS === 'android' ? 4 : 8;
            default:
                return Platform.OS === 'android' ? 3 : 5;
        }
    };

    const getDuration = () => {
        switch (intensity) {
            case 'low':
                return 8000;
            case 'high':
                return 4000;
            default:
                return 6000;
        }
    };

    return (
        <LinearGradient colors={colors as unknown as readonly [string, string, ...string[]]} style={[styles.container, style]}>
            {/* Animated floating orbs/circles */}
            {Array.from({ length: getFloatingElementCount() }).map((_, index) => {
                const delay = index * 1000;
                const size = 50 + (index % 3) * 40;
                const duration = getDuration();

                return (
                    <FloatingOrb
                        key={`orb-${index}`}
                        size={size}
                        duration={duration}
                        delay={delay}
                        opacity={0.1 + (index % 3) * 0.05}
                    />
                );
            })}

            {children}
        </LinearGradient>
    );
}

interface FloatingOrbProps {
    size: number;
    duration: number;
    delay: number;
    opacity: number;
}

function FloatingOrb({ size, duration, delay, opacity }: FloatingOrbProps) {
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const rotation = useSharedValue(0);

    useEffect(() => {
        const randomY = Math.random() * 200 - 100;
        const randomX = Math.random() * 150 - 75;

        setTimeout(() => {
            translateY.value = withRepeat(
                withSequence(
                    withTiming(randomY, { duration, easing: Easing.sin }),
                    withTiming(0, { duration, easing: Easing.sin })
                ),
                -1,
                true
            );

            translateX.value = withRepeat(
                withSequence(
                    withTiming(randomX, { duration: duration * 1.5, easing: Easing.sin }),
                    withTiming(0, { duration: duration * 1.5, easing: Easing.sin })
                ),
                -1,
                true
            );

            rotation.value = withRepeat(
                withTiming(360, { duration: duration * 2, easing: Easing.linear }),
                -1,
                false
            );
        }, delay);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { rotate: `${rotation.value}deg` },
        ],
    }));

    return (
        <Animated.View
            renderToHardwareTextureAndroid={true}
            style={[
                styles.orb,
                {
                    width: size,
                    height: size,
                    opacity,
                },
                animatedStyle,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    orb: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
});

