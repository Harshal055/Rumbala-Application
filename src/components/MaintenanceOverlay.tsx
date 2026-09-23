import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function MaintenanceOverlay() {
    const remoteConfigs = useStore(state => state.remoteConfigs);
    const maintenance = remoteConfigs?.maintenance_mode;

    if (!maintenance?.enabled) return null;

    return (
        <Modal visible={true} transparent={false} animationType="fade" statusBarTranslucent>
            <LinearGradient colors={['#0F051D', '#1A0B2E', '#0B0D14']} style={styles.container}>
                <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }} edges={['top', 'left', 'right', 'bottom']}>
                    <View style={styles.card}>
                        <View style={styles.iconWrap}>
                            <Ionicons name="construct-outline" size={48} color="#FF6B35" />
                        </View>
                        <Text style={styles.title}>Under Maintenance</Text>
                        <Text style={styles.message}>
                            {maintenance.message || 'Rumbala is currently undergoing scheduled maintenance. Please check back shortly!'}
                        </Text>
                        <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={() => useStore.getState().fetchRemoteConfigs()}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={styles.retryText}>Check Status</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.25)',
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
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B35',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
