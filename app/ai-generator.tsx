import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, StatusBar, KeyboardAvoidingView,
    Platform, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles } from '../src/constants/glass';
import { useStore } from '../src/store/useStore';
import { MOOD_PRESETS, generateAIDare, MoodPreset } from '../src/services/aiDareService';
import { rateAiDare } from '../src/services/api';
import { DareCard } from '../src/constants/cards';

const BG_COLORS = ['#FFF5F5', '#FFF0F5', '#F5F3FF', '#FFF8F0'];

export default function AIDareGeneratorScreen() {
    const router = useRouter();
    const { partner1, partner2, setActiveCustomCard, showAlert, isPro } = useStore();

    const [selectedMood, setSelectedMood] = useState<string>('massage');
    const [intensity, setIntensity] = useState<number>(2);
    const [customScenario, setCustomScenario] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generatedDare, setGeneratedDare] = useState<DareCard | null>(null);
    const [savedToFavs, setSavedToFavs] = useState<boolean>(false);
    const [dareRating, setDareRating] = useState<-1 | 0 | 1>(0);

    const activePreset = MOOD_PRESETS.find(m => m.key === selectedMood) || MOOD_PRESETS[0];

    const handleSelectMood = (preset: MoodPreset) => {
        Haptics.selectionAsync();
        setSelectedMood(preset.key);
        setIntensity(preset.intensity);
    };

    const handleGenerate = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsGenerating(true);
        setSavedToFavs(false);
        setDareRating(0);

        try {
            const dare = await generateAIDare({
                prompt: customScenario,
                mood: selectedMood,
                vibe: activePreset.vibe,
                intensity,
                partner1: partner1 || 'Partner 1',
                partner2: partner2 || 'Partner 2',
            });
            setGeneratedDare(dare);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            showAlert('Generation Failed', 'Please try again in a moment.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRate = async (rating: -1 | 1) => {
        if (!generatedDare?.remoteId) return;
        const next = dareRating === rating ? 0 : rating; // toggle off if same
        setDareRating(next);
        Haptics.selectionAsync().catch(() => {});
        try {
            await rateAiDare(generatedDare.remoteId, next);
        } catch (e) {
            // Non-blocking: revert on failure
            setDareRating(dareRating);
        }
    };

    const handlePlayNow = () => {
        if (!generatedDare) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setActiveCustomCard(generatedDare);
        router.push('/(tabs)');
    };

    const handleSaveFavorite = () => {
        if (!generatedDare || savedToFavs) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSavedToFavs(true);
        showAlert('Saved to Favorites! ❤️', 'You can find this custom dare anytime in your deck collection.');
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
                <StatusBar barStyle="dark-content" />

                {/* Header */}
                <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, glassStyles.header]}>
                    <TouchableOpacity
                        style={[styles.backBtn, glassStyles.container]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(tabs)');
                            }
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-back" size={20} color="#1A1A2E" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleWrap}>
                        <Text style={styles.headerTitle}>AI Dare Studio ✨</Text>
                        <Text style={styles.headerSubtitle}>Tailored dares crafted for {partner1 || 'You'} & {partner2 || 'Partner'}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </Animated.View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        style={styles.scrollArea}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* ── Generated Result Showcase (if exists) ── */}
                        {generatedDare && (
                            <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.resultCardWrap}>
                                <LinearGradient
                                    colors={['rgba(255, 107, 53, 0.12)', 'rgba(236, 72, 153, 0.15)']}
                                    style={[styles.resultCard, glassStyles.container]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.resultHeader}>
                                        <View style={styles.resultBadge}>
                                            <Ionicons name="sparkles" size={14} color="#FF6B35" />
                                            <Text style={styles.resultBadgeText}>AI CUSTOM DARE</Text>
                                        </View>
                                        <View style={styles.intensityBadge}>
                                            <Text style={styles.intensityBadgeText}>
                                                {'🔥'.repeat(generatedDare.intensity || 1)} Level {generatedDare.intensity}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.resultText}>{generatedDare.text}</Text>

                                    {generatedDare.timer && (
                                        <View style={styles.timerBadge}>
                                            <Ionicons name="time-outline" size={14} color="#FF6B35" />
                                            <Text style={styles.timerBadgeText}>{generatedDare.timer}s countdown</Text>
                                        </View>
                                    )}

                                    {generatedDare.remoteId && (
                                        <View style={styles.rateRow}>
                                            <Text style={styles.rateLabel}>Rate this dare</Text>
                                            <TouchableOpacity
                                                style={[styles.rateBtn, dareRating === 1 && styles.rateBtnUp]}
                                                onPress={() => handleRate(1)}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name={dareRating === 1 ? 'thumbs-up' : 'thumbs-up-outline'} size={18} color={dareRating === 1 ? '#10B981' : '#666'} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.rateBtn, dareRating === -1 && styles.rateBtnDown]}
                                                onPress={() => handleRate(-1)}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name={dareRating === -1 ? 'thumbs-down' : 'thumbs-down-outline'} size={18} color={dareRating === -1 ? '#EF4444' : '#666'} />
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    <View style={styles.resultActionRow}>
                                        <TouchableOpacity
                                            style={styles.playNowBtn}
                                            onPress={handlePlayNow}
                                            activeOpacity={0.85}
                                        >
                                            <LinearGradient
                                                colors={['#FF6B35', '#EC4899']}
                                                style={styles.playNowGradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                            >
                                                <Ionicons name="play" size={18} color="#FFF" />
                                                <Text style={styles.playNowText}>Play This Dare Now</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.iconBtn, glassStyles.container, savedToFavs && { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}
                                            onPress={handleSaveFavorite}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name={savedToFavs ? "heart" : "heart-outline"}
                                                size={22}
                                                color={savedToFavs ? "#EC4899" : "#666"}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                            </Animated.View>
                        )}

                        {/* ── Choose Mood Section ── */}
                        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
                            <Text style={styles.sectionTitle}>1. CHOOSE MOOD / VIBE</Text>
                            <View style={styles.moodGrid}>
                                {MOOD_PRESETS.map((preset) => {
                                    const selected = selectedMood === preset.key;
                                    return (
                                        <TouchableOpacity
                                            key={preset.key}
                                            style={[
                                                styles.moodCard,
                                                glassStyles.container,
                                                selected && styles.moodCardActive
                                            ]}
                                            onPress={() => handleSelectMood(preset)}
                                            activeOpacity={0.75}
                                        >
                                            <Text style={styles.moodEmoji}>{preset.emoji}</Text>
                                            <Text style={[styles.moodLabel, selected && styles.moodLabelActive]}>
                                                {preset.label}
                                            </Text>
                                            <Text style={styles.moodDesc} numberOfLines={1}>
                                                {preset.description}
                                            </Text>
                                            {selected && (
                                                <View style={styles.checkIcon}>
                                                    <Ionicons name="checkmark-circle" size={16} color="#FF6B35" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </Animated.View>

                        {/* ── Intensity Slider ── */}
                        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
                            <Text style={styles.sectionTitle}>2. HEAT / INTENSITY</Text>
                            <View style={styles.intensityRow}>
                                {[
                                    { level: 1, label: 'Mild & Sweet', emoji: '🌱' },
                                    { level: 2, label: 'Spicy & Teasing', emoji: '🔥' },
                                    { level: 3, label: 'Wild & Passionate', emoji: '🌶️' },
                                ].map((item) => {
                                    const active = intensity === item.level;
                                    return (
                                        <TouchableOpacity
                                            key={item.level}
                                            style={[
                                                styles.intensityPill,
                                                glassStyles.container,
                                                active && styles.intensityPillActive
                                            ]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setIntensity(item.level);
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.intensityEmoji}>{item.emoji}</Text>
                                            <Text style={[styles.intensityLabel, active && styles.intensityLabelActive]}>
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </Animated.View>

                        {/* ── Custom Scenario Input (Optional) ── */}
                        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>3. CUSTOM SCENARIO (OPTIONAL)</Text>
                                <Text style={styles.sectionOptional}>Describe a scene</Text>
                            </View>
                            <View style={[styles.inputBox, glassStyles.container]}>
                                <TextInput
                                    style={styles.textInput}
                                    value={customScenario}
                                    onChangeText={setCustomScenario}
                                    placeholder="e.g., We are having late night dessert in bed, or tease with ice cubes..."
                                    placeholderTextColor="#9CA3AF"
                                    multiline
                                    maxLength={150}
                                />
                                <Ionicons name="create-outline" size={18} color="#9CA3AF" style={{ alignSelf: 'flex-end', marginTop: 4 }} />
                            </View>
                        </Animated.View>

                        {/* ── Generate Action Button ── */}
                        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
                            <TouchableOpacity
                                style={styles.generateBtn}
                                onPress={handleGenerate}
                                disabled={isGenerating}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={['#FF6B35', '#EC4899', '#8B5CF6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.generateGradient}
                                >
                                    {isGenerating ? (
                                        <ActivityIndicator color="#FFF" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="sparkles" size={22} color="#FFF" />
                                            <Text style={styles.generateBtnText}>
                                                {generatedDare ? 'Regenerate Another Dare ✨' : 'Generate AI Dare ✨'}
                                            </Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        <View style={{ height: 60 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    headerTitleWrap: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A2E',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    resultCardWrap: {
        marginBottom: 20,
    },
    resultCard: {
        padding: 20,
        borderRadius: 24,
        borderColor: 'rgba(255, 107, 53, 0.4)',
        borderWidth: 1.5,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    resultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    resultBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FF6B35',
        letterSpacing: 0.5,
    },
    intensityBadge: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    intensityBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
    },
    resultText: {
        fontSize: 18,
        lineHeight: 26,
        fontWeight: '700',
        color: '#1A1A2E',
        marginVertical: 10,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        marginBottom: 16,
    },
    timerBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FF6B35',
    },
    rateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    rateLabel: {
        flex: 1,
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
    },
    rateBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    rateBtnUp: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    rateBtnDown: {
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    resultActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    playNowBtn: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    playNowGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    playNowText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '800',
    },
    iconBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    section: {
        marginBottom: 20,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6B7280',
        letterSpacing: 0.5,
        marginBottom: 10,
        marginLeft: 4,
    },
    sectionOptional: {
        fontSize: 11,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    moodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    moodCard: {
        width: '48%',
        padding: 14,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.6)',
        position: 'relative',
    },
    moodCardActive: {
        borderColor: '#FF6B35',
        borderWidth: 1.5,
        backgroundColor: 'rgba(255, 107, 53, 0.08)',
    },
    moodEmoji: {
        fontSize: 26,
        marginBottom: 6,
    },
    moodLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A2E',
        marginBottom: 2,
    },
    moodLabelActive: {
        color: '#FF6B35',
    },
    moodDesc: {
        fontSize: 11,
        color: '#6B7280',
    },
    checkIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    intensityRow: {
        flexDirection: 'row',
        gap: 8,
    },
    intensityPill: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    intensityPillActive: {
        borderColor: '#FF6B35',
        borderWidth: 1.5,
        backgroundColor: 'rgba(255, 107, 53, 0.08)',
    },
    intensityEmoji: {
        fontSize: 20,
        marginBottom: 4,
    },
    intensityLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4B5563',
        textAlign: 'center',
    },
    intensityLabelActive: {
        color: '#FF6B35',
    },
    inputBox: {
        padding: 14,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.65)',
    },
    textInput: {
        fontSize: 14,
        color: '#1A1A2E',
        minHeight: 60,
        textAlignVertical: 'top',
    },
    generateBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 6,
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
    },
    generateGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    generateBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});
