import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../src/store/useStore';
import { resetPasswordV2 } from '../src/services/api';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles } from '../src/constants/glass';

const BG_COLORS = ['#F5FAF9', '#E0F2F1', '#B2DFDB'];

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { showAlert } = useStore();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/login');
    };

    const handleSendResetLink = async () => {
        if (!email.trim()) { 
            showAlert('Missing Information', 'Please enter your email address.'); 
            return; 
        }
        setIsLoading(true);
        try {
            await resetPasswordV2(email.trim().toLowerCase());
            showAlert('Check Your Email', 'If an account with that email exists, we have sent a password reset link.');
            router.replace('/login');
        } catch (error: any) { 
            showAlert('Error', error.message || 'Failed to send reset email. Please try again.'); 
        } finally { 
            setIsLoading(false); 
        }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" />
                
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
                    <ScrollView 
                        contentContainerStyle={styles.scroll} 
                        keyboardShouldPersistTaps="handled" 
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View 
                            entering={FadeInDown.delay(200).duration(800)} 
                            renderToHardwareTextureAndroid={true}
                            style={styles.logoContainer}
                        >
                            <View style={[styles.logoBox, glassStyles.container]}>
                                <LinearGradient colors={['#FF6B35', '#FF9800']} style={styles.logoGradient}>
                                    <Ionicons name="key" size={50} color="#fff" />
                                </LinearGradient>
                            </View>
                            <Text style={styles.title}>Reset Password</Text>
                            <Text style={styles.subtitle}>Enter your email to receive a reset link</Text>
                        </Animated.View>

                        <Animated.View 
                            entering={FadeInUp.delay(400).duration(800)} 
                            renderToHardwareTextureAndroid={true}
                            style={[styles.card, glassStyles.container]}
                        >
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
                                    />
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={styles.submitBtn} 
                                onPress={handleSendResetLink} 
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
                                        <Text style={styles.submitBtnText}>Send Reset Link</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
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
    
    logoContainer: { alignItems: 'center', marginTop: 20, marginBottom: 32 },
    logoBox: { width: 100, height: 100, borderRadius: 28, overflow: 'hidden', padding: 0 },
    logoGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 32, fontFamily: 'Pacifico_400Regular', color: '#1a1a1a', marginTop: 16, marginBottom: 4 },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', fontWeight: '500' },

    card: { borderRadius: 32, padding: 24, width: '100%' },
    inputGroup: { marginBottom: 28 },
    label: { fontSize: 13, fontWeight: '800', color: '#555', marginBottom: 8, marginLeft: 4 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 },
    input: { flex: 1, fontSize: 16, color: '#1a1a1a', fontWeight: '600' },

    submitBtn: { width: '100%', height: 56, borderRadius: 18, overflow: 'hidden', marginBottom: 8 },
    submitBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
});
