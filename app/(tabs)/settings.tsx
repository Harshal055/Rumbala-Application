import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
    TextInput, Modal, FlatList, Image, useWindowDimensions, StatusBar,
    ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore, HistoryEntry } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { typography } from '../../src/constants/typography';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, withDelay,
    withSpring, Easing, FadeInDown
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/services/supabase';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../../src/constants/glass';
import { sendFeedback, sendBugReport } from '../../src/services/api';

interface PurchaseHistoryItem {
    id: string;
    date: string;
    pack: string;
    price: string;
    count: number;
}

const BG_COLORS = ['#F5F0F0', '#EED9C4', '#D4E2D4'];

export default function SettingsScreen() {
    const router = useRouter();
    const { partner1, partner2, setPartner1, setPartner2, scores, cardCount, logout, history, selectedVibe, isPro, showAlert, userEmail, userId } = useStore(useShallow(state => ({
        partner1: state.partner1,
        partner2: state.partner2,
        setPartner1: state.setPartner1,
        setPartner2: state.setPartner2,
        scores: state.scores,
        cardCount: state.cardCount,
        logout: state.logout,
        history: state.history,
        selectedVibe: state.selectedVibe,
        isPro: state.isPro,
        showAlert: state.showAlert,
        userEmail: state.userEmail,
        userId: state.userId
    })));
    const { width } = useWindowDimensions();

    const wins = scores?.partner1 || 0;
    const partnerWins = scores?.partner2 || 0;
    const totalGames = wins + partnerWins;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    const [showEditModal, setShowEditModal] = useState(false);
    const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
    const [showGameHistory, setShowGameHistory] = useState(false);
    const [editPartner1, setEditPartner1] = useState(partner1 || '');
    const [editPartner2, setEditPartner2] = useState(partner2 || '');
    const entryRefs = useRef<{ [key: string]: View | null }>({}); 

    const [memberSince, setMemberSince] = useState<string | null>(null);

    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [loadingFeedback, setLoadingFeedback] = useState(false);

    const [showBugModal, setShowBugModal] = useState(false);
    const [bugMessage, setBugMessage] = useState('');
    const [loadingBug, setLoadingBug] = useState(false);

    useEffect(() => {
        const fetchUserInfo = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                if (data.user.created_at) {
                    const date = new Date(data.user.created_at);
                    setMemberSince(date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
                }
            }
        };
        fetchUserInfo();
    }, []);

    const [purchaseHistory] = useState<PurchaseHistoryItem[]>([
        { id: '1', date: '2026-02-20', pack: '5-Pack', price: '₹19', count: 5 },
        { id: '2', date: '2026-02-15', pack: '10-Pack', price: '₹39', count: 10 },
    ]);

    const handleSaveProfile = () => {
        if (!editPartner1.trim()) {
            showAlert('Error', 'Please enter your name to update your profile.');
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPartner1(editPartner1.trim());
        setPartner2(editPartner2.trim());
        setShowEditModal(false);
        showAlert('Success', 'Profile updated! 💖');
    };

    const handleLogout = () => {
        showAlert('Logout', 'Are you sure you want to log out of your account?', [
            { text: 'Logout', style: 'destructive', onPress: confirmLogout },
            { text: 'Cancel', style: 'cancel' }
        ]);
    };

    const confirmLogout = async () => {
        try {
            logout();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/login');
        } catch {
            showAlert('Error', 'Failed to logout. Please try again.');
        }
    };

    const handleShareGameMemory = async (id: string) => {
        try {
            const viewToCapture = entryRefs.current[id];
            if (!viewToCapture) return;
            const uri = await captureRef(viewToCapture, { format: 'png', quality: 0.9 });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { dialogTitle: 'Share your Rumbala Moment!', mimeType: 'image/png' });
            } else { 
                showAlert('Sharing Unavailable', 'Sharing is not available on this device.'); 
            }
        } catch { 
            showAlert('Error', 'Could not share image. Please try again.'); 
        }
    };

    const handleSendFeedback = async () => {
        if (!feedbackMessage.trim()) {
            showAlert('Error', 'Please enter a message before sending.');
            return;
        }
        setLoadingFeedback(true);
        try {
            await sendFeedback(userId, userEmail, feedbackMessage.trim(), feedbackRating);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowFeedbackModal(false);
            setFeedbackMessage('');
            setFeedbackRating(5);
            showAlert('Thank You!', 'Your feedback helps us make Rumbala better for everyone. 💖');
        } catch (e) {
            showAlert('Error', 'Failed to send feedback. Please check your connection.');
        } finally {
            setLoadingFeedback(false);
        }
    };

    const handleSendBugReport = async () => {
        if (!bugMessage.trim()) {
            showAlert('Error', 'Please describe the bug first.');
            return;
        }
        setLoadingBug(true);
        try {
            const deviceInfo = {
                platform: 'app',
                width,
                vibe: selectedVibe,
                timestamp: new Date().toISOString()
            };
            await sendBugReport(userId, userEmail || 'anonymous', bugMessage.trim(), deviceInfo);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowBugModal(false);
            setBugMessage('');
            showAlert('Report Sent', 'Our tech team will look into this immediately. 🛠️');
        } catch (e) {
            showAlert('Error', 'Failed to send report. Please try again.');
        } finally {
            setLoadingBug(false);
        }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" />
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Nav */}
                    <View style={styles.navBar}>
                        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, glassStyles.container]}>
                            <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
                        </TouchableOpacity>
                        <Text style={styles.navTitle}>Settings</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* ─── Profile Hero Card ─── */}
                    <Animated.View entering={FadeInDown.duration(500)} style={[styles.profileCard, glassStyles.container]}>
                        <LinearGradient
                            colors={['rgba(255, 107, 53, 0.8)', 'rgba(255, 140, 0, 0.6)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.profileGradient}
                        >
                            <TouchableOpacity
                                style={[styles.editProfileBtn, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setEditPartner1(partner1 || '');
                                    setEditPartner2(partner2 || '');
                                    setShowEditModal(true);
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="create-outline" size={18} color="#fff" />
                            </TouchableOpacity>

                            <View style={styles.avatarRing}>
                                <LinearGradient
                                    colors={['#FFB6C1', '#FFC0CB']}
                                    style={styles.avatarInner}
                                >
                                    <Text style={styles.avatarEmoji}>💕</Text>
                                </LinearGradient>
                            </View>

                            <Text style={styles.coupleLabel}>Your Couple</Text>
                            <Text style={styles.coupleNames}>{partner1} & {partner2}</Text>

                            {selectedVibe && (
                                <View style={[styles.vibeBadge, glassStyles.container]}>
                                    <Text style={styles.vibeEmoji}>
                                        {selectedVibe === 'fun' ? '✨' : selectedVibe === 'romantic' ? '❤️' : '🔥'}
                                    </Text>
                                    <Text style={styles.vibeName}>
                                        {selectedVibe.charAt(0).toUpperCase() + selectedVibe.slice(1)} Vibe
                                    </Text>
                                </View>
                            )}

                            <View style={[styles.profileStatsRow, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                                <View style={styles.profileStatItem}>
                                    <Text style={styles.profileStatValue}>{totalGames}</Text>
                                    <Text style={styles.profileStatLabel}>Games</Text>
                                </View>
                                <View style={styles.profileStatDivider} />
                                <View style={styles.profileStatItem}>
                                    <Text style={styles.profileStatValue}>{winRate}%</Text>
                                    <Text style={styles.profileStatLabel}>Win Rate</Text>
                                </View>
                                <View style={styles.profileStatDivider} />
                                <View style={styles.profileStatItem}>
                                    <Text style={styles.profileStatValue}>{wins}</Text>
                                    <Text style={styles.profileStatLabel}>{partner1?.split(' ')[0]}</Text>
                                </View>
                                <View style={styles.profileStatDivider} />
                                <View style={styles.profileStatItem}>
                                    <Text style={styles.profileStatValue}>{partnerWins}</Text>
                                    <Text style={styles.profileStatLabel}>{partner2?.split(' ')[0]}</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* ─── Account Info Section ─── */}
                    <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
                        <Text style={styles.sectionLabel}>ACCOUNT INFO</Text>
                        <View style={[styles.card, glassStyles.container]}>
                            <TouchableOpacity
                                style={styles.infoRow}
                                onPress={() => {
                                    if (userEmail) { showAlert('Your Email', userEmail); }
                                }}
                                activeOpacity={0.6}
                            >
                                <View style={[styles.settingIcon, glassStyles.container, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                                    <Ionicons name="mail-outline" size={22} color="#6366F1" />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Email</Text>
                                    <Text style={styles.settingSubtitle}>{userEmail || 'Loading...'}</Text>
                                </View>
                                <Ionicons name="copy-outline" size={16} color="#aaa" />
                            </TouchableOpacity>

                            <View style={styles.rowDivider} />

                            <View style={styles.infoRow}>
                                <View style={[styles.settingIcon, glassStyles.container, { backgroundColor: isPro ? 'rgba(255, 107, 53, 0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                    <Ionicons name={isPro ? 'diamond' : 'person-outline'} size={22} color={isPro ? '#FF6B35' : '#888'} />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Plan</Text>
                                    <Text style={[styles.settingSubtitle, isPro && { color: '#FF6B35', fontWeight: '800' }]}>
                                        {isPro ? '⭐ Pro Member' : 'Free Account'}
                                    </Text>
                                </View>
                                {isPro && (
                                    <View style={styles.proBadge}>
                                        <Text style={styles.proBadgeText}>PRO</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.rowDivider} />

                            <View style={styles.infoRow}>
                                <View style={[styles.settingIcon, glassStyles.container, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                    <Ionicons name="calendar-outline" size={22} color="#10B981" />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Member Since</Text>
                                    <Text style={styles.settingSubtitle}>{memberSince || 'Loading...'}</Text>
                                </View>
                            </View>

                            {userEmail?.toLowerCase() === 'adminhr@andx.com' && (
                                <>
                                    <View style={styles.rowDivider} />
                                    <TouchableOpacity 
                                        style={styles.infoRow}
                                        onPress={() => router.push('/admin')}
                                    >
                                        <View style={[styles.settingIcon, glassStyles.container, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                                            <Ionicons name="shield-checkmark-outline" size={22} color="#FF6B35" />
                                        </View>
                                        <View style={styles.settingInfo}>
                                            <Text style={[styles.settingTitle, { color: '#FF6B35' }]}>Admin Portal</Text>
                                            <Text style={styles.settingSubtitle}>Manage app & view feedback</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color="#FF6B35" />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </Animated.View>

                    {/* ─── Profile Section ─── */}
                    <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
                        <Text style={styles.sectionLabel}>PROFILE</Text>
                        <View style={[styles.card, glassStyles.container]}>
                            <SettingItem
                                icon="people-outline" iconColor="#FF6B35" title="Edit Partner Names" subtitle="Update your couple names"
                                onPress={() => { setEditPartner1(partner1 || ''); setEditPartner2(partner2 || ''); setShowEditModal(true); }}
                            />
                            <View style={styles.rowDivider} />
                            <SettingItem
                                icon="heart-circle-outline" iconColor="#FF9800" title="Change Vibe" subtitle={selectedVibe ? `Currently: ${selectedVibe}` : 'Set your vibe'}
                                onPress={() => showAlert('Coming Soon', 'Vibe settings coming soon!')}
                            />
                        </View>
                    </Animated.View>

                    {/* ─── Account Section ─── */}
                    <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.section}>
                        <Text style={styles.sectionLabel}>ACCOUNT</Text>
                        <View style={[styles.card, glassStyles.container]}>
                            <SettingItem
                                icon="calendar-outline" iconColor="#FF9800" title="Game History" subtitle="View your memory lane"
                                onPress={() => router.push('/(tabs)/history')}
                            />
                            <View style={styles.rowDivider} />
                            <SettingItem
                                icon="receipt-outline" iconColor="#7C3AED" title="Purchase History" subtitle="View your card packs"
                                onPress={() => setShowPurchaseHistory(true)}
                            />
                            <View style={styles.rowDivider} />
                            <SettingItem
                                icon="chatbubble-ellipses-outline" iconColor="#10B981" title="Give Feedback" subtitle="Tell us what you think"
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setShowFeedbackModal(true);
                                }}
                            />
                            <View style={styles.rowDivider} />
                            <SettingItem
                                icon="bug-outline" iconColor="#EF4444" title="Report a Bug" subtitle="Something not working right?"
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setShowBugModal(true);
                                }}
                            />
                        </View>
                    </Animated.View>

                    {/* ─── Logout ─── */}
                    <Animated.View entering={FadeInDown.delay(300).duration(500)}>
                        <TouchableOpacity style={[styles.logoutBtn, glassStyles.container, { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }]} onPress={handleLogout} activeOpacity={0.8}>
                            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Edit Profile Modal */}
                <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
                    <TouchableWithoutFeedback onPress={() => { setShowEditModal(false); Keyboard.dismiss(); }}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <KeyboardAvoidingView 
                                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                                    style={{ width: '100%' }}
                                >
                            <Animated.View entering={FadeInDown} style={styles.modalSheet}>
                                <View style={styles.modalHandle} />
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Edit Profile</Text>
                                    <TouchableOpacity onPress={() => setShowEditModal(false)} style={[styles.modalCloseBtn, glassStyles.container]}>
                                        <Ionicons name="close" size={24} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.modalBody}>
                                    <Text style={styles.inputLabel}>Your Name</Text>
                                    <TextInput
                                        style={[styles.textInput, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.03)' }]} value={editPartner1} onChangeText={setEditPartner1}
                                        placeholder="Enter your name" placeholderTextColor="#999"
                                    />
                                    <Text style={[styles.inputLabel, { marginTop: 20 }]}>Partner's Name</Text>
                                    <TextInput
                                        style={[styles.textInput, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.03)' }]} value={editPartner2} onChangeText={setEditPartner2}
                                        placeholder="Enter partner's name" placeholderTextColor="#999"
                                    />
                                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} activeOpacity={0.8}>
                                        <LinearGradient colors={['#FF6B35', '#FF9800']} style={styles.saveBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                            <Text style={styles.saveBtnText}>Save Changes</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </ScrollView>
                            </Animated.View>
                        </KeyboardAvoidingView>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                <Modal visible={showPurchaseHistory} animationType="slide" transparent onRequestClose={() => setShowPurchaseHistory(false)}>
                    <TouchableWithoutFeedback onPress={() => setShowPurchaseHistory(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <Animated.View entering={FadeInDown} style={styles.modalSheet}>
                            <View style={styles.modalHandle} />
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Purchase History</Text>
                                <TouchableOpacity onPress={() => setShowPurchaseHistory(false)} style={[styles.modalCloseBtn, glassStyles.container]}>
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={purchaseHistory} keyExtractor={i => i.id} contentContainerStyle={{ padding: 20 }}
                                renderItem={({ item }) => (
                                    <View style={[styles.purchaseItem, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                        <View style={[styles.purchaseIcon, glassStyles.container, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
                                            <Ionicons name="bag-check" size={22} color="#7C3AED" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.purchaseTitle}>{item.pack}</Text>
                                            <Text style={styles.purchaseSub}>{new Date(item.date).toLocaleDateString()}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.purchasePrice}>{item.price}</Text>
                                            <Text style={styles.purchaseSub}>{item.count} cards</Text>
                                        </View>
                                    </View>
                                )}
                            />
                        </Animated.View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                <Modal visible={showFeedbackModal} animationType="slide" transparent onRequestClose={() => setShowFeedbackModal(false)}>
                    <TouchableWithoutFeedback onPress={() => { setShowFeedbackModal(false); Keyboard.dismiss(); }}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <KeyboardAvoidingView 
                                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                                    style={{ width: '100%' }}
                                >
                            <Animated.View entering={FadeInDown} style={styles.modalSheet}>
                                <View style={styles.modalHandle} />
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Your Feedback</Text>
                                    <TouchableOpacity onPress={() => setShowFeedbackModal(false)} style={[styles.modalCloseBtn, glassStyles.container]}>
                                        <Ionicons name="close" size={24} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                    <Text style={styles.inputLabel}>How would you rate Rumbala?</Text>
                                    <View style={styles.ratingRow}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <TouchableOpacity key={star} onPress={() => setFeedbackRating(star)}>
                                                <Ionicons 
                                                    name={star <= feedbackRating ? "star" : "star-outline"} 
                                                    size={36} 
                                                    color={star <= feedbackRating ? "#FF9800" : "#ccc"} 
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={[styles.inputLabel, { marginTop: 24 }]}>Share your thoughts...</Text>
                                    <TextInput
                                        style={[styles.textArea, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.03)' }]} 
                                        value={feedbackMessage} 
                                        onChangeText={setFeedbackMessage}
                                        placeholder="Found a bug? Have a suggestion? We'd love to hear it!" 
                                        placeholderTextColor="#999"
                                        multiline
                                        numberOfLines={4}
                                    />
                                    <TouchableOpacity 
                                        style={[styles.saveBtn, loadingFeedback && { opacity: 0.7 }]} 
                                        onPress={handleSendFeedback} 
                                        activeOpacity={0.8}
                                        disabled={loadingFeedback}
                                    >
                                        <LinearGradient colors={['#FF6B35', '#FF9800']} style={styles.saveBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                            {loadingFeedback ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text style={styles.saveBtnText}>Submit Feedback</Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </ScrollView>
                            </Animated.View>
                        </KeyboardAvoidingView>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                <Modal visible={showBugModal} animationType="slide" transparent onRequestClose={() => setShowBugModal(false)}>
                    <TouchableWithoutFeedback onPress={() => { setShowBugModal(false); Keyboard.dismiss(); }}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <KeyboardAvoidingView 
                                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                                    style={{ width: '100%' }}
                                >
                            <Animated.View entering={FadeInDown} style={styles.modalSheet}>
                                <View style={styles.modalHandle} />
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Report a Bug</Text>
                                    <TouchableOpacity onPress={() => setShowBugModal(false)} style={[styles.modalCloseBtn, glassStyles.container]}>
                                        <Ionicons name="close" size={24} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                    <Text style={styles.inputLabel}>What went wrong? 🛠️</Text>
                                    <TextInput
                                        style={[styles.textArea, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.03)' }]} 
                                        value={bugMessage} 
                                        onChangeText={setBugMessage}
                                        placeholder="Describe the issue... (e.g. App crashed when I clicked shop)" 
                                        placeholderTextColor="#999"
                                        multiline
                                        numberOfLines={6}
                                    />
                                    <TouchableOpacity 
                                        style={[styles.saveBtn, loadingBug && { opacity: 0.7 }]} 
                                        onPress={handleSendBugReport} 
                                        activeOpacity={0.8}
                                        disabled={loadingBug}
                                    >
                                        <LinearGradient colors={['#EF4444', '#B91C1C']} style={styles.saveBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                            {loadingBug ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text style={styles.saveBtnText}>Send Bug Report</Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 11, color: '#999', textAlign: 'center', marginTop: 15, fontStyle: 'italic', marginBottom: 20 }}>
                                        Technical data like device dimensions and current vibe will be included.
                                    </Text>
                                </ScrollView>
                            </Animated.View>
                        </KeyboardAvoidingView>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

            </SafeAreaView>
        </AnimatedBackground>
    );
}

function SettingItem({ icon, iconColor, title, subtitle, onPress }: {
    icon: string; iconColor: string; title: string; subtitle: string; onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.settingRow} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }} activeOpacity={0.6}>
            <View style={[styles.settingIcon, glassStyles.container, { backgroundColor: `${iconColor}15` }]}>
                <Ionicons name={icon as any} size={22} color={iconColor} />
            </View>
            <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{title}</Text>
                <Text style={styles.settingSubtitle}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },

    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginBottom: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    navTitle: { fontFamily: 'Pacifico_400Regular', fontSize: 24, color: '#1a1a1a' },

    profileCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 24, padding: 0 },
    profileGradient: { paddingTop: 28, paddingBottom: 24, paddingHorizontal: 20, alignItems: 'center' },
    editProfileBtn: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    avatarRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', padding: 3, marginBottom: 14 },
    avatarInner: { flex: 1, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    avatarEmoji: { fontSize: 36 },
    coupleLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
    coupleNames: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 12, textAlign: 'center' },
    vibeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, gap: 6, marginBottom: 20 },
    vibeEmoji: { fontSize: 13 },
    vibeName: { fontSize: 13, color: '#fff', fontWeight: '800' },
    profileStatsRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 8, width: '100%', gap: 4 },
    profileStatItem: { flex: 1, alignItems: 'center' },
    profileStatValue: { fontSize: 20, fontWeight: '900', color: '#fff' },
    profileStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginTop: 2 },
    profileStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },

    section: { marginBottom: 24 },
    sectionLabel: { fontSize: 12, fontWeight: '800', color: '#888', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
    card: { borderRadius: 24, overflow: 'hidden' },

    settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
    settingIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    settingInfo: { flex: 1 },
    settingTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
    settingSubtitle: { fontSize: 12, color: '#666', fontWeight: '500' },
    rowDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginLeft: 72 },

    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
    proBadge: { backgroundColor: '#FF6B35', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    proBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 20, paddingVertical: 16, gap: 10, borderWidth: 1.5 },
    logoutText: { fontSize: 16, fontWeight: '800', color: '#EF4444' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalSheet: { 
        backgroundColor: '#fff', 
        borderTopLeftRadius: 32, 
        borderTopRightRadius: 32, 
        maxHeight: '90%', 
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.1)', alignSelf: 'center', marginTop: 12, marginBottom: 8 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
    modalCloseBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    modalBody: { padding: 24 },
    inputLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8, marginLeft: 4 },
    textInput: { borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, fontSize: 16, color: '#1a1a1a', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.05)' },
    saveBtn: { marginTop: 28, borderRadius: 18, overflow: 'hidden' },
    saveBtnGradient: { paddingVertical: 18, alignItems: 'center' },
    saveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },

    purchaseItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12 },
    purchaseIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    purchaseTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
    purchaseSub: { fontSize: 12, color: '#666', fontWeight: '500' },
    purchasePrice: { fontSize: 16, fontWeight: '800', color: '#FF6B35', marginBottom: 2 },

    ratingRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginVertical: 10 },
    textArea: { borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, fontSize: 16, color: '#1a1a1a', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.05)', height: 120, textAlignVertical: 'top' },

    modalOverlayCen: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    logoutCard: { borderRadius: 32, padding: 32, width: '100%', maxWidth: 340, alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.95)' },
    logoutIconWrap: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    logoutTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', marginBottom: 12 },
    logoutSub: { fontSize: 16, color: '#444', textAlign: 'center', marginBottom: 32, lineHeight: 24, fontWeight: '600', paddingHorizontal: 10 },
    logoutBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
    logoutActionBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    logoutCancelBtn: { backgroundColor: 'rgba(0,0,0,0.05)' },
    logoutCancelText: { color: '#666', fontSize: 16, fontWeight: '800' },
    logoutConfirmBtn: { backgroundColor: '#EF4444' },
    logoutConfirmText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
