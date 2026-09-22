import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, StatusBar,
    TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../src/store/useStore';
import { resetPasswordV2, verifyPasswordResetOtp } from '../src/services/api';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles } from '../src/constants/glass';
import * as Haptics from 'expo-haptics';

const BG_COLORS = ['#F5FAF9', '#E0F2F1', '#B2DFDB'];

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { showAlert } = useStore();

    // Step state: 'request' (enter email) | 'verify' (enter OTP and new password)
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Cooldown timer for resend OTP
    useEffect(() => {
        let timer: any;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleBack = () => {
        if (step === 'verify') {
            setStep('request');
        } else if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/login');
        }
    };

    // Step 1: Send OTP to email
    const handleSendResetOtp = async () => {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
            showAlert('Missing Email', 'Please enter your email address.');
            return;
        }

        setIsLoading(true);
        try {
            await resetPasswordV2(cleanEmail);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            showAlert('Code Sent!', `We have sent a verification code to ${cleanEmail}. Check your inbox or spam folder.`);
            setStep('verify');
            setResendCooldown(60);
        } catch (error: any) {
            showAlert('Error', error.message || 'Failed to send reset code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify OTP and set new password
    const handleVerifyAndReset = async () => {
        const cleanEmail = email.trim().toLowerCase();
        const cleanOtp = otp.trim();

        if (!cleanOtp || cleanOtp.length < 6 || cleanOtp.length > 8) {
            showAlert('Invalid Code', 'Please enter the verification code.');
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            showAlert('Weak Password', 'New password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert('Mismatch', 'Passwords do not match. Please check and try again.');
            return;
        }

        setIsLoading(true);
        try {
            await verifyPasswordResetOtp(cleanEmail, cleanOtp, newPassword);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            showAlert('Success! 🎉', 'Your password has been reset successfully. Please log in with your new password.');
            router.replace({
                pathname: '/login',
                params: { prefillEmail: cleanEmail }
            });
        } catch (error: any) {
            showAlert('Reset Failed', error.message || 'Invalid or expired code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
                <StatusBar barStyle="dark-content" />

                {/* Top Navigation Bar */}
                <Animated.View
                    entering={FadeInDown.delay(100).duration(600)}
                    renderToHardwareTextureAndroid={true}
                    style={[styles.header, glassStyles.header]}
                >
                    <TouchableOpacity onPress={handleBack} style={[styles.backBtn, glassStyles.container]}>
                        <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { fontFamily: 'Pacifico_400Regular' }]}>Rumbala</Text>
                    <View style={{ width: 44 }} />
                </Animated.View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView
                            contentContainerStyle={styles.scroll}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Logo and Screen Header */}
                            <Animated.View
                                entering={FadeInDown.delay(200).duration(800)}
                                renderToHardwareTextureAndroid={true}
                                style={styles.logoContainer}
                            >
                                <View style={[styles.logoBox, glassStyles.container]}>
                                    <LinearGradient colors={['#FF6B35', '#FF9800']} style={styles.logoGradient}>
                                        <Ionicons name={step === 'request' ? 'key' : 'shield-checkmark'} size={48} color="#fff" />
                                    </LinearGradient>
                                </View>
                                <Text style={styles.title}>
                                    {step === 'request' ? 'Forgot Password?' : 'Enter Reset Code'}
                                </Text>
                                <Text style={styles.subtitle}>
                                    {step === 'request'
                                        ? 'Enter your email to receive a verification code'
                                        : `Enter the code sent to ${email}`}
                                </Text>
                            </Animated.View>

                            {/* Main Card */}
                            <Animated.View
                                entering={FadeInUp.delay(400).duration(800)}
                                renderToHardwareTextureAndroid={true}
                                style={[styles.card, glassStyles.container]}
                            >
                                {step === 'request' ? (
                                    /* ───────── STEP 1: Enter Email ───────── */
                                    <>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Email Address</Text>
                                            <View style={[styles.inputRow, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                                <Ionicons name="mail" size={20} color="#888" />
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="name@example.com"
                                                    placeholderTextColor="#999"
                                                    value={email}
                                                    onChangeText={setEmail}
                                                    autoCapitalize="none"
                                                    keyboardType="email-address"
                                                    autoCorrect={false}
                                                />
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.submitBtn}
                                            onPress={handleSendResetOtp}
                                            disabled={isLoading}
                                            activeOpacity={0.85}
                                        >
                                            <LinearGradient
                                                colors={['#FF6B35', '#FF4D17']}
                                                style={styles.submitBtnGradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                            >
                                                {isLoading ? (
                                                    <ActivityIndicator color="#fff" />
                                                ) : (
                                                    <Text style={styles.submitBtnText}>Send Reset Code</Text>
                                                )}
                                            </LinearGradient>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.backToLoginBtn}
                                            onPress={() => router.replace('/login')}
                                        >
                                            <Text style={styles.backToLoginText}>
                                                Remember your password? <Text style={styles.boldOrange}>Log In</Text>
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    /* ───────── STEP 2: Enter OTP & New Password ───────── */
                                    <>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Verification Code</Text>
                                            <View style={[styles.inputRow, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                                <Ionicons name="keypad-outline" size={20} color="#FF6B35" />
                                                <TextInput
                                                    style={[styles.input, styles.otpInput]}
                                                    placeholder="Enter code"
                                                    placeholderTextColor="#999"
                                                    value={otp}
                                                    onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 8))}
                                                    keyboardType="number-pad"
                                                    maxLength={8}
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>New Password</Text>
                                            <View style={[styles.inputRow, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                                <Ionicons name="lock-closed" size={20} color="#888" />
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="At least 6 characters"
                                                    placeholderTextColor="#999"
                                                    value={newPassword}
                                                    onChangeText={setNewPassword}
                                                    secureTextEntry={!showPassword}
                                                    autoCapitalize="none"
                                                />
                                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Confirm New Password</Text>
                                            <View style={[styles.inputRow, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                                <Ionicons name="lock-closed-outline" size={20} color="#888" />
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Repeat new password"
                                                    placeholderTextColor="#999"
                                                    value={confirmPassword}
                                                    onChangeText={setConfirmPassword}
                                                    secureTextEntry={!showPassword}
                                                    autoCapitalize="none"
                                                />
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.submitBtn}
                                            onPress={handleVerifyAndReset}
                                            disabled={isLoading}
                                            activeOpacity={0.85}
                                        >
                                            <LinearGradient
                                                colors={['#FF6B35', '#FF4D17']}
                                                style={styles.submitBtnGradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                            >
                                                {isLoading ? (
                                                    <ActivityIndicator color="#fff" />
                                                ) : (
                                                    <Text style={styles.submitBtnText}>Reset Password</Text>
                                                )}
                                            </LinearGradient>
                                        </TouchableOpacity>

                                        {/* Resend Code & Change Email Row */}
                                        <View style={styles.footerRow}>
                                            <TouchableOpacity
                                                onPress={handleSendResetOtp}
                                                disabled={resendCooldown > 0 || isLoading}
                                                style={styles.resendBtn}
                                            >
                                                <Text style={[styles.footerLinkText, resendCooldown > 0 && { color: '#999' }]}>
                                                    {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity onPress={() => setStep('request')}>
                                                <Text style={styles.footerLinkText}>Change email</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, color: '#1a1a1a' },
    scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60 },

    logoContainer: { alignItems: 'center', marginTop: 16, marginBottom: 24 },
    logoBox: { width: 90, height: 90, borderRadius: 26, overflow: 'hidden', padding: 0 },
    logoGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontFamily: 'Pacifico_400Regular', color: '#1a1a1a', marginTop: 14, marginBottom: 4, textAlign: 'center' },
    subtitle: { fontSize: 14, color: '#666', textAlign: 'center', fontWeight: '500', paddingHorizontal: 16 },

    card: { borderRadius: 32, padding: 24, width: '100%' },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '800', color: '#555', marginBottom: 8, marginLeft: 4 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 },
    input: { flex: 1, fontSize: 16, color: '#1a1a1a', fontWeight: '600' },
    otpInput: { fontSize: 22, letterSpacing: 6, fontWeight: '800', color: '#FF6B35' },

    submitBtn: { width: '100%', height: 56, borderRadius: 18, overflow: 'hidden', marginTop: 8, marginBottom: 12 },
    submitBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },

    backToLoginBtn: { alignItems: 'center', paddingVertical: 12 },
    backToLoginText: { fontSize: 14, color: '#666', fontWeight: '600' },
    boldOrange: { color: '#FF6B35', fontWeight: '800' },

    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingHorizontal: 4 },
    resendBtn: { paddingVertical: 8 },
    footerLinkText: { fontSize: 14, color: '#FF6B35', fontWeight: '700' },
});

