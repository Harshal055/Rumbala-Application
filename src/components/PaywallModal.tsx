import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal, 
    Image, Dimensions, ScrollView, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import LegalModal from './LegalModal';
import { glassStyles, glassTokens } from '../constants/glass';
import { getOfferings } from '../services/revenueCatService';
import { PurchasesPackage } from 'react-native-purchases';

const { width, height } = Dimensions.get('window');

interface PaywallModalProps {
    visible: boolean;
    onClose: () => void;
    onSubscribe: (pkg: PurchasesPackage) => void;
}

const FEATURES = [
    { id: '1', text: 'Unlimited Dare Cards', icon: 'checkmark-circle' },
    { id: '2', text: 'Exclusive LDR Features', icon: 'checkmark-circle' },
    { id: '3', text: 'Ad-free Experience', icon: 'checkmark-circle' },
    { id: '4', text: 'Cloud Storage for Memories', icon: 'checkmark-circle' },
];

export default function PaywallModal({ visible, onClose, onSubscribe }: PaywallModalProps) {
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [legalVisible, setLegalVisible] = useState(false);
    const [legalType, setLegalType] = useState<'terms' | 'privacy'>('terms');

    useEffect(() => {
        if (visible) {
            loadOfferings();
        }
    }, [visible]);

    const loadOfferings = async () => {
        setLoading(true);
        const offerings = await getOfferings();
        const currentOffering = offerings?.current || offerings;
        
        if (currentOffering?.availablePackages) {
            const availPkgs = currentOffering.availablePackages;
            setPackages(availPkgs);
            
            // Default to annual if available, otherwise first one
            const annual = availPkgs.find((p: any) => p.packageType === 'ANNUAL');
            setSelectedPackage(annual || availPkgs[0]);
        }
        setLoading(false);
    };

    const handleSubscribe = () => {
        if (!selectedPackage) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSubscribe(selectedPackage);
    };

    const renderPlan = (pkg: PurchasesPackage) => {
        const isAnnual = pkg.packageType === 'ANNUAL';
        const isSelected = selectedPackage?.identifier === pkg.identifier;
        
        return (
            <TouchableOpacity 
                key={pkg.identifier}
                style={[s.planItem, isSelected && s.planActive]} 
                onPress={() => { setSelectedPackage(pkg); Haptics.selectionAsync(); }}
                activeOpacity={0.9}
            >
                {isAnnual && (
                    <View style={s.bestValueBadge}>
                        <Text style={s.bestValueText}>🔥 BEST VALUE • SAVINGS 🔥</Text>
                    </View>
                )}
                <View style={s.planRadio}>
                    <View style={[s.radioOuter, isSelected && s.radioOuterActive]}>
                        {isSelected && <View style={s.radioInner} />}
                    </View>
                </View>
                <View style={s.planInfo}>
                    <Text style={s.planName}>{isAnnual ? 'Annual' : 'Monthly'}</Text>
                    <Text style={s.planDesc}>{isAnnual ? 'Most popular' : 'Flexible access'}</Text>
                </View>
                <View style={s.planPriceWrap}>
                    <Text style={s.planPrice}>{pkg.product.priceString}</Text>
                    <Text style={s.planPeriod}>{isAnnual ? 'per year' : 'per month'}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            transparent 
            hardwareAccelerated={true}
            statusBarTranslucent={true}
        >
            <View style={s.overlay}>
                <View style={s.modalContainer}>
                    <TouchableOpacity style={[s.closeBtn, glassStyles.container]} onPress={onClose} activeOpacity={0.7}>
                        <Ionicons name="close" size={20} color="#fff" />
                    </TouchableOpacity>

                    <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
                        <View style={s.headerImageWrap}>
                            <Image 
                                source={{ uri: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80' }} 
                                style={s.headerImage}
                                resizeMode="cover"
                            />
                            <LinearGradient 
                                colors={['transparent', 'rgba(18, 11, 19, 1)']} 
                                style={s.imageOverlay} 
                            />
                        </View>

                        <View style={s.content}>
                            <Text style={s.title}>Unlock Unlimited{'\n'}Fun</Text>
                            <Text style={s.subtitle}>Elevate your connection with Rumbala Pro</Text>

                            <View style={s.featureList}>
                                {FEATURES.map(f => (
                                    <View key={f.id} style={s.featureItem}>
                                        <LinearGradient colors={['#FF66B2', '#FF8ED4']} style={s.checkCircle} start={{x:0, y:0}} end={{x:1, y:1}}>
                                            <Ionicons name="checkmark-sharp" size={12} color="#fff" />
                                        </LinearGradient>
                                        <Text style={s.featureText}>{f.text}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={s.plansContainer}>
                                {loading ? (
                                    <ActivityIndicator size="large" color="#FF66B2" style={{ marginVertical: 30 }} />
                                ) : packages.length > 0 ? (
                                    packages.map(renderPlan)
                                ) : (
                                    <View style={s.errorState}>
                                        <Ionicons name="alert-circle-outline" size={32} color="#666" />
                                        <Text style={s.errorText}>No active plans found. Please check back later or contact support.</Text>
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity 
                                style={[s.ctaBtn, (!selectedPackage || loading) && { opacity: 0.5 }]} 
                                onPress={handleSubscribe} 
                                activeOpacity={0.8}
                                disabled={!selectedPackage || loading}
                            >
                                <LinearGradient 
                                    colors={['#FF8ED4', '#FF66B2']} 
                                    start={{ x: 0, y: 0 }} 
                                    end={{ x: 1, y: 0 }}
                                    style={s.ctaGradient}
                                >
                                    <Text style={s.ctaText}>
                                        {selectedPackage?.product.introPrice ? 'Start Free Trial' : 'Subscribe Now'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text style={s.trialInfo}>
                                {selectedPackage?.product.introPrice 
                                    ? 'Free trial included. Cancel anytime.'
                                    : 'Secured purchase. Cancel anytime.'}
                            </Text>

                            <View style={s.legalLinks}>
                                <TouchableOpacity><Text style={s.legalText}>Restore Purchase</Text></TouchableOpacity>
                                <View style={s.legalDot} />
                                <TouchableOpacity onPress={() => { setLegalType('terms'); setLegalVisible(true); }}>
                                    <Text style={s.legalText}>Terms of Service</Text>
                                </TouchableOpacity>
                                <View style={s.legalDot} />
                                <TouchableOpacity onPress={() => { setLegalType('privacy'); setLegalVisible(true); }}>
                                    <Text style={s.legalText}>Privacy Policy</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>

                    <LegalModal 
                        visible={legalVisible} 
                        type={legalType} 
                        onClose={() => setLegalVisible(false)} 
                    />
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalContainer: { 
        height: '82%', 
        backgroundColor: '#0D080E', 
        borderTopLeftRadius: 32, 
        borderTopRightRadius: 32,
        overflow: 'hidden'
    },
    closeBtn: { 
        position: 'absolute', top: 16, right: 16, zIndex: 10,
        width: 32, height: 32, borderRadius: 16, 
        backgroundColor: 'rgba(255,255,255,0.2)', 
        alignItems: 'center', justifyContent: 'center' 
    },
    scrollContent: { paddingBottom: 40 },
    headerImageWrap: { height: 180, width: '100%', position: 'relative' },
    headerImage: { width: '100%', height: '100%' },
    imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
    
    content: { paddingHorizontal: 24, paddingTop: 4 },
    title: { 
        fontSize: 28, fontWeight: '900', color: '#fff', 
        textAlign: 'center', lineHeight: 34, letterSpacing: 0.5 
    },
    subtitle: { 
        fontSize: 14, color: '#A1B0C1', textAlign: 'center', 
        marginTop: 8, lineHeight: 20, fontWeight: '500' 
    },

    featureList: { marginTop: 24, gap: 10 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkCircle: { 
        width: 22, height: 22, borderRadius: 11, 
        backgroundColor: '#FF66B2', alignItems: 'center', justifyContent: 'center' 
    },
    featureText: { fontSize: 14, color: '#fff', fontWeight: '700' },

    plansContainer: { marginTop: 24, gap: 12 },
    planItem: { 
        flexDirection: 'row', alignItems: 'center', padding: 18, 
        borderRadius: 22, borderWidth: 2, borderColor: '#1F1621',
        backgroundColor: '#160E17' 
    },
    planActive: { borderColor: '#FF66B2', backgroundColor: '#1E111F' },
    planRadio: { marginRight: 14 },
    radioOuter: { 
        width: 22, height: 22, borderRadius: 11, borderWidth: 2, 
        borderColor: '#3D2F3F', alignItems: 'center', justifyContent: 'center' 
    },
    radioOuterActive: { borderColor: '#FF66B2' },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF66B2' },
    
    planInfo: { flex: 1 },
    planName: { fontSize: 16, fontWeight: '800', color: '#fff' },
    planDesc: { fontSize: 12, color: '#888', marginTop: 2 },
    
    planPriceWrap: { alignItems: 'flex-end' },
    planPrice: { fontSize: 16, fontWeight: '800', color: '#fff' },
    planPeriod: { fontSize: 12, color: '#888', marginTop: 2 },

    bestValueBadge: {
        position: 'absolute', top: -12, left: 24, 
        backgroundColor: '#FF8ED4', paddingHorizontal: 12, paddingVertical: 4, 
        borderRadius: 20, zIndex: 10,
        shadowColor: '#FF66B2', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 4
    },
    bestValueText: { fontSize: 10, fontWeight: '900', color: '#0D080E' },

    ctaBtn: { marginTop: 24, borderRadius: 30, overflow: 'hidden' },
    ctaGradient: { paddingVertical: 16, alignItems: 'center' },
    ctaText: { fontSize: 18, fontWeight: '900', color: '#0D080E' },
    
    trialInfo: { 
        fontSize: 12, color: '#666', textAlign: 'center', 
        marginTop: 14, fontWeight: '500' 
    },

    legalLinks: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
        marginTop: 20, gap: 10 
    },
    legalText: { fontSize: 11, color: '#444', fontWeight: '700', textDecorationLine: 'underline' },
    legalDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#333' },
    
    errorState: { 
        alignItems: 'center', justifyContent: 'center', 
        paddingVertical: 30, paddingHorizontal: 20 
    },
    errorText: { 
        fontSize: 14, color: '#888', textAlign: 'center', 
        marginTop: 12, lineHeight: 20 
    }
});

