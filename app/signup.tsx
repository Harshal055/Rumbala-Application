import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../src/store/useStore';
import { signupV2 } from '../src/services/api';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../src/constants/glass';
import LegalModal from '../src/components/LegalModal';

const { width } = Dimensions.get('window');

const BG_COLORS = ['#F5FAF9', '#E0F2F1', '#B2DFDB'];

export default function SignupScreen() {
    const router = useRouter();
    const { login, showAlert } = useStore();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agree, setAgree] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [legalVisible, setLegalVisible] = useState(false);
    const [legalType, setLegalType] = useState<'terms' | 'privacy'>('terms');

    const handleBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/onboarding');
    };

    const handleSignup = async () => {
        if (!fullName.trim() || !email.trim() || !password) {
            showAlert('Missing Information', 'Please provide all required details to set up your account.');
            return;
        }
        if (!agree) {
            showAlert('Privacy & Terms', 'Please accept our Terms and Privacy Policy to proceed with registration.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await signupV2(email.trim(), password);
            if (result.needs_email_confirmation) {
                showAlert('Email Verification', result.message || 'A confirmation email has been sent to your address.');
                router.push('/login');
            } else {
                router.replace('/subscription');
            }
        } catch (error: any) {
            showAlert('Registration Error', error.message || 'We couldn\'t create your account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    style={{ flex: 1 }}
                >
                    <ScrollView 
                        contentContainerStyle={styles.scroll} 
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Animated.View entering={FadeInDown.duration(500)} style={[styles.topHeader, glassStyles.header]}>
                            <TouchableOpacity onPress={handleBack} style={[styles.backBtn, glassStyles.container]}>
                                <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                            </TouchableOpacity>
                            <Text style={[styles.headerTitle, { fontFamily: 'Pacifico_400Regular' }]}>Rumbala</Text>
                            <View style={{ width: 44 }} />
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.logoHeader}>
                            <View style={[styles.logoBox, glassStyles.container]}>
                                <LinearGradient colors={['#FF6B35', '#FF9800']} style={styles.logoGradient}>
                                    <Ionicons name="heart" size={32} color="#fff" />
                                </LinearGradient>
                            </View>
                            <Text style={styles.title}>Join Rumbala</Text>
                            <Text style={styles.subtitle}>The ultimate couple's gaming experience</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={[styles.form, glassStyles.container, { padding: 24, borderRadius: 32 }]}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={[styles.inputRow, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                    <Ionicons name="person-outline" size={20} color="#888" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="John Doe"
                                        placeholderTextColor="#999"
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={[styles.inputRow, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                    <Ionicons name="mail-outline" size={20} color="#888" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="john@example.com"
                                        placeholderTextColor="#999"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={[styles.inputRow, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#888" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="#999"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <View style={styles.checkboxRow}>
                                <TouchableOpacity 
                                    style={[styles.checkbox, glassStyles.container, agree && styles.checkboxActive]}
                                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAgree(!agree); }}
                                    activeOpacity={0.7}
                                >
                                    {agree && <Ionicons name="checkmark" size={14} color="#fff" />}
                                </TouchableOpacity>
                                <Text style={styles.checkboxText}>
                                    I agree to the{' '}
                                    <Text 
                                        style={styles.linkText} 
                                        onPress={() => { setLegalType('terms'); setLegalVisible(true); }}
                                    >
                                        Terms
                                    </Text>
                                    {' '}and{' '}
                                    <Text 
                                        style={styles.linkText} 
                                        onPress={() => { setLegalType('privacy'); setLegalVisible(true); }}
                                    >
                                        Privacy Policy
                                    </Text>
                                </Text>
                            </View>

                            <TouchableOpacity style={styles.primaryBtn} onPress={handleSignup} disabled={isLoading} activeOpacity={0.85}>
                                <LinearGradient 
                                    colors={['#FF6B35', '#FF4D17']} 
                                    style={styles.btnGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.primaryBtnText}>Create Account</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.line} />
                                <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
                                <View style={styles.line} />
                            </View>

                            <View style={styles.socialRow}>
                                <TouchableOpacity style={[styles.socialBtn, glassStyles.container]}>
                                    <Ionicons name="logo-google" size={20} color="#4285F4" />
                                    <Text style={styles.socialBtnText}>Google</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.socialBtn, glassStyles.container]}>
                                    <Ionicons name="logo-apple" size={20} color="#000" />
                                    <Text style={styles.socialBtnText}>Apple</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity 
                                style={styles.footer} 
                                onPress={() => router.push('/login')}
                            >
                                <Text style={styles.footerText}>
                                    Already have an account? <Text style={styles.footerLink}>Log In</Text>
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </KeyboardAvoidingView>

                <LegalModal 
                    visible={legalVisible} 
                    type={legalType} 
                    onClose={() => setLegalVisible(false)} 
                />
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60 },
    topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginBottom: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, color: '#1a1a1a' },
    
    logoHeader: { alignItems: 'center', marginBottom: 28 },
    logoBox: { width: 72, height: 72, borderRadius: 20, overflow: 'hidden', padding: 0 },
    logoGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontFamily: 'Pacifico_400Regular', color: '#1a1a1a', marginTop: 12, marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#666', textAlign: 'center', fontWeight: '500' },

    form: { width: '100%' },
    inputGroup: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '800', color: '#555', marginBottom: 8, marginLeft: 4 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 10 },
    input: { flex: 1, fontSize: 16, color: '#1a1a1a', fontWeight: '600' },

    checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28, paddingHorizontal: 4 },
    checkbox: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)' },
    checkboxActive: { backgroundColor: '#FF6B35', borderColor: 'transparent' },
    checkboxText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18, fontWeight: '500' },
    linkText: { color: '#FF6B35', fontWeight: '800' },

    primaryBtn: { width: '100%', height: 56, borderRadius: 18, overflow: 'hidden', marginBottom: 28 },
    btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },

    divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    line: { flex: 1, height: 1.5, backgroundColor: 'rgba(0,0,0,0.05)' },
    dividerText: { fontSize: 11, fontWeight: '800', color: '#999', letterSpacing: 1 },

    socialRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
    socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.4)' },
    socialBtnText: { fontSize: 15, fontWeight: '800', color: '#444' },

    footer: { alignItems: 'center' },
    footerText: { fontSize: 15, color: '#666', fontWeight: '500' },
    footerLink: { color: '#FF6B35', fontWeight: '900' },
});
