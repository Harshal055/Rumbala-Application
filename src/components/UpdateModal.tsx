import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Platform,
    Linking,
    ScrollView,
} from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store/useStore';
import { glassStyles } from '../constants/glass';

const DISMISSED_UPDATE_KEY = '@Rumbala_dismissed_update_version';
const PLAY_STORE_URL = 'market://details?id=com.andx.rumbala';
const PLAY_STORE_WEB_URL = 'https://play.google.com/store/apps/details?id=com.andx.rumbala';
const APP_STORE_URL = 'https://apps.apple.com/app/idYOUR_APP_ID';

export default function UpdateModal() {
    const remoteConfigs = useStore(state => state.remoteConfigs);
    const [visible, setVisible] = useState(false);
    const [isForce, setIsForce] = useState(false);
    const [targetVersionCode, setTargetVersionCode] = useState<number>(0);
    const [updateTitle, setUpdateTitle] = useState('New Update Available!');
    const [updateMessage, setUpdateMessage] = useState(
        'A fresh version of Rumbala is available with exciting new features, smoother video calls, and romantic experiences!'
    );
    const [whatsNewList, setWhatsNewList] = useState<string[]>([]);

    useEffect(() => {
        checkVersionStatus();
    }, [remoteConfigs]);

    const checkVersionStatus = async () => {
        try {
            // Get current installed version code
            let currentCode = 0;
            if (Platform.OS === 'android') {
                const nativeCode = Application.nativeBuildVersion;
                currentCode = nativeCode ? parseInt(nativeCode, 10) : (Constants.expoConfig?.android?.versionCode || 8);
            } else if (Platform.OS === 'ios') {
                const nativeCode = Application.nativeBuildVersion;
                currentCode = nativeCode ? parseInt(nativeCode, 10) : (Constants.expoConfig?.ios?.buildNumber ? parseInt(Constants.expoConfig.ios.buildNumber, 10) : 8);
            }

            if (!currentCode || isNaN(currentCode)) {
                currentCode = 8;
            }

            const minConfig = remoteConfigs?.min_app_version;
            const latestConfig = remoteConfigs?.latest_app_version;

            const targetMin = Platform.OS === 'ios' ? (minConfig?.ios || 0) : (minConfig?.android || 0);
            const targetLatest = Platform.OS === 'ios' ? (latestConfig?.ios || targetMin) : (latestConfig?.android || targetMin);
            const isEnforced = Boolean(minConfig?.enforce && currentCode < targetMin);

            // 1. Force Update condition
            if (isEnforced) {
                setIsForce(true);
                setTargetVersionCode(targetMin);
                setUpdateTitle(minConfig?.title || 'Update Required');
                setUpdateMessage(
                    minConfig?.message ||
                    'Please update Rumbala to the latest version to continue enjoying romantic dares and multiplayer games.'
                );
                setWhatsNewList(
                    minConfig?.whats_new && Array.isArray(minConfig.whats_new)
                        ? minConfig.whats_new
                        : [
                            'Enhanced connection stability & 16 KB compatibility',
                            'Optimized video calling & faster dare sync',
                            'Bug fixes and performance upgrades'
                        ]
                );
                setVisible(true);
                return;
            }

            // 2. Soft / Recommended Update condition
            if (targetLatest > currentCode) {
                // Check if user already dismissed this specific version
                const dismissed = await AsyncStorage.getItem(DISMISSED_UPDATE_KEY);
                if (dismissed && parseInt(dismissed, 10) >= targetLatest) {
                    // Already dismissed for this target version
                    setVisible(false);
                    return;
                }

                setIsForce(false);
                setTargetVersionCode(targetLatest);
                setUpdateTitle(latestConfig?.title || 'New Update Available! 🚀');
                setUpdateMessage(
                    latestConfig?.message ||
                    'A new version of Rumbala is here with enhanced features and improvements.'
                );
                setWhatsNewList(
                    latestConfig?.whats_new && Array.isArray(latestConfig.whats_new)
                        ? latestConfig.whats_new
                        : [
                            'Exciting new dare cards & couple interactions',
                            'Smoother LDR video & audio streaming',
                            'Performance optimizations & UI polish'
                        ]
                );
                setVisible(true);
                return;
            }

            // All up to date
            setVisible(false);
        } catch (e) {
            if (__DEV__) console.warn('[UpdateModal] check error:', e);
        }
    };

    const handleOpenStore = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (Platform.OS === 'android') {
                const supported = await Linking.canOpenURL(PLAY_STORE_URL);
                if (supported) {
                    await Linking.openURL(PLAY_STORE_URL);
                } else {
                    await Linking.openURL(PLAY_STORE_WEB_URL);
                }
            } else {
                await Linking.openURL(APP_STORE_URL);
            }
        } catch (e) {
            Linking.openURL(PLAY_STORE_WEB_URL).catch(() => {});
        }
    };

    const handleDismissSoftUpdate = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (targetVersionCode > 0) {
                await AsyncStorage.setItem(DISMISSED_UPDATE_KEY, String(targetVersionCode));
            }
            setVisible(false);
        } catch {}
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
            onRequestClose={() => {
                if (!isForce) handleDismissSoftUpdate();
            }}
        >
            <View style={styles.backdrop}>
                <View style={[styles.card, glassStyles.container]}>
                    {/* Header Icon / Badge */}
                    <View style={styles.iconCircle}>
                        <LinearGradient
                            colors={isForce ? ['#FF416C', '#FF4B2B'] : ['#FF6B35', '#FF8E53']}
                            style={styles.gradientBadge}
                        >
                            <Ionicons
                                name={isForce ? 'shield-checkmark' : 'rocket-outline'}
                                size={36}
                                color="#FFFFFF"
                            />
                        </LinearGradient>
                    </View>

                    <Text style={styles.title}>{updateTitle}</Text>
                    <Text style={styles.message}>{updateMessage}</Text>

                    {/* What's New bullet points */}
                    {whatsNewList.length > 0 && (
                        <View style={styles.whatsNewBox}>
                            <Text style={styles.whatsNewHeader}>WHAT'S NEW</Text>
                            <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator={false}>
                                {whatsNewList.map((item, idx) => (
                                    <View key={idx} style={styles.bulletRow}>
                                        <Ionicons name="sparkles" size={13} color="#FF6B35" style={{ marginTop: 2 }} />
                                        <Text style={styles.bulletText}>{item}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={handleOpenStore}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#FF6B35', '#E84A1C']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.btnGradient}
                            >
                                <Ionicons name="logo-google-playstore" size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.primaryBtnText}>
                                    {isForce ? 'Update to Continue' : 'Update Now'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {!isForce && (
                            <TouchableOpacity
                                style={styles.secondaryBtn}
                                onPress={handleDismissSoftUpdate}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.secondaryBtnText}>Maybe Later</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(10, 5, 25, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: 'rgba(30, 20, 55, 0.95)',
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.3)',
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
    },
    iconCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        padding: 3,
    },
    gradientBadge: {
        width: '100%',
        height: '100%',
        borderRadius: 38,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF4B2B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
        color: 'rgba(255, 255, 255, 0.75)',
        textAlign: 'center',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    whatsNewBox: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    whatsNewHeader: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        color: '#FF6B35',
        marginBottom: 8,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 6,
    },
    bulletText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 16,
        color: '#E2E8F0',
    },
    actionContainer: {
        width: '100%',
        gap: 10,
    },
    primaryBtn: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    btnGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    secondaryBtn: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryBtnText: {
        color: 'rgba(255, 255, 255, 0.55)',
        fontSize: 14,
        fontWeight: '600',
    },
});
