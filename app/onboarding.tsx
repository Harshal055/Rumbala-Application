import React, { useState, useRef } from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet,
    Dimensions, ScrollView, NativeScrollEvent, NativeSyntheticEvent,
    StatusBar, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useStore } from '../src/store/useStore';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../src/constants/glass';

const { width } = Dimensions.get('window');

const BG_COLORS = ['#FEE2E2', '#FFEDD5', '#FEF3C7'];

interface OptionItem {
    id: string;
    label: string;
    desc?: string;
    icon: any;
    color?: string;
}

const GENDER_OPTIONS: OptionItem[] = [
    { id: 'male', label: 'Male', desc: 'Identify as male', icon: 'male-outline', color: '#3B82F6' },
    { id: 'female', label: 'Female', desc: 'Identify as female', icon: 'female-outline', color: '#EC4899' },
    { id: 'non-binary', label: 'Non-binary / Other', desc: 'Gender-fluid or non-conforming', icon: 'transgender-outline', color: '#8B5CF6' },
    { id: 'prefer_not_to_say', label: 'Prefer not to say', desc: 'Keep it private', icon: 'sparkles-outline', color: '#FF6B35' },
];

const RELATIONSHIP_OPTIONS: OptionItem[] = [
    { id: 'dating', label: 'In a Relationship / Dating', desc: 'Dating & building our romance', icon: 'heart', color: '#EC4899' },
    { id: 'married', label: 'Married / Engaged', desc: 'Deepening our lifelong bond', icon: 'diamond', color: '#F59E0B' },
    { id: 'ldr', label: 'Long Distance', desc: 'Connected across the miles', icon: 'airplane', color: '#3B82F6' },
    { id: 'single', label: 'Single', desc: 'Looking for icebreakers & fun future dares', icon: 'sparkles', color: '#10B981' },
    { id: 'complicated', label: 'It’s Complicated', desc: 'Exploring & casual play', icon: 'infinite', color: '#8B5CF6' },
];

const PURPOSE_OPTIONS: OptionItem[] = [
    { id: 'spice', label: 'Spice Up Romance & Passion', desc: 'Intimate dares, sensual romance & heat', icon: 'flame', color: '#EF4444' },
    { id: 'fun', label: 'Fun & Laughter', desc: 'Playful date night challenges & game party', icon: 'happy', color: '#F59E0B' },
    { id: 'deep', label: 'Deep Connection & Bonding', desc: 'Deep conversation starters & emotional bonding', icon: 'chatbubbles', color: '#8B5CF6' },
    { id: 'ldr', label: 'Stay Connected Long-Distance', desc: 'Real-time remote sessions & video dares', icon: 'globe', color: '#3B82F6' },
    { id: 'fantasies', label: 'Explore Fantasies & New Things', desc: 'Break routines & try exciting new adventures', icon: 'rocket', color: '#EC4899' },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { 
        setHasSeenOnboarding, 
        setOnboardingPreferences, 
        setSelectedVibe, 
        setMode,
        gender: savedGender,
        relationshipStatus: savedRel,
        appPurpose: savedPurpose 
    } = useStore();

    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);

    // Questionnaire local state
    const [selectedGender, setSelectedGender] = useState<string>(savedGender || '');
    const [selectedRel, setSelectedRel] = useState<string>(savedRel || '');
    const [selectedPurpose, setSelectedPurpose] = useState<string>(savedPurpose || '');

    const TOTAL_SLIDES = 3; // 0: Gender, 1: Relation, 2: Purpose

    const scrollToSlide = (index: number) => {
        scrollRef.current?.scrollTo({ x: index * width, animated: true });
        setActiveIndex(index);
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const x = event.nativeEvent.contentOffset.x;
        const index = Math.round(x / width);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        if (activeIndex < TOTAL_SLIDES - 1) {
            scrollToSlide(activeIndex + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        if (activeIndex > 0) {
            scrollToSlide(activeIndex - 1);
        }
    };

    const handleComplete = async () => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            
            // Save preferences
            setOnboardingPreferences({
                gender: selectedGender || 'prefer_not_to_say',
                relationshipStatus: selectedRel || 'dating',
                appPurpose: selectedPurpose || 'fun',
            });

            // Tailor default vibe/mode based on purpose
            if (selectedPurpose === 'spice') {
                setSelectedVibe('spicy');
            } else if (selectedPurpose === 'fun') {
                setSelectedVibe('fun');
            } else if (selectedPurpose === 'ldr' || selectedRel === 'ldr') {
                setMode('ldr');
                setSelectedVibe('romantic');
            } else {
                setSelectedVibe('romantic');
            }

            setHasSeenOnboarding(true);
            
            const state = useStore.getState();
            if (!state.isAuthenticated) {
                router.replace('/signup');
            } else if (!state.partner1) {
                router.replace('/welcome');
            } else if (state.isPro || state.hasSeenSubscription) {
                router.replace('/(tabs)');
            } else {
                router.replace('/subscription');
            }
        } catch (error) {
            console.error('Error during onboarding completion:', error);
        }
    };

    const currentQuizStep = activeIndex + 1; // 1, 2, or 3
    const canProceed = 
        (activeIndex === 0 && Boolean(selectedGender)) ||
        (activeIndex === 1 && Boolean(selectedRel)) ||
        (activeIndex === 2 && Boolean(selectedPurpose));

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
                <StatusBar barStyle="dark-content" />

                {/* Header */}
                <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, glassStyles.header]}>
                    <View style={styles.quizHeaderRow}>
                        <TouchableOpacity onPress={handleBack} style={[styles.backBtn, glassStyles.container, { opacity: activeIndex === 0 ? 0 : 1 }]} disabled={activeIndex === 0}>
                            <Ionicons name="arrow-back" size={20} color="#1a1a1a" />
                        </TouchableOpacity>

                        <View style={styles.stepIndicator}>
                            <Text style={styles.stepBadgeText}>STEP {currentQuizStep} OF 3</Text>
                            <View style={styles.progressBarTrack}>
                                <View style={[styles.progressBarFill, { width: `${(currentQuizStep / 3) * 100}%` }]} />
                            </View>
                        </View>

                        <TouchableOpacity onPress={handleComplete} style={styles.skipBtn}>
                            <Text style={styles.skipBtnText}>Skip</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Content Slides */}
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    keyboardShouldPersistTaps="handled"
                    style={{ flex: 1 }}
                >

                    {/* SLIDE 2: QUESTION 1 — GENDER */}
                    <View style={[styles.slide, { width }]}>
                        <Animated.View entering={FadeInDown.duration(500)} style={styles.quizTitleSection}>
                            <Text style={styles.quizHeading}>What is your gender?</Text>
                            <Text style={styles.quizSubheading}>Helps us tailor challenge phrasing and roles accurately.</Text>
                        </Animated.View>

                        <ScrollView style={styles.optionsList} contentContainerStyle={{ gap: 12, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                            {GENDER_OPTIONS.map((opt) => {
                                const isSelected = selectedGender === opt.id;
                                return (
                                    <TouchableOpacity
                                        key={opt.id}
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            Haptics.selectionAsync().catch(() => {});
                                            setSelectedGender(opt.id);
                                        }}
                                        style={[
                                            styles.optionCard,
                                            glassStyles.container,
                                            isSelected && styles.optionCardActive
                                        ]}
                                    >
                                        <View style={[styles.optionIconWrap, { backgroundColor: isSelected ? '#FF6B35' : 'rgba(0,0,0,0.05)' }]}>
                                            <Ionicons name={opt.icon} size={22} color={isSelected ? '#fff' : (opt.color || '#333')} />
                                        </View>
                                        <View style={styles.optionContent}>
                                            <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>{opt.label}</Text>
                                            {opt.desc && <Text style={styles.optionDesc}>{opt.desc}</Text>}
                                        </View>
                                        <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                                            {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <View style={styles.footerActionContainer}>
                            <TouchableOpacity 
                                style={[styles.primaryBtn, !selectedGender && styles.primaryBtnDisabled]} 
                                onPress={handleNext} 
                                disabled={!selectedGender}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.primaryBtnText}>Continue</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* SLIDE 3: QUESTION 2 — RELATIONSHIP STATUS */}
                    <View style={[styles.slide, { width }]}>
                        <Animated.View entering={FadeInDown.duration(500)} style={styles.quizTitleSection}>
                            <Text style={styles.quizHeading}>Your Relationship Status</Text>
                            <Text style={styles.quizSubheading}>We’ll customize card decks suited for where you are.</Text>
                        </Animated.View>

                        <ScrollView style={styles.optionsList} contentContainerStyle={{ gap: 12, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                            {RELATIONSHIP_OPTIONS.map((opt) => {
                                const isSelected = selectedRel === opt.id;
                                return (
                                    <TouchableOpacity
                                        key={opt.id}
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            Haptics.selectionAsync().catch(() => {});
                                            setSelectedRel(opt.id);
                                        }}
                                        style={[
                                            styles.optionCard,
                                            glassStyles.container,
                                            isSelected && styles.optionCardActive
                                        ]}
                                    >
                                        <View style={[styles.optionIconWrap, { backgroundColor: isSelected ? '#FF6B35' : 'rgba(0,0,0,0.05)' }]}>
                                            <Ionicons name={opt.icon} size={22} color={isSelected ? '#fff' : (opt.color || '#333')} />
                                        </View>
                                        <View style={styles.optionContent}>
                                            <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>{opt.label}</Text>
                                            {opt.desc && <Text style={styles.optionDesc}>{opt.desc}</Text>}
                                        </View>
                                        <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                                            {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <View style={styles.footerActionContainer}>
                            <TouchableOpacity 
                                style={[styles.primaryBtn, !selectedRel && styles.primaryBtnDisabled]} 
                                onPress={handleNext} 
                                disabled={!selectedRel}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.primaryBtnText}>Continue</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* SLIDE 4: QUESTION 3 — MAIN PURPOSE / GOAL */}
                    <View style={[styles.slide, { width }]}>
                        <Animated.View entering={FadeInDown.duration(500)} style={styles.quizTitleSection}>
                            <Text style={styles.quizHeading}>What is your main goal?</Text>
                            <Text style={styles.quizSubheading}>What would you like to experience most in Rumbala?</Text>
                        </Animated.View>

                        <ScrollView style={styles.optionsList} contentContainerStyle={{ gap: 12, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                            {PURPOSE_OPTIONS.map((opt) => {
                                const isSelected = selectedPurpose === opt.id;
                                return (
                                    <TouchableOpacity
                                        key={opt.id}
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            Haptics.selectionAsync().catch(() => {});
                                            setSelectedPurpose(opt.id);
                                        }}
                                        style={[
                                            styles.optionCard,
                                            glassStyles.container,
                                            isSelected && styles.optionCardActive
                                        ]}
                                    >
                                        <View style={[styles.optionIconWrap, { backgroundColor: isSelected ? '#FF6B35' : 'rgba(0,0,0,0.05)' }]}>
                                            <Ionicons name={opt.icon} size={22} color={isSelected ? '#fff' : (opt.color || '#333')} />
                                        </View>
                                        <View style={styles.optionContent}>
                                            <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>{opt.label}</Text>
                                            {opt.desc && <Text style={styles.optionDesc}>{opt.desc}</Text>}
                                        </View>
                                        <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                                            {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <View style={styles.footerActionContainer}>
                            <TouchableOpacity 
                                style={[styles.primaryBtn, !selectedPurpose && styles.primaryBtnDisabled]} 
                                onPress={handleComplete} 
                                disabled={!selectedPurpose}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.primaryBtnText}>Start Playing</Text>
                                <Ionicons name="play-circle" size={22} color="#fff" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                {/* Bottom Pagination Dots */}
                <View style={styles.paginationRow}>
                    {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                        <View 
                            key={i} 
                            style={[
                                styles.dot, 
                                glassStyles.container, 
                                activeIndex === i && styles.dotActive
                            ]} 
                        />
                    ))}
                </View>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    
    // Header
    header: { paddingHorizontal: 20, paddingVertical: 10 },
    introHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    quizHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerLogoText: { fontSize: 24, color: '#1a1a1a' },
    loginQuickLink: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255, 107, 53, 0.1)' },
    loginQuickLinkText: { fontSize: 14, fontWeight: '700', color: '#FF6B35' },
    
    backBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    stepIndicator: { flex: 1, alignItems: 'center' },
    stepBadgeText: { fontSize: 11, fontWeight: '800', color: '#FF6B35', letterSpacing: 0.8, marginBottom: 4 },
    progressBarTrack: { width: '80%', height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#FF6B35', borderRadius: 2 },
    skipBtn: { paddingHorizontal: 12, paddingVertical: 6 },
    skipBtnText: { fontSize: 13, fontWeight: '700', color: '#888' },

    // Slide Layout
    slide: { paddingHorizontal: 24, paddingBottom: 10, flex: 1, justifyContent: 'space-between' },
    textSection: { alignItems: 'center', marginTop: 10, marginBottom: 12 },
    title: { fontSize: 44, fontWeight: '900', color: '#1a1a1a', letterSpacing: -1.5, textAlign: 'center', lineHeight: 48 },
    titleAccent: { color: '#FF6B35' },
    subtitle: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginTop: 8, fontWeight: '600', paddingHorizontal: 10 },

    imageCardContainer: { width: '100%', height: 280, justifyContent: 'center', alignItems: 'center', marginVertical: 8 },
    illustrationCard: { width: '100%', height: '100%', padding: 16, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    mainImage: { width: '100%', height: '100%', borderRadius: 20 },

    cardsStack: { flex: 1, gap: 14, justifyContent: 'center', marginVertical: 12 },
    featureCard: { flexDirection: 'row', padding: 18, borderRadius: 22, alignItems: 'center', gap: 16, backgroundColor: 'rgba(255,255,255,0.5)' },
    featureIconWrap: { width: 52, height: 52, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    featureTextWrap: { flex: 1 },
    featureTitle: { fontSize: 17, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
    featureDesc: { fontSize: 13, color: '#666', lineHeight: 18, fontWeight: '500' },

    // Questionnaire Styles
    quizTitleSection: { marginTop: 10, marginBottom: 16, alignItems: 'center' },
    quizHeading: { fontSize: 26, fontWeight: '900', color: '#1a1a1a', textAlign: 'center', letterSpacing: -0.5 },
    quizSubheading: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 6, fontWeight: '600', paddingHorizontal: 12 },
    optionsList: { flex: 1, marginVertical: 4 },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.7)',
    },
    optionCardActive: {
        borderColor: '#FF6B35',
        backgroundColor: 'rgba(255, 240, 235, 0.85)',
        shadowColor: 'rgba(255, 107, 53, 0.25)',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 2,
    },
    optionIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    optionContent: { flex: 1 },
    optionLabel: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
    optionLabelActive: { color: '#FF6B35' },
    optionDesc: { fontSize: 12, color: '#777', fontWeight: '500', marginTop: 2, lineHeight: 16 },
    checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(0,0,0,0.15)', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    checkCircleActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },

    // Footers & Buttons
    footerActionContainer: { width: '100%', alignItems: 'center', marginTop: 10 },
    primaryBtn: { 
        backgroundColor: '#FF6B35', 
        width: '100%', 
        paddingVertical: 16, 
        borderRadius: 18, 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        shadowColor: 'rgba(255, 107, 53, 0.4)', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.25, 
        shadowRadius: 10, 
        elevation: 4 
    },
    primaryBtnDisabled: { opacity: 0.45 },
    primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    secondaryBtn: { marginTop: 14, alignSelf: 'center', paddingVertical: 4 },
    secondaryBtnText: { color: '#666', fontSize: 15, fontWeight: '700' },

    // Pagination
    paginationRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.12)' },
    dotActive: { width: 24, backgroundColor: '#FF6B35' },
});
