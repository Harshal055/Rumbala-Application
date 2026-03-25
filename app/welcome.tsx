import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Alert, ScrollView, StyleSheet, StatusBar,
    Dimensions
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
    const { setSelectedVibe, setPartners, showAlert } = useStore();
    const [partner1, setPartner1] = useState('');
    const [partner2, setPartner2] = useState('');
    const [vibe, setVibe] = useState<'fun' | 'romantic' | 'spicy'>('fun');
    const [name1Focused, setName1Focused] = useState(false);
    const [name2Focused, setName2Focused] = useState(false);

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
            setPartners(partner1.trim(), partner2.trim());
            await AsyncStorage.setItem('@Rumbala_mode', 'local');
            setSelectedVibe(vibe);
            router.replace('/login');
        } catch {
            showAlert('Error', 'Something went wrong while setting up your profile. Please try again.');
        }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="light-content" />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView
                        contentContainerStyle={styles.scroll}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Logo area */}
                        <Animated.View 
                            entering={FadeInDown.delay(100).duration(600)} 
                            renderToHardwareTextureAndroid={true}
                            style={styles.logoSection}
                        >
                            <View style={[styles.logoCircle, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Ionicons name="heart" size={24} color="#fff" />
                            </View>
                            <Text style={styles.brandName}>Rumbala</Text>
                            <Text style={styles.brandTagline}>Dare the distance with your partner ✨</Text>
                        </Animated.View>

                        {/* Main Card */}
                        <Animated.View 
                            entering={FadeInUp.delay(300).duration(800)} 
                            renderToHardwareTextureAndroid={true}
                            style={[styles.card, glassStyles.container]}
                        >
                            <Text style={styles.cardTitle}>Let's set up your game!</Text>
                            <Text style={styles.cardSubtitle}>Enter your names and pick your vibe</Text>

                            {/* Your Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Your Name</Text>
                                <View style={[styles.inputRow, glassStyles.container, name1Focused && styles.inputRowFocused]}>
                                    <Ionicons name="person-outline" size={18} color={name1Focused ? '#FF6B35' : '#888'} />
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
                                    <Ionicons name="heart-outline" size={18} color={name2Focused ? '#FF6B35' : '#888'} />
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
                                            {!isSelected && <View style={[styles.vibeImg, { backgroundColor: v.solidColor, borderRadius: 12 }]} />}
                                            {isSelected && <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginBottom: 12 }} />}
                                            <Text style={[styles.vibeLabel, { color: isSelected ? '#fff' : '#1a1a1a' }]}>{v.label}</Text>
                                            <Text style={[styles.vibeDesc, { color: isSelected ? 'rgba(255,255,255,0.8)' : '#666' }]}>{v.desc}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Start Button */}
                            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
                                <LinearGradient colors={['#FF6B35', '#FF9800']} style={styles.startGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                    <View style={styles.btnContent}>
                                        <Text style={styles.startText}>Start Rumble!</Text>
                                        <Ionicons name="sparkles" size={18} color="#fff" />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Trust line */}
                            <View style={styles.trustRow}>
                                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                                <Text style={styles.trustText}>5 FREE dare cards • Private & Encrypted</Text>
                            </View>
                        </Animated.View>

                        <View style={{ height: 60 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40, alignItems: 'center' },
    
    logoSection: { alignItems: 'center', marginBottom: 32 },
    logoCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    brandName: { fontFamily: 'Pacifico_400Regular', fontSize: 48, color: '#fff', letterSpacing: 0.5, lineHeight: 60 },
    brandTagline: { fontSize: 15, color: 'rgba(255,255,255,0.9)', fontWeight: '700', letterSpacing: 0.2 },

    card: { borderRadius: 32, padding: 24, width: '100%', maxWidth: 420 },
    cardTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', marginBottom: 6, textAlign: 'center' },
    cardSubtitle: { fontSize: 14, color: '#666', marginBottom: 28, textAlign: 'center', fontWeight: '500' },

    inputGroup: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '800', color: '#555', marginBottom: 8, marginLeft: 4 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 2, gap: 10, backgroundColor: 'rgba(0,0,0,0.02)' },
    inputRowFocused: { borderColor: '#FF6B35', borderBottomWidth: 2 },
    input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1a1a1a', fontWeight: '600' },

    vibeTitle: { fontSize: 13, fontWeight: '800', color: '#555', marginBottom: 12, marginTop: 4, marginLeft: 4 },
    vibeRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
    vibeCard: { flex: 1, alignItems: 'center', paddingVertical: 20, paddingHorizontal: 4, borderRadius: 22, overflow: 'hidden' },
    vibeCardSelected: { borderColor: 'transparent' },
    vibeImg: { width: 40, height: 40, marginBottom: 10 },
    vibeLabel: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
    vibeDesc: { fontSize: 10, fontWeight: '700', textAlign: 'center' },

    startBtn: { borderRadius: 20, overflow: 'hidden' },
    startGradient: { paddingVertical: 18 },
    btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    startText: { color: '#fff', fontSize: 18, fontWeight: '900' },

    trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
    trustText: { fontSize: 12, color: '#999', fontWeight: '700' },
});
