import React from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    ScrollView, Dimensions, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { glassStyles, glassTokens } from '../constants/glass';

interface LegalModalProps {
    visible: boolean;
    onClose: () => void;
    type: 'terms' | 'privacy';
}

export default function LegalModal({ visible, onClose, type }: LegalModalProps) {
    const title = type === 'terms' ? 'Terms of Service' : 'Privacy Policy';
    
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
            hardwareAccelerated={true}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
                
                <View style={[styles.container, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#1a1a1a" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView 
                        style={styles.content} 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >
                        {type === 'terms' ? <TermsContent /> : <PrivacyContent />}
                    </ScrollView>
                    
                    <TouchableOpacity style={styles.doneBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClose(); }} activeOpacity={0.8}>
                        <LinearGradient colors={['#1a1a1a', '#333333']} style={styles.doneBtnGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                            <Text style={styles.doneBtnText}>I Understand</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const TermsContent = () => (
    <View>
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
            By accessing and using Rumbala, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application.
        </Text>

        <Text style={styles.sectionTitle}>2. Use of Service</Text>
        <Text style={styles.text}>
            Rumbala is designed for couples to interact through dares and games. You are responsible for any activity that occurs under your account.
        </Text>

        <Text style={styles.sectionTitle}>3. User Content</Text>
        <Text style={styles.text}>
            Users may upload images or text as proof of dares. You retain ownership but grant Rumbala a limited license to process this data strictly for app functionality.
        </Text>

        <Text style={styles.sectionTitle}>4. Pro Subscription</Text>
        <Text style={styles.text}>
            Premium features require a paid subscription. Payments are handled via Apple/Google stores. Unused portions of free trials are forfeited upon subscription.
        </Text>

        <Text style={styles.sectionTitle}>5. Termination</Text>
        <Text style={styles.text}>
            We reserve the right to suspend or terminate accounts that violate our community guidelines or engage in illegal activities.
        </Text>
    </View>
);

const PrivacyContent = () => (
    <View>
        <Text style={styles.sectionTitle}>1. Data Collection</Text>
        <Text style={styles.text}>
            We collect minimal personal data: your name, email for authentication, and partner names for the gaming experience.
        </Text>

        <Text style={styles.sectionTitle}>2. Data Usage</Text>
        <Text style={styles.text}>
            Your data is used solely to provide and improve the app features. We do not sell your personal information to third parties.
        </Text>

        <Text style={styles.sectionTitle}>3. Encryption</Text>
        <Text style={styles.text}>
            Communication between partners and data stored in our database (via Supabase) is encrypted to ensure your privacy.
        </Text>

        <Text style={styles.sectionTitle}>4. Media & Photos</Text>
        <Text style={styles.text}>
            Photos uploaded as dare proof are stored securely. We do not use these photos for any purpose other than displaying them in your history.
        </Text>

        <Text style={styles.sectionTitle}>5. Your Rights</Text>
        <Text style={styles.text}>
            You can request deletion of your data at any time by contacting our support or using the "Delete Account" feature in settings.
        </Text>
    </View>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        width: '90%',
        maxHeight: '80%',
        borderRadius: 32,
        padding: 24,
        elevation: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1a1a1a',
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        marginHorizontal: -4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FF6B35',
        marginTop: 18,
        marginBottom: 8,
    },
    text: {
        fontSize: 14,
        color: '#444',
        lineHeight: 22,
        fontWeight: '500',
    },
    doneBtn: {
        marginTop: 20,
        borderRadius: 18,
        overflow: 'hidden',
    },
    doneBtnGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
});
