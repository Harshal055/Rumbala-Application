import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Alert, ScrollView, StyleSheet, StatusBar,
    Dimensions, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getInitialFreeCards } from '../src/constants/cards';
import { useStore } from '../src/store/useStore';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../src/constants/glass';

const { width } = Dimensions.get('window');

const BG_COLORS = ['#FF6B35', '#FF8C00', '#FFA500'];

const VIBES = [
    { 
        key: 'fun', 
        label: 'Fun', 
        desc: 'Playful & light', 
        colors: ['#FFD93D', '#FF9800'] as const, 
        icon: 'happy' as const, 
        iconOutline: 'happy-outline' as const, 
        iconColor: '#F59E0B', 
        badgeBg: 'rgba(245, 158, 11, 0.12)' 
    },
    { 
        key: 'romantic', 
        label: 'Romantic', 
        desc: 'Sweet & intimate', 
        colors: ['#FF6B35', '#FB8C00'] as const, 
        icon: 'heart' as const, 
        iconOutline: 'heart-outline' as const, 
        iconColor: '#FF6B35', 
        badgeBg: 'rgba(255, 107, 53, 0.12)' 
    },
    { 
        key: 'spicy', 
        label: 'Spicy', 
        desc: 'Bold & daring', 
        colors: ['#F4511E', '#BF360C'] as const, 
        icon: 'flame' as const, 
        iconOutline: 'flame-outline' as const, 
        iconColor: '#EF4444', 
        badgeBg: 'rgba(239, 68, 68, 0.12)' 
    },
] as const;

export default function WelcomeScreen() {
    const router = useRouter();
    const { setSelectedVibe, setPartners, showAlert, partner1: savedPartner1, partner2: savedPartner2 } = useStore();
    const [partner1, setPartner1] = useState(savedPartner1 || '');
    const [partner2, setPartner2] = useState(savedPartner2 || '');
    const [partnerEmail, setPartnerEmail] = useState('');
    const [vibe, setVibe] = useState<'fun' | 'romantic' | 'spicy'>('fun');
    const [name1Focused, setName1Focused] = useState(false);
    const [name2Focused, setName2Focused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);

    const handleStart = async () => {
        if (!partner1.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showAlert('Missing Name', 'Please enter your name to continue!');
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        try {
            const defaultCards = getInitialFreeCards();
            await AsyncStorage.setItem('@Rumbala_owned_cards', JSON.stringify(defaultCards));
            setPartners(partner1.trim(), partner2.trim(), partnerEmail.trim());
            await AsyncStorage.setItem('@Rumbala_mode', 'local');
            setSelectedVibe(vibe);

            const state = useStore.getState();
            if (!state.isAuthenticated) {
                router.replace('/signup');
            } else if (state.isPro || state.hasSeenSubscription) {
                router.replace('/(tabs)');
            } else {
                router.replace('/subscription');
            }
        } catch {
            showAlert('Error', 'Something went wrong while setting up your profile. Please try again.');
        }
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (router.canGoBack()) router.back();
        else router.replace('/');
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
                <StatusBar barStyle="light-content" />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={{ flex: 1 }}>
                            {/* Top Navigation Bar */}
                            <Animated.View entering={FadeInDown.duration(400)} style={styles.topNav}>
                                <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
                                    <Ionicons name="arrow-back" size={20} color="#fff" />
                                </TouchableOpacity>
                                <View style={styles.headerBrandRow}>
                                    <View style={styles.logoCircle}>
                                        <Ionicons name="heart" size={16} color="#fff" />
                                    </View>
                                    <Text style={styles.brandName}>Rumbala</Text>
                                </View>
                                <View style={{ width: 40 }} />
                            </Animated.View>

                            {/* Centered Scrollable Card Content */}
                            <ScrollView
                                contentContainerStyle={styles.scroll}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                                bounces={false}
                            >
                                <Animated.View 
                                    entering={FadeInUp.delay(150).duration(500)} 
                                    renderToHardwareTextureAndroid={true}
                                    style={styles.card}
                                >
                                    <Text style={styles.cardTitle}>Let's set up your game!</Text>
                                    <Text style={styles.cardSubtitle}>Enter your names and pick your vibe</Text>

                                    {/* Your Name */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Your Name</Text>
                                        <View style={[styles.inputRow, name1Focused && styles.inputRowFocused]}>
                                            <Ionicons name="person-outline" size={18} color={name1Focused ? '#FF6B35' : '#9CA3AF'} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="e.g. Harshal"
                                                placeholderTextColor="#9CA3AF"
                                                value={partner1}
                                                onChangeText={setPartner1}
                                                autoCorrect={false}
                                                onFocus={() => setName1Focused(true)}
                                                onBlur={() => setName1Focused(false)}
                                            />
                                        </View>
                                    </View>

                                    {/* Partner Name */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Partner's Name</Text>
                                        <View style={[styles.inputRow, name2Focused && styles.inputRowFocused]}>
                                            <Ionicons name="heart-outline" size={18} color={name2Focused ? '#FF6B35' : '#9CA3AF'} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="e.g. Priya"
                                                placeholderTextColor="#9CA3AF"
                                                value={partner2}
                                                onChangeText={setPartner2}
                                                autoCorrect={false}
                                                onFocus={() => setName2Focused(true)}
                                                onBlur={() => setName2Focused(false)}
                                            />
                                        </View>
                                    </View>

                                    {/* Partner Email */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Partner's Email (Optional)</Text>
                                        <View style={[styles.inputRow, emailFocused && styles.inputRowFocused]}>
                                            <Ionicons name="mail-outline" size={18} color={emailFocused ? '#FF6B35' : '#9CA3AF'} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="partner@example.com"
                                                placeholderTextColor="#9CA3AF"
                                                value={partnerEmail}
                                                onChangeText={setPartnerEmail}
                                                autoCapitalize="none"
                                                keyboardType="email-address"
                                                autoCorrect={false}
                                                onFocus={() => setEmailFocused(true)}
                                                onBlur={() => setEmailFocused(false)}
                                            />
                                        </View>
                                    </View>

                                    {/* Vibe Picker */}
                                    <Text style={styles.vibeTitle}>Choose Your Vibe</Text>
                                    <View style={styles.vibeRow}>
                                        {VIBES.map((v) => {
                                            const isSelected = vibe === v.key;
                                            return (
                                                <TouchableOpacity
                                                    key={v.key}
                                                    style={[styles.vibeCard, isSelected ? styles.vibeCardSelected : styles.vibeCardUnselected]}
                                                    onPress={() => { Haptics.selectionAsync(); setVibe(v.key); }}
                                                    activeOpacity={0.8}
                                                >
                                                    {isSelected && (
                                                        <LinearGradient
                                                            colors={[v.colors[0], v.colors[1]]}
                                                            style={StyleSheet.absoluteFill}
                                                            start={{ x: 0, y: 0 }}
                                                            end={{ x: 1, y: 1 }}
                                                        />
                                                    )}
                                                    <View style={[styles.vibeIconWrap, isSelected ? styles.vibeIconWrapSelected : { backgroundColor: v.badgeBg }]}>
                                                        <Ionicons 
                                                            name={isSelected ? v.icon : v.iconOutline} 
                                                            size={18} 
                                                            color={isSelected ? '#fff' : v.iconColor} 
                                                        />
                                                    </View>
                                                    <Text style={[styles.vibeLabel, { color: isSelected ? '#fff' : '#111827' }]}>{v.label}</Text>
                                                    <Text style={[styles.vibeDesc, { color: isSelected ? 'rgba(255,255,255,0.92)' : '#6B7280' }]}>{v.desc}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    {/* Start Button */}
                                    <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
                                        <LinearGradient colors={['#FF6B35', '#FF8C00']} style={styles.startGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                            <View style={styles.btnContent}>
                                                <Text style={styles.startText}>Start Rumble!</Text>
                                                <Ionicons name="sparkles" size={17} color="#fff" />
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    {/* Trust line */}
                                    <View style={styles.trustRow}>
                                        <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                                        <Text style={styles.trustText}>5 FREE dare cards • Private & Encrypted</Text>
                                    </View>
                                </Animated.View>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    
    topNav: { 
        width: '100%', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    backBtn: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    headerBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logoCircle: { 
        width: 30, 
        height: 30, 
        borderRadius: 15, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    brandName: { fontFamily: 'Pacifico_400Regular', fontSize: 26, color: '#fff', letterSpacing: 0.5 },

    scroll: { 
        flexGrow: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: 18, 
        paddingVertical: 12,
    },

    card: { 
        backgroundColor: 'rgba(255, 255, 255, 0.94)', 
        borderRadius: 28, 
        paddingHorizontal: 20, 
        paddingVertical: 22, 
        width: '100%', 
        maxWidth: 420,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
    },
    cardTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 3, textAlign: 'center' },
    cardSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 16, textAlign: 'center', fontWeight: '500' },

    inputGroup: { marginBottom: 12 },
    label: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 5, marginLeft: 2 },
    inputRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderRadius: 14, 
        paddingHorizontal: 14, 
        height: 46, 
        gap: 10, 
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    inputRowFocused: { 
        borderColor: '#FF6B35', 
        backgroundColor: '#FFF9F5',
    },
    input: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '600' },

    vibeTitle: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 2, marginLeft: 2 },
    vibeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    vibeCard: { 
        flex: 1, 
        alignItems: 'center', 
        paddingVertical: 12, 
        paddingHorizontal: 4, 
        borderRadius: 16, 
        overflow: 'hidden',
    },
    vibeCardUnselected: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    vibeCardSelected: { 
        borderColor: 'transparent',
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
    },
    vibeIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    vibeIconWrapSelected: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    vibeLabel: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
    vibeDesc: { fontSize: 9.5, fontWeight: '600', textAlign: 'center' },

    startBtn: { 
        borderRadius: 16, 
        overflow: 'hidden', 
        marginTop: 4,
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 4,
    },
    startGradient: { paddingVertical: 14 },
    btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    startText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },

    trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
    trustText: { fontSize: 11.5, color: '#6B7280', fontWeight: '600' },
});
