import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, StatusBar,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../src/constants/glass';

const { width } = Dimensions.get('window');

const BG_COLORS = ['#F5FAF9', '#E0F2F1', '#B2DFDB'];

export default function VerificationScreen() {
    const router = useRouter();
    const [otp, setOtp] = useState(['', '', '', '']);

    const handleBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/signup');
    };

    const handleVerify = () => {
        router.replace('/welcome');
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" />
                <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, glassStyles.header]}>
                    <TouchableOpacity onPress={handleBack} style={[styles.backBtn, glassStyles.container]}>
                        <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { fontFamily: 'Pacifico_400Regular' }]}>Rumbala</Text>
                    <View style={{ width: 44 }} />
                </Animated.View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.content}>
                        <View style={[styles.iconCircle, glassStyles.container, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                            <Ionicons name="heart" size={46} color="#FF6B35" />
                            <View style={[styles.lockBadge, glassStyles.container, { backgroundColor: '#FF6B35', padding: 0 }]}>
                                <Ionicons name="lock-closed" size={12} color="#fff" />
                            </View>
                        </View>

                        <Text style={styles.title}>Verification</Text>
                        <Text style={styles.subtitle}>
                            We sent a 4-digit code to {'\n'}
                            <Text style={styles.emailHighlight}>alex@example.com</Text>. Enter it below to continue.
                        </Text>

                        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={[styles.otpCard, glassStyles.container]}>
                            <View style={styles.otpRow}>
                                {[0, 1, 2, 3].map((i) => (
                                    <View key={i} style={[styles.otpBox, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                        <Text style={styles.otpDot}>•</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerify} activeOpacity={0.85}>
                                <LinearGradient 
                                    colors={['#FF6B35', '#FF9800']} 
                                    style={styles.btnGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <View style={styles.btnContent}>
                                        <Text style={styles.primaryBtnText}>Verify & Proceed</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text style={styles.resendText}>
                                Didn't receive the code? <Text style={styles.resendLink}>Resend Code</Text>
                            </Text>

                            <TouchableOpacity style={styles.footer} onPress={() => router.push('/login')}>
                                <Ionicons name="arrow-back-circle" size={20} color="#666" style={{ marginRight: 8 }} />
                                <Text style={styles.footerText}>Back to Sign In</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </Animated.View>
                </ScrollView>
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
    content: { alignItems: 'center', paddingTop: 20 },
    
    iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    lockBadge: { position: 'absolute', bottom: 10, right: 10, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },

    title: { fontSize: 32, fontWeight: '900', color: '#1a1a1a', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 32, fontWeight: '500' },
    emailHighlight: { color: '#FF6B35', fontWeight: '800' },

    otpCard: { width: '100%', padding: 24, borderRadius: 32, alignItems: 'center' },
    otpRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    otpBox: { width: 60, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    otpDot: { fontSize: 24, color: '#ccc' },

    primaryBtn: { width: '100%', height: 56, borderRadius: 18, overflow: 'hidden', marginBottom: 24 },
    btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },

    resendText: { fontSize: 14, color: '#888', marginBottom: 32, fontWeight: '500' },
    resendLink: { color: '#FF6B35', fontWeight: '900', textDecorationLine: 'underline' },

    footer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    footerText: { fontSize: 15, color: '#666', fontWeight: '800' },
});
