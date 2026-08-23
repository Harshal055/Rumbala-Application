import React, { useState, useRef } from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet,
    Dimensions, ScrollView, NativeScrollEvent, NativeSyntheticEvent,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles } from '../src/constants/glass';

const { width } = Dimensions.get('window');

const BG_COLORS = ['#FEE2E2', '#FFEDD5', '#FEF3C7'];

export default function IntroScreen() {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);
    const TOTAL_SLIDES = 2;

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
            router.replace('/login');
        }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
                <StatusBar barStyle="dark-content" />

                {/* Header */}
                <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, glassStyles.header]}>
                    <View style={styles.introHeaderRow}>
                        <View style={styles.logoRow}>
                            <Ionicons name="heart" size={24} color="#FF6B35" />
                            <Text style={[styles.headerLogoText, { fontFamily: 'Pacifico_400Regular' }]}>Rumbala</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.replace('/login')} style={styles.loginQuickLink}>
                            <Text style={styles.loginQuickLinkText}>Log In</Text>
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
                    {/* SLIDE 0: INTRO */}
                    <View style={[styles.slide, { width }]}>
                        <Animated.View entering={FadeInDown.duration(600)} style={styles.textSection}>
                            <Text style={styles.title}>
                                Play <Text style={styles.titleAccent}>Together.</Text>
                            </Text>
                            <Text style={styles.subtitle}>
                                Spice up your connection with personalized romantic dares, challenges and games.
                            </Text>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(200)} style={styles.imageCardContainer}>
                            <View style={[styles.illustrationCard, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.45)' }]}>
                                <Image 
                                    source={require('../assets/images/onboarding_couple_v2.png')} 
                                    style={styles.mainImage} 
                                    resizeMode="contain" 
                                />
                            </View>
                        </Animated.View>

                        <View style={styles.footerActionContainer}>
                            <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.85}>
                                <Text style={styles.primaryBtnText}>Get Started</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/login')}>
                                <Text style={styles.secondaryBtnText}>I already have an account</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* SLIDE 1: PRIVACY & TRUST */}
                    <View style={[styles.slide, { width }]}>
                        <Animated.View entering={FadeInDown.duration(600)} style={styles.textSection}>
                            <Text style={styles.title}>
                                Safe & <Text style={styles.titleAccent}>Private.</Text>
                            </Text>
                            <Text style={styles.subtitle}>
                                Built exclusively for couples. Your personal moments and answers stay private.
                            </Text>
                        </Animated.View>

                        <View style={styles.cardsStack}>
                            <Animated.View entering={FadeInUp.delay(100)} style={[styles.featureCard, glassStyles.container]}>
                                <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(255, 107, 53, 0.12)' }]}>
                                    <Ionicons name="shield-checkmark" size={28} color="#FF6B35" />
                                </View>
                                <View style={styles.featureTextWrap}>
                                    <Text style={styles.featureTitle}>End-to-End Encrypted</Text>
                                    <Text style={styles.featureDesc}>Your card selections and private chats are never readable by third parties.</Text>
                                </View>
                            </Animated.View>

                            <Animated.View entering={FadeInUp.delay(200)} style={[styles.featureCard, glassStyles.container]}>
                                <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.12)' }]}>
                                    <Ionicons name="lock-closed" size={28} color="#EC4899" />
                                </View>
                                <View style={styles.featureTextWrap}>
                                    <Text style={styles.featureTitle}>100% Couple Confidential</Text>
                                    <Text style={styles.featureDesc}>No intrusive ads, no selling personal data. Just intimate connection.</Text>
                                </View>
                            </Animated.View>
                        </View>

                        <View style={styles.footerActionContainer}>
                            <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.85}>
                                <Text style={styles.primaryBtnText}>Personalize My Experience</Text>
                                <Ionicons name="sparkles" size={18} color="#fff" style={{ marginLeft: 8 }} />
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
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerLogoText: { fontSize: 24, color: '#1a1a1a' },
    loginQuickLink: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255, 107, 53, 0.1)' },
    loginQuickLinkText: { fontSize: 14, fontWeight: '700', color: '#FF6B35' },
    
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
    primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    secondaryBtn: { marginTop: 14, alignSelf: 'center', paddingVertical: 4 },
    secondaryBtnText: { color: '#666', fontSize: 15, fontWeight: '700' },

    // Pagination
    paginationRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.12)' },
    dotActive: { width: 24, backgroundColor: '#FF6B35' },
});
