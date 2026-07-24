import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { DareCard } from '../constants/cards';


interface CardProps {
    card: DareCard;
    isFlipped?: boolean;
    onFlip?: () => void;
}

const CARD_THEMES: Record<string, {
    gradient: readonly [string, string, string];
    icon: string;
    label: string;
    accent: string;
}> = {
    fun: { gradient: ['#FFD93D', '#FF9800', '#FFB74D'] as const, icon: '🎉', label: 'FUN', accent: '#FF9800' },
    romantic: { gradient: ['#FF6B35', '#FB8C00', '#FFA726'] as const, icon: '💕', label: 'ROMANTIC', accent: '#FF6B35' },
    spicy: { gradient: ['#F4511E', '#D84315', '#BF360C'] as const, icon: '🔥', label: 'SPICY', accent: '#F4511E' },
    ldr: { gradient: ['#FF9800', '#FF6B35', '#E65100'] as const, icon: '🌍', label: 'LDR', accent: '#FF9800' },
};

export default function Card({ card, isFlipped = true, onFlip }: CardProps) {
    const flipAnim = useSharedValue(isFlipped ? 1 : 0);
    const scaleAnim = useSharedValue(0.92);
    const { width } = useWindowDimensions();

    const CARD_WIDTH = Math.min(Math.max(width * 0.82, 280), 420);
    const CARD_HEIGHT = CARD_WIDTH * 1.25;

    const theme = CARD_THEMES[card.type] || CARD_THEMES.fun;

    useEffect(() => {
        flipAnim.value = withTiming(isFlipped ? 1 : 0, { duration: 480 });
        scaleAnim.value = withTiming(isFlipped ? 1 : 0.93, { duration: 380 });
    }, [isFlipped]);

    const frontStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(flipAnim.value, [0, 1], [0, 180], Extrapolation.CLAMP);
        return {
            transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }, { scale: scaleAnim.value }],
            backfaceVisibility: 'hidden' as const,
        };
    });

    const backStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(flipAnim.value, [0, 1], [180, 360], Extrapolation.CLAMP);
        return {
            transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }, { scale: scaleAnim.value }],
            backfaceVisibility: 'hidden' as const,
        };
    });

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onFlip?.();
    };

    return (
        <Animated.View entering={require('react-native-reanimated').ZoomIn.springify().damping(14).stiffness(120)} style={[styles.container, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
            {/* BACK SIDE (card face-down / pre-flip) */}
            <Animated.View style={[styles.cardWrap, frontStyle]}>
                <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={{ flex: 1 }}>
                    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.cardBack} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        {/* Decorative pattern */}
                        <View style={styles.backPattern}>
                            <View style={styles.backCircle1} />
                            <View style={styles.backCircle2} />
                            <View style={styles.backCircle3} />
                        </View>

                        <Text style={styles.backIcon}>🃏</Text>
                        <Text style={styles.backTitle}>Rumbala</Text>
                        <Text style={styles.backHint}>Tap to reveal</Text>

                        {/* Corner decorations */}
                        <View style={[styles.corner, styles.cornerTL]}>
                            <Text style={styles.cornerText}>♠</Text>
                        </View>
                        <View style={[styles.corner, styles.cornerBR]}>
                            <Text style={styles.cornerText}>♠</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            {/* FRONT SIDE (card face-up / revealed) */}
            <Animated.View style={[styles.cardWrap, styles.absoluteCard, backStyle]}>
                <TouchableOpacity activeOpacity={0.95} onPress={handlePress} style={{ flex: 1 }}>
                    <View style={styles.cardFront}>
                        {/* Gradient header strip */}
                        <LinearGradient colors={theme.gradient} style={styles.headerStrip} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <View style={styles.headerContent}>
                                <View style={styles.typeBadge}>
                                    <Text style={styles.typeIcon}>{theme.icon}</Text>
                                    <Text style={styles.typeLabel}>
                                        {card.type === 'ldr' && card.vibe
                                            ? `LDR • ${card.vibe.toUpperCase()}`
                                            : theme.label
                                        }
                                    </Text>
                                </View>
                                {card.timer && (
                                    <View style={styles.timerBadge}>
                                        <Text style={styles.timerText}>⏱ {card.timer}s</Text>
                                    </View>
                                )}
                            </View>
                            {/* Decorative circles */}
                            <View style={styles.headerCircle1} />
                            <View style={styles.headerCircle2} />
                        </LinearGradient>

                        {/* Main dare content */}
                        <View style={styles.dareBody}>
                            <ScrollView
                                contentContainerStyle={[styles.scrollContent, { paddingHorizontal: CARD_WIDTH < 320 ? 18 : 24, paddingVertical: CARD_WIDTH < 320 ? 12 : 15 }]}
                                showsVerticalScrollIndicator={false}
                                centerContent={true}
                            >
                                <Text style={styles.dareIcon}>{theme.icon}</Text>
                                <Text style={styles.dareLabel}>Dare!</Text>
                                <Text style={[styles.dareText, { fontSize: CARD_WIDTH < 320 ? 17 : 19, lineHeight: CARD_WIDTH < 320 ? 24 : 28 }]}>{card.text}</Text>
                            </ScrollView>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <LinearGradient colors={theme.gradient} style={styles.xpBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Text style={styles.xpText}>+50 XP</Text>
                            </LinearGradient>
                            {onFlip && <Text style={styles.tapHint}>Tap to close</Text>}
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardWrap: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 0,
    },
    absoluteCard: {
        position: 'absolute',
        top: 0,
        left: 0,
    },

    // ── BACK SIDE ──
    // ── BACK SIDE ──
    cardBack: {
        flex: 1,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(26, 26, 46, 0.8)', // Glassy Dark
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    backPattern: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backCircle1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    backCircle2: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    backCircle3: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    backIcon: {
        fontSize: 64,
        marginBottom: 12,
        opacity: 0.9,
    },
    backTitle: {
        fontFamily: 'Pacifico_400Regular',
        fontSize: 32,
        color: '#fff',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    backHint: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    corner: {
        position: 'absolute',
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cornerTL: { top: 16, left: 16 },
    cornerBR: { bottom: 16, right: 16, transform: [{ rotate: '180deg' }] },
    cornerText: { fontSize: 18, color: 'rgba(255, 255, 255, 0.2)' },

    // ── FRONT SIDE ──
    cardFront: {
        flex: 1,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.85)', // Glassy White
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    headerStrip: {
        paddingTop: 24,
        paddingBottom: 20,
        paddingHorizontal: 20,
        overflow: 'hidden',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1,
    },
    headerCircle1: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        top: -40,
        right: -30,
    },
    headerCircle2: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        bottom: -30,
        left: 20,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    typeIcon: { fontSize: 16 },
    typeLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1.5,
    },
    timerBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    timerText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#fff',
    },

    dareBody: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dareIcon: {
        fontSize: 48,
        marginBottom: 8,
        opacity: 0.9,
    },
    dareLabel: {
        fontFamily: 'Pacifico_400Regular',
        fontSize: 28,
        color: '#1a1a1a',
        marginBottom: 12,
        opacity: 0.9,
    },
    dareText: {
        fontFamily: 'Quicksand_700Bold',
        color: '#333',
        textAlign: 'center',
    },

    footer: {
        alignItems: 'center',
        paddingBottom: 24,
        gap: 10,
    },
    xpBadge: {
        borderRadius: 24,
        paddingHorizontal: 28,
        paddingVertical: 10,
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 0,
    },
    xpText: {
        fontFamily: 'Quicksand_700Bold',
        fontSize: 15,
        color: '#fff',
        letterSpacing: 1,
    },
    tapHint: {
        fontSize: 12,
        color: '#999',
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
