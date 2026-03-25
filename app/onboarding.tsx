import React, { useState, useRef } from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet,
    Dimensions, ScrollView, NativeScrollEvent, NativeSyntheticEvent,
    StatusBar, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store/useStore';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../src/constants/glass';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        key: 'play',
        title: 'Play ',
        titleAccent: 'Together.',
        subtitle: 'Spice up your connection with fun, romantic challenges and games.',
        image: require('../assets/images/onboarding_couple_v2.png'),
    },
    {
        key: 'safety',
        title: 'Safe & ',
        titleAccent: 'Private.',
        subtitle: 'Your data is 100% encrypted and local to your device for total peace of mind.',
        image: null,
    },
    {
        key: 'steps',
        title: 'How to Play',
        subtitle: '3 Simple Steps to Fun',
        image: require('../assets/icon.png'),
    },
    {
        key: 'setup',
        title: 'One Last ',
        titleAccent: 'Step.',
        subtitle: 'Tell us who is playing today!',
        image: null,
    }
];

const BG_COLORS = ['#FEE2E2', '#FFEDD5', '#FEF3C7'];

export default function OnboardingScreen() {
    const router = useRouter();
    const { setHasSeenOnboarding, setPartners, partner1: storeP1, partner2: storeP2 } = useStore();
    const [name1, setName1] = useState(storeP1 || '');
    const [name2, setName2] = useState(storeP2 || '');
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);

    const handleFinish = () => {
        if (!name1.trim()) {
            scrollRef.current?.scrollTo({ x: 3 * width, animated: true });
            return;
        }
        setPartners(name1.trim(), name2.trim());
        setHasSeenOnboarding(true);
        router.replace('/login');
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const x = event.nativeEvent.contentOffset.x;
        const index = Math.round(x / width);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    const nextSlide = () => {
        if (activeIndex < SLIDES.length - 1) {
            scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
        } else {
            handleFinish();
        }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
                <StatusBar barStyle="dark-content" />
                
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, glassStyles.header]}>
                    {activeIndex < 2 ? (
                        <>
                            <View style={styles.logoRow}>
                                <Ionicons name="heart" size={24} color="#FF6B35" />
                                <Text style={[styles.headerText, { fontFamily: 'Pacifico_400Regular' }]}>Rumbala</Text>
                            </View>
                            <TouchableOpacity style={[styles.notifBtn, glassStyles.container, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                                <Ionicons name="notifications" size={20} color="#FF6B35" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.headerCentered}>
                            <TouchableOpacity onPress={() => scrollRef.current?.scrollTo({ x: 0, animated: true })} style={[styles.backBtn, glassStyles.container]}>
                                <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
                            </TouchableOpacity>
                            <Text style={[styles.headerTitle, { fontFamily: 'Pacifico_400Regular' }]}>How to Play</Text>
                            <View style={{ width: 44 }} />
                        </View>
                    )}
                </Animated.View>

                <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    style={{ flex: 1 }}
                >
                    {/* SLIDE 1: INTRO */}
                    <View style={[styles.slide, { width }]}>
                        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.textSection}>
                            <Text style={styles.title}>
                                {SLIDES[0].title}
                                <Text style={styles.titleAccent}>{SLIDES[0].titleAccent}</Text>
                            </Text>
                            <Text style={styles.subtitle}>{SLIDES[0].subtitle}</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(300)} style={styles.imageCardContainer}>
                            <View style={[styles.illustrationCard, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
                                <Image source={SLIDES[0].image} style={styles.mainImage} resizeMode="contain" />
                            </View>
                        </Animated.View>

                        <View style={styles.avatarRow}>
                            <View style={[styles.avatar, glassStyles.container, { zIndex: 3, backgroundColor: '#FFD6C9' }]}><Ionicons name="person" size={20} color="#FF6B35" /></View>
                            <View style={[styles.avatar, glassStyles.container, { left: -16, zIndex: 2, backgroundColor: '#FFE4DE' }]}><Ionicons name="person" size={20} color="#FFB8A1" /></View>
                            <View style={[styles.avatarAdd, glassStyles.container, { left: -32, zIndex: 1, backgroundColor: '#FF6B35' }]}><Ionicons name="add" size={20} color="#fff" /></View>
                        </View>

                        <TouchableOpacity style={styles.primaryBtn} onPress={nextSlide} activeOpacity={0.85}>
                            <Text style={styles.primaryBtnText}>Get Started</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryBtn} onPress={handleFinish}>
                            <Text style={styles.secondaryBtnText}>I already have an account</Text>
                        </TouchableOpacity>
                    </View>

                    {/* SLIDE 2: SAFETY & PRIVACY */}
                    <View style={[styles.slide, { width }]}>
                        <Animated.View entering={FadeInDown.duration(600)} style={styles.textSection}>
                            <Text style={styles.title}>
                                {SLIDES[1].title}
                                <Text style={styles.titleAccent}>{SLIDES[1].titleAccent}</Text>
                            </Text>
                            <Text style={styles.subtitle}>{SLIDES[1].subtitle}</Text>
                        </Animated.View>

                        <View style={styles.safetyContainer}>
                            <Animated.View entering={FadeInUp.delay(100)} style={[styles.safetyCard, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
                                <View style={[styles.safetyIcon, glassStyles.container, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                                    <Ionicons name="shield-checkmark" size={32} color="#FF6B35" />
                                </View>
                                <Text style={styles.safetyTitle}>End-to-End Encrypted</Text>
                                <Text style={styles.safetyDesc}>Your dares and chat messages are never readable by anyone else.</Text>
                            </Animated.View>
                            <Animated.View entering={FadeInUp.delay(200)} style={[styles.safetyCard, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
                                <View style={[styles.safetyIcon, glassStyles.container, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                                    <Ionicons name="location-outline" size={32} color="#FF6B35" />
                                </View>
                                <Text style={styles.safetyTitle}>100% Private</Text>
                                <Text style={styles.safetyDesc}>No tracking, no selling your data. Just you and your partner.</Text>
                            </Animated.View>
                        </View>

                        <TouchableOpacity style={styles.primaryBtn} onPress={nextSlide} activeOpacity={0.85}>
                            <Text style={styles.primaryBtnText}>Next Step</Text>
                        </TouchableOpacity>
                    </View>

                    {/* SLIDE 3: HOW TO PLAY */}
                    <View style={[styles.slide, { width }]}>
                        <Animated.View entering={FadeInDown.duration(600)} style={[styles.phoneImageContainer, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
                            <Image source={SLIDES[2].image} style={styles.stepImage} resizeMode="contain" />
                            <View style={styles.stepLabel}>
                                <Text style={styles.stepLabelText}>GETTING STARTED</Text>
                            </View>
                        </Animated.View>

                        <Text style={styles.slide3Title}>3 Simple Steps to Fun</Text>

                        <View style={styles.stepsContainer}>
                            <StepItem icon="create-outline" title="Set your names & vibe" desc="Customize your profile and pick the intensity mode for tonight." isLast={false} />
                            <StepItem icon="sync-outline" title="Connect with your partner" desc="Sync devices by scanning a QR code or entering a private session pin." isLast={false} />
                            <StepItem icon="card-outline" title="Reveal cards and complete dares" desc="Take turns revealing challenges and start the ultimate gaming experience." isLast={true} />
                        </View>

                        <View style={{ flex: 1 }} />

                        <TouchableOpacity style={styles.primaryBtn} onPress={nextSlide} activeOpacity={0.85}>
                            <View style={styles.btnContent}>
                                <Text style={styles.primaryBtnText}>Continue</Text>
                                <Ionicons name="arrow-forward" size={24} color="#fff" style={{ marginLeft: 10 }} />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.versionText}>Rumbala INSTRUCTIONS V1.0</Text>
                    </View>

                    {/* SLIDE 4: SETUP NAMES */}
                    <View style={[styles.slide, { width }]}>
                        <Animated.View entering={FadeInDown.duration(600)} style={styles.textSection}>
                            <Text style={styles.title}>
                                One Last <Text style={styles.titleAccent}>Step.</Text>
                            </Text>
                            <Text style={styles.subtitle}>Enter your names to start Rumble!</Text>
                        </Animated.View>

                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.setupContainer}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Your Name</Text>
                                <View style={[styles.inputRow, glassStyles.container]}>
                                    <Ionicons name="person-outline" size={18} color="#FF6B35" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Harshal"
                                        placeholderTextColor="#999"
                                        value={name1}
                                        onChangeText={setName1}
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Partner's Name</Text>
                                <View style={[styles.inputRow, glassStyles.container]}>
                                    <Ionicons name="heart-outline" size={18} color="#FF6B35" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Priya"
                                        placeholderTextColor="#999"
                                        value={name2}
                                        onChangeText={setName2}
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>
                        </KeyboardAvoidingView>

                        <View style={{ flex: 1 }} />

                        <TouchableOpacity style={styles.primaryBtn} onPress={handleFinish} activeOpacity={0.85}>
                            <View style={styles.btnContent}>
                                <Text style={styles.primaryBtnText}>Let's Play</Text>
                                <Ionicons name="play-circle" size={24} color="#fff" style={{ marginLeft: 10 }} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Pagination Dots */}
                <View style={styles.pagination}>
                    <View style={[styles.dot, glassStyles.container, activeIndex === 0 && styles.dotActive]} />
                    <View style={[styles.dot, glassStyles.container, activeIndex === 1 && styles.dotActive]} />
                    <View style={[styles.dot, glassStyles.container, activeIndex === 2 && styles.dotActive]} />
                    <View style={[styles.dot, glassStyles.container, activeIndex === 3 && styles.dotActive]} />
                </View>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

function StepItem({ icon, title, desc, isLast }: { icon: string, title: string, desc: string, isLast: boolean }) {
    return (
        <View style={styles.stepItem}>
            <View style={[styles.iconCircle, glassStyles.container, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                <Ionicons name={icon as any} size={20} color="#FF6B35" />
            </View>
            <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitleTxt}>{title}</Text>
                <Text style={styles.stepDescTxt}>{desc}</Text>
            </View>
            {!isLast && <View style={styles.verticalLine} />}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    headerCentered: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerText: { fontSize: 24, color: '#1a1a1a' },
    headerTitle: { fontSize: 20, color: '#1a1a1a' },
    notifBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

    slide: { paddingHorizontal: 24, paddingBottom: 24 },
    textSection: { alignItems: 'center', marginTop: 20, marginBottom: 16 },
    title: { fontSize: 48, fontWeight: '900', color: '#1a1a1a', letterSpacing: -1.5, textAlign: 'center', lineHeight: 52 },
    titleAccent: { color: '#FF6B35' },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginTop: 12, fontWeight: '600' },

    imageCardContainer: { width: '100%', height: 300, justifyContent: 'center', alignItems: 'center', marginVertical: 10 },
    illustrationCard: { width: '100%', height: '100%', padding: 20, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    mainImage: { width: '100%', height: '100%', borderRadius: 24 },

    avatarRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 24 },
    avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
    avatarAdd: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },

    primaryBtn: { backgroundColor: '#FF6B35', width: '100%', paddingVertical: 18, borderRadius: 18, alignItems: 'center', shadowColor: 'rgba(255, 107, 53, 0.4)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 0 },
    btnContent: { flexDirection: 'row', alignItems: 'center' },
    primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    secondaryBtn: { marginTop: 24, alignSelf: 'center' },
    secondaryBtnText: { color: '#666', fontSize: 16, fontWeight: '700' },

    pagination: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingBottom: 30 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.1)' },
    dotActive: { width: 32, backgroundColor: '#FF6B35' },

    safetyContainer: { flex: 1, gap: 16, marginTop: 10, marginBottom: 20 },
    safetyCard: { borderRadius: 24, padding: 24, alignItems: 'center' },
    safetyIcon: { marginBottom: 16, width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    safetyTitle: { fontSize: 19, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
    safetyDesc: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, fontWeight: '500' },

    phoneImageContainer: { width: '100%', height: 180, borderRadius: 28, overflow: 'hidden', padding: 20, marginBottom: 20 },
    stepImage: { width: '100%', height: '100%' },
    stepLabel: { position: 'absolute', bottom: 16, left: 16, backgroundColor: '#FF6B35', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    stepLabelText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    slide3Title: { fontSize: 32, fontWeight: '900', color: '#1a1a1a', marginBottom: 24, letterSpacing: -1 },
    stepsContainer: { width: '100%', gap: 24 },
    stepItem: { flexDirection: 'row', gap: 16, position: 'relative' },
    iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    stepTextContainer: { flex: 1 },
    stepTitleTxt: { fontSize: 17, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
    stepDescTxt: { fontSize: 14, color: '#666', lineHeight: 18, fontWeight: '500' },
    verticalLine: { position: 'absolute', top: 44, left: 22, bottom: -24, width: 2, backgroundColor: 'rgba(255, 107, 53, 0.2)', zIndex: 1 },
    versionText: { marginTop: 12, fontSize: 11, fontWeight: '800', color: '#bbb', textAlign: 'center' },
    setupContainer: { flex: 1, gap: 20, marginTop: 20 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: '800', color: '#1a1a1a', marginLeft: 4 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4, gap: 12, backgroundColor: 'rgba(255,255,255,0.4)' },
    input: { flex: 1, height: 48, fontSize: 16, color: '#1a1a1a', fontWeight: '600' },
});
