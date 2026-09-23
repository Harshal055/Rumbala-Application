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
    { key: 'fun', label: 'Fun', desc: 'Playful & light', colors: ['#FFD93D', '#FF9800'] as const, iconBg: '#FFF9E1', solidColor: '#FF9800' },
    { key: 'romantic', label: 'Romantic', desc: 'Sweet & intimate', colors: ['#FF6B35', '#FB8C00'] as const, iconBg: '#FFF0EA', solidColor: '#FF6B35' },
    { key: 'spicy', label: 'Spicy', desc: 'Bold & daring', colors: ['#F4511E', '#BF360C'] as const, iconBg: '#FFEBEA', solidColor: '#EF4444' },
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
                        <ScrollView
                            contentContainerStyle={styles.scroll}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                        {/* Top Nav & Compact Brand Header */}
                        <Animated.View entering={FadeInDown.duration(400)} style={styles.topNav}>
                            <TouchableOpacity onPress={handleBack} style={[styles.backBtn, glassStyles.container]}>
                                <Ionicons name="arrow-back" size={20} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.headerBrandRow}>
                                <View style={styles.logoCircle}>
                                    <Ionicons name="heart" size={16} color="#fff" />
                                </View>
                                <Text style={styles.brandName}>Rumbala</Text>
                            </View>
                            <View style={{ width: 38 }} />
                        </Animated.View>

                        {/* Main Card */}
                        <Animated.View 
                            entering={FadeInUp.delay(200).duration(600)} 
                            renderToHardwareTextureAndroid={true}
                            style={[styles.card, glassStyles.container]}
                        >
                            <Text style={styles.cardTitle}>Let's set up your game!</Text>
                            <Text style={styles.cardSubtitle}>Enter your names and pick your vibe</Text>

                            {/* Your Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Your Name</Text>
                                <View style={[styles.inputRow, glassStyles.container, name1Focused && styles.inputRowFocused]}>
                                    <Ionicons name="person-outline" size={16} color={name1Focused ? '#FF6B35' : '#888'} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Harshal"
                                        placeholderTextColor="#999"
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
                                <View style={[styles.inputRow, glassStyles.container, name2Focused && styles.inputRowFocused]}>
                                    <Ionicons name="heart-outline" size={16} color={name2Focused ? '#FF6B35' : '#888'} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Priya"
                                        placeholderTextColor="#999"
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
                                <View style={[styles.inputRow, glassStyles.container, emailFocused && styles.inputRowFocused]}>
                                    <Ionicons name="mail-outline" size={16} color={emailFocused ? '#FF6B35' : '#888'} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="partner@example.com"
                                        placeholderTextColor="#999"
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
                                            style={[styles.vibeCard, glassStyles.container, isSelected && styles.vibeCardSelected]}
                                            onPress={() => { Haptics.selectionAsync(); setVibe(v.key); }}
                                            activeOpacity={0.8}
                                        >
                                            {isSelected && (
                                                <LinearGradient
                                                    colors={[v.colors[0], v.colors[1]]}
                                                    style={StyleSheet.absoluteFill}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                />
                                            )}
                                            {!isSelected && <View style={[styles.vibeImg, { backgroundColor: v.solidColor, borderRadius: 8 }]} />}
                                            {isSelected && <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginBottom: 4 }} />}
                                            <Text style={[styles.vibeLabel, { color: isSelected ? '#fff' : '#1a1a1a' }]}>{v.label}</Text>
                                            <Text style={[styles.vibeDesc, { color: isSelected ? 'rgba(255,255,255,0.85)' : '#666' }]}>{v.desc}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Start Button */}
                            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
                                <LinearGradient colors={['#FF6B35', '#FF9800']} style={styles.startGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                    <View style={styles.btnContent}>
                                        <Text style={styles.startText}>Start Rumble!</Text>
                                        <Ionicons name="sparkles" size={16} color="#fff" />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Trust line */}
                            <View style={styles.trustRow}>
                                <Ionicons name="shield-checkmark" size={13} color="#10B981" />
                                <Text style={styles.trustText}>5 FREE dare cards • Private & Encrypted</Text>
                            </View>
                        </Animated.View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    scroll: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, alignItems: 'center' },
    
    topNav: { 
        width: '100%', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    backBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
    headerBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logoCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.25)' },
    brandName: { fontFamily: 'Pacifico_400Regular', fontSize: 26, color: '#fff', letterSpacing: 0.5 },

    card: { borderRadius: 26, paddingHorizontal: 18, paddingVertical: 18, width: '100%', maxWidth: 420 },
    cardTitle: { fontSize: 21, fontWeight: '900', color: '#1a1a1a', marginBottom: 2, textAlign: 'center' },
    cardSubtitle: { fontSize: 12, color: '#666', marginBottom: 14, textAlign: 'center', fontWeight: '500' },

    inputGroup: { marginBottom: 10 },
    label: { fontSize: 12, fontWeight: '800', color: '#555', marginBottom: 4, marginLeft: 2 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, height: 44, gap: 8, backgroundColor: 'rgba(0,0,0,0.02)' },
    inputRowFocused: { borderColor: '#FF6B35', borderBottomWidth: 2 },
    input: { flex: 1, fontSize: 15, color: '#1a1a1a', fontWeight: '600' },

    vibeTitle: { fontSize: 12, fontWeight: '800', color: '#555', marginBottom: 6, marginTop: 2, marginLeft: 2 },
    vibeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    vibeCard: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 2, borderRadius: 16, overflow: 'hidden' },
    vibeCardSelected: { borderColor: 'transparent' },
    vibeImg: { width: 22, height: 22, marginBottom: 4 },
    vibeLabel: { fontSize: 12, fontWeight: '800', marginBottom: 1 },
    vibeDesc: { fontSize: 9, fontWeight: '600', textAlign: 'center' },

    startBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
    startGradient: { paddingVertical: 13 },
    btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    startText: { color: '#fff', fontSize: 16, fontWeight: '900' },

    trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
    trustText: { fontSize: 11, color: '#888', fontWeight: '700' },
});
