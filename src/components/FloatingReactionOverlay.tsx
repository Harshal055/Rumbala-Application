import React, { useEffect, useRef, useState, memo } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

export interface ReactionParticle {
    id: string;
    emoji: string;
    senderName?: string;
    startX: number; // percentage (0 - 100)
}

interface ParticleItemProps {
    particle: ReactionParticle;
    onComplete: (id: string) => void;
}

const ParticleItem = memo(({ particle, onComplete }: ParticleItemProps) => {
    const animY = useRef(new Animated.Value(0)).current;
    const animOpacity = useRef(new Animated.Value(1)).current;
    const animScale = useRef(new Animated.Value(0.4)).current;
    const animWobble = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const driftDirection = Math.random() > 0.5 ? 1 : -1;
        const driftAmount = (15 + Math.random() * 25) * driftDirection;

        Animated.parallel([
            // Float upward
            Animated.timing(animY, {
                toValue: -220,
                duration: 2200,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            // Wobble sideways
            Animated.sequence([
                Animated.timing(animWobble, {
                    toValue: driftAmount,
                    duration: 1100,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(animWobble, {
                    toValue: -driftAmount * 0.5,
                    duration: 1100,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
            // Scale pop-in and grow
            Animated.sequence([
                Animated.spring(animScale, {
                    toValue: 1.3,
                    friction: 4,
                    tension: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(animScale, {
                    toValue: 1.0,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ]),
            // Fade out towards the top
            Animated.sequence([
                Animated.delay(1300),
                Animated.timing(animOpacity, {
                    toValue: 0,
                    duration: 900,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            onComplete(particle.id);
        });
    }, [animOpacity, animScale, animWobble, animY, onComplete, particle.id]);

    return (
        <Animated.View
            style={[
                styles.particleWrapper,
                {
                    left: `${particle.startX}%`,
                    opacity: animOpacity,
                    transform: [
                        { translateY: animY },
                        { translateX: animWobble },
                        { scale: animScale },
                    ],
                },
            ]}
            pointerEvents="none"
        >
            <Text style={styles.emojiText}>{particle.emoji}</Text>
            {particle.senderName ? (
                <View style={styles.senderBadge}>
                    <Text style={styles.senderText}>{particle.senderName}</Text>
                </View>
            ) : null}
        </Animated.View>
    );
});

export interface FloatingReactionOverlayHandle {
    addReaction: (emoji: string, senderName?: string) => void;
}

export function FloatingReactionOverlay({
    particles,
    onParticleComplete,
}: {
    particles: ReactionParticle[];
    onParticleComplete: (id: string) => void;
}) {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {particles.map((p) => (
                <ParticleItem
                    key={p.id}
                    particle={p}
                    onComplete={onParticleComplete}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    particleWrapper: {
        position: 'absolute',
        bottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    emojiText: {
        fontSize: 34,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    senderBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 2,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    senderText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '700',
    },
});
