import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, StatusBar, Image,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useStore } from '../src/store/useStore';
import { loginV2, setTokens } from '../src/services/api';
import { initNotifications } from '../src/services/notificationService';
import { initRevenueCat, getCustomerInfo, checkProEntitlement } from '../src/services/revenueCatService';
import { supabase } from '../src/services/supabase';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../src/constants/glass';

const { width } = Dimensions.get('window');

const BG_COLORS = ['#F5FAF9', '#E0F2F1', '#B2DFDB'];

export default function LoginScreen() {
    const router = useRouter();
    const { login, showAlert } = useStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    React.useEffect(() => {
        const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
        console.log('LoginScreen: Configuring GoogleSignin with webClientId:', webClientId);
        if (webClientId) {
            GoogleSignin.configure({
                webClientId: webClientId,
                offlineAccess: true,
                forceCodeForRefreshToken: true,
            });
        }
    }, []);

    const handleGoogleSignIn = async () => {
        try {
            setGoogleLoading(true);
            if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
                throw new Error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env');
            }
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            await GoogleSignin.signOut().catch(() => null);
            const result = await GoogleSignin.signIn();
            
            if (result.type === 'cancelled') {
                console.log('Google Sign-In: User cancelled the flow.');
                return;
            }

            if (!result.data) {
                console.error('Google Sign-In: Result data is null but type is not cancelled', result);
                throw new Error('Google Sign-In failed: No user data received.');
            }

            const idToken = result.data.idToken;

            if (!idToken) {
                console.error('Google Sign-In: No idToken found in successful result', result);
                throw new Error('Unable to complete Google Sign-In. Error: Missing ID Token. Please try again or use email.');
            }

            const { data: sessionData, error: sessionError } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: idToken,
            });

            if (sessionError) throw new Error(sessionError.message);
            const userId = sessionData?.user?.id;
            if (!userId) throw new Error('We couldn\'t complete your social login. Please try again.');

            const { postAuthSync } = await import('../src/services/api');
            await postAuthSync(userId);

            const state = useStore.getState();
            if (state.isPro || state.hasSeenSubscription) router.replace('/(tabs)');
            else router.replace('/subscription');
        } catch (error: any) {
            if (error?.code !== statusCodes.SIGN_IN_CANCELLED) {
                showAlert('Sign-In Error', error.message || 'We couldn\'t sign you in with Google. Please try again.');
            }
        } finally { setGoogleLoading(false); }
    };

    const handleBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/onboarding');
    };

    const handleLogin = async () => {
        if (!email.trim() || !password) { 
            showAlert('Missing Information', 'Please enter both email and password.'); 
            return; 
        }
        setIsLoading(true);
        try {
            const result = await loginV2(email.trim().toLowerCase(), password);
            if (result.session?.access_token && result.session?.refresh_token) {
                setTokens(result.session.access_token, result.session.refresh_token);
            }
            // Store is already updated by postAuthSync inside loginV2
            const state = useStore.getState();
            if (state.isPro || state.hasSeenSubscription) router.replace('/(tabs)');
            else router.replace('/subscription');
        } catch (error: any) { 
            showAlert('Login Failed', error.message || 'Check your credentials and try again.'); 
        }
        finally { setIsLoading(false); }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" />
                
                <Animated.View 
                    entering={FadeInDown.delay(100).duration(600)} 
                    renderToHardwareTextureAndroid={true}
                    style={[styles.header, glassStyles.container]}
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
                                    <Ionicons name="heart" size={50} color="#fff" />
                                </LinearGradient>
                            </View>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Log in to keep the spark alive</Text>
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
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={[styles.inputRow, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                    <Ionicons name="lock-closed" size={20} color="#888" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="#999"
                                        value={password}
                                        secureTextEntry={!showPassword}
                                        onChangeText={setPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#888" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.forgotBtn}>
                                <Text style={styles.forgotText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
                                <LinearGradient 
                                    colors={['#FF6B35', '#FF4D17']} 
                                    style={styles.loginBtnGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Login</Text>}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.line} />
                                <Text style={styles.dividerText}>Or continue with</Text>
                                <View style={styles.line} />
                            </View>

                            <View style={styles.socialRow}>
                                <TouchableOpacity 
                                    style={[styles.socialBtn, glassStyles.container, googleLoading && styles.socialBtnDisabled]} 
                                    onPress={handleGoogleSignIn}
                                    disabled={googleLoading}
                                >
                                    {googleLoading ? (
                                        <ActivityIndicator size="small" color="#FF6B35" />
                                    ) : (
                                        <>
                                            <Ionicons name="logo-google" size={20} color="#4285F4" />
                                            <Text style={styles.socialBtnText}>Google</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.socialBtn, glassStyles.container]}>
                                    <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                                    <Text style={styles.socialBtnText}>Facebook</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.signupLink} onPress={() => router.push('/signup')}>
                                <Text style={styles.signupText}>
                                    Don't have an account? <Text style={styles.signupBold}>Sign Up</Text>
                                </Text>
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
    inputGroup: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '800', color: '#555', marginBottom: 8, marginLeft: 4 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 },
    input: { flex: 1, fontSize: 16, color: '#1a1a1a', fontWeight: '600' },

    forgotBtn: { alignSelf: 'flex-end', marginBottom: 28, marginRight: 4 },
    forgotText: { color: '#FF6B35', fontSize: 14, fontWeight: '800' },

    loginBtn: { width: '100%', height: 56, borderRadius: 18, overflow: 'hidden', marginBottom: 28 },
    loginBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loginBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },

    divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    line: { flex: 1, height: 1.5, backgroundColor: 'rgba(0,0,0,0.05)' },
    dividerText: { fontSize: 13, color: '#999', fontWeight: '700' },

    socialRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 16, gap: 10, backgroundColor: 'rgba(255,255,255,0.4)' },
    socialBtnDisabled: { opacity: 0.6 },
    socialBtnText: { fontSize: 15, fontWeight: '800', color: '#444' },

    signupLink: { alignSelf: 'center' },
    signupText: { fontSize: 15, color: '#666', fontWeight: '500' },
    signupBold: { color: '#FF6B35', fontWeight: '900' },
});
