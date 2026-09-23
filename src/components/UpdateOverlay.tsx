import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import { useStore } from '../store/useStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ANDROID_PACKAGE = 'com.andx.rumbala';
const IOS_APP_ID = ''; // e.g. 'id1234567890' once the app is live on the App Store

/**
 * Reads the device's current native build number.
 * Android: versionCode (e.g. "7").  iOS: build number (e.g. "7").
 * Returns 0 when it can't be resolved (e.g. Expo Go / web) so the gate stays open.
 */
function getCurrentBuild(): number {
    const raw = Application.nativeBuildVersion; // string | null
    const parsed = parseInt(raw ?? '', 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

function openStore(androidUrl?: string, iosUrl?: string) {
    let url: string;
    if (Platform.OS === 'ios') {
        url = iosUrl || (IOS_APP_ID ? `https://apps.apple.com/app/${IOS_APP_ID}` : 'https://apps.apple.com');
    } else {
        // Prefer the native Play Store app; fall back to the web listing.
        url = androidUrl || `market://details?id=${ANDROID_PACKAGE}`;
    }
    Linking.openURL(url).catch(() => {
        // market:// can fail if the Play Store app is missing — use the web listing.
        Linking.openURL(`https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`).catch(() => {});
    });
}

export default function UpdateOverlay() {
    const remoteConfigs = useStore(state => state.remoteConfigs);
    const [dismissed, setDismissed] = useState(false);

    // Support both config schemas (min_app_version / latest_app_version from Admin & app_update)
    const minConfig = remoteConfigs?.min_app_version;
    const latestConfig = remoteConfigs?.latest_app_version;
    const appUpdate = remoteConfigs?.app_update;

    const isIOS = Platform.OS === 'ios';
    let min = (isIOS ? (minConfig?.ios ?? appUpdate?.min_ios) : (minConfig?.android ?? appUpdate?.min_android)) ?? 0;
    let latest = (isIOS ? (latestConfig?.ios ?? appUpdate?.latest_ios ?? min) : (latestConfig?.android ?? appUpdate?.latest_android ?? min)) ?? 0;
    let isEnforced = Boolean(minConfig?.enforce || appUpdate?.enabled);

    const current = getCurrentBuild();
    if (current <= 0) return null; // can't determine build — don't block the user

    const needsForce = isEnforced && current < min;
    const needsSoft = !needsForce && current < latest;

    if (!needsForce && !needsSoft) return null;
    if (needsSoft && dismissed) return null;

    const title = needsForce
        ? (minConfig?.title || 'Update Required')
        : (latestConfig?.title || 'New Update Available');

    const message = needsForce
        ? (minConfig?.message || appUpdate?.force_message || 'Please update Rumbala to the latest version to continue.')
        : (latestConfig?.message || appUpdate?.message || 'A new version of Rumbala is available. Update now for the latest features!');

    return (
        <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => { /* block hardware back on force */ }}>
            <View style={styles.backdrop}>
                <LinearGradient
                    colors={['rgba(26, 11, 46, 0.96)', 'rgba(15, 5, 29, 0.96)']}
                    style={StyleSheet.absoluteFill}
                />
                <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', padding: 24 }} edges={['top', 'left', 'right', 'bottom']}>
                    <View style={styles.card}>
                        <View style={styles.iconWrap}>
                            <Ionicons name="rocket-outline" size={44} color="#FF6B35" />
                        </View>

                        <Text style={styles.title}>{title} 🚀</Text>
                        <Text style={styles.message}>{message}</Text>

                        <TouchableOpacity
                            style={styles.updateBtn}
                            onPress={() => openStore(appUpdate?.android_url, appUpdate?.ios_url)}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="cloud-download-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.updateText}>Update Now</Text>
                        </TouchableOpacity>

                        {needsSoft && (
                            <TouchableOpacity style={styles.laterBtn} onPress={() => setDismissed(true)} activeOpacity={0.7}>
                                <Text style={styles.laterText}>Maybe Later</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.28)',
    },
    iconWrap: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(255, 107, 53, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#CBD5E1',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 26,
    },
    updateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6B35',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 16,
        width: '100%',
    },
    updateText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    laterBtn: {
        marginTop: 14,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    laterText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
    },
});
