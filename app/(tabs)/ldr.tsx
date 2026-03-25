import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Alert, Share, StatusBar, Dimensions, ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue, useAnimatedStyle, withRepeat, withSequence,
    withTiming, Easing, FadeIn, FadeInDown, FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useStore } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import {
    createLdrRoomV2, joinLdrRoomV2, subscribeToRoomV2,
    syncDrawnCardV2, updateRoomScoreV2, clearRoomCardV2,
    RoomData, sendChatMessageV2, subscribeToChatV2
} from '../../src/services/roomApi';
import { CARDS, DareCard, CardType } from '../../src/constants/cards';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { 
    createDirectNativeEventEmitter, 
    IRtcEngine, 
    createAgoraRtcEngine, 
    VideoCanvasMode, 
    ChannelProfileType, 
    ClientRoleType, 
    RtcSurfaceView,
    RtcConnection,
    IRtcEngineEventHandler
} from 'react-native-agora';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput } from 'react-native';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../../src/constants/glass';

// --- Agora Configuration ---
const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || ''; 

const { width, height } = Dimensions.get('window');

const BG_COLORS = ['#F5F3FF', '#EDE9F8', '#FDFCFB']; // Techy romantic LDR base

// ── Timer Component ──
function DareTimer({ seconds }: { seconds: number }) {
    const [remaining, setRemaining] = useState(seconds);
    useEffect(() => {
        setRemaining(seconds);
        const interval = setInterval(() => {
            setRemaining(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [seconds]);
    const isLow = remaining <= 10;
    return (
        <View style={[tt.wrap, isLow && tt.wrapRed, !isLow && glassStyles.container]}>
            <Ionicons name="timer-outline" size={14} color={isLow ? '#fff' : '#FF6B35'} />
            <Text style={[tt.text, isLow && tt.textWhite]}>
                {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
            </Text>
        </View>
    );
}

const tt = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    wrapRed: { backgroundColor: '#FF4444' },
    text: { fontSize: 14, fontWeight: '800', color: '#FF6B35', fontVariant: ['tabular-nums'] },
    textWhite: { color: '#fff' },
});

// ── Live Partner Avatar (Agora Remote Stream) ──
function PartnerVideoCard({ name, isLive, remoteUid }: { name: string; isLive: boolean; remoteUid: number | null }) {
    const glow = useSharedValue(0.5);
    useEffect(() => {
        glow.value = withRepeat(withSequence(
            withTiming(1, { duration: 1500 }),
            withTiming(0.5, { duration: 1500 }),
        ), -1, true);
    }, []);
    const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

    if (isLive && remoteUid) {
        return (
            <View style={[pv.card, glassStyles.container]}>
                <RtcSurfaceView 
                    style={StyleSheet.absoluteFill} 
                    canvas={{ uid: remoteUid }} 
                />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.3)']} style={StyleSheet.absoluteFill} />
                <View style={[pv.nameTag, glassStyles.container]}>
                    <Text style={pv.nameText}>{name || 'Partner'}</Text>
                </View>
                <View style={pv.liveBadge}>
                    <View style={pv.liveDot} />
                    <Text style={pv.liveText}>LIVE</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[pv.card, glassStyles.container]}>
            <LinearGradient colors={['rgba(45, 27, 105, 0.4)', 'rgba(26, 16, 53, 0.4)']} style={StyleSheet.absoluteFill} />
            <View style={pv.circleL} />
            <View style={pv.circleR} />
            <View style={pv.avatarWrap}>
                <LinearGradient colors={['#FF9800', '#FF6B35']} style={pv.avatar}>
                    <Ionicons name="person" size={48} color="#fff" />
                </LinearGradient>
                {isLive && <Animated.View style={[pv.glowRing, glowStyle]} />}
            </View>
            <View style={[pv.nameTag, glassStyles.container]}>
                <Text style={pv.nameText}>{name || 'Partner'}</Text>
            </View>
            {isLive && (
                <View style={pv.liveBadge}>
                    <View style={pv.liveDot} />
                    <Text style={pv.liveText}>WAITING FOR VIDEO...</Text>
                </View>
            )}
            <TouchableOpacity style={[pv.micBtn, glassStyles.container]}>
                <Ionicons name="mic-outline" size={18} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const pv = StyleSheet.create({
    card: { width: '100%', height: 200, borderRadius: 22, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    circleL: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,107,53,0.08)', top: -60, left: -60 },
    circleR: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,152,0,0.06)', bottom: -40, right: -30 },
    avatarWrap: { alignItems: 'center', justifyContent: 'center' },
    avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
    glowRing: { position: 'absolute', width: 106, height: 106, borderRadius: 53, borderWidth: 3, borderColor: '#FF6B35', top: -8, left: -8 },
    nameTag: { position: 'absolute', top: 12, left: 14, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
    nameText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    liveBadge: { position: 'absolute', bottom: 12, left: 14, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FF4444', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
    liveText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    micBtn: { position: 'absolute', bottom: 12, right: 14, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});

// ── You (Self) Video Card ──
function SelfVideoCard({ name, isCameraOn }: { name: string; isCameraOn: boolean }) {
    if (!isCameraOn) {
        return (
            <View style={[sv.card, glassStyles.container]}>
                <LinearGradient colors={['rgba(255, 236, 210, 0.4)', 'rgba(252, 182, 159, 0.4)']} style={StyleSheet.absoluteFill} />
                <View style={sv.iconWrap}>
                    <Ionicons name="videocam-off" size={36} color="rgba(255,107,53,0.3)" />
                </View>
                <View style={[sv.nameTag, glassStyles.container]}>
                    <Text style={sv.nameText}>You (Camera Off)</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[sv.card, glassStyles.container]}>
            <CameraView style={StyleSheet.absoluteFill} facing="front" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.3)']} style={StyleSheet.absoluteFill} />
            <View style={[sv.nameTag, glassStyles.container]}>
                <Text style={sv.nameText}>You</Text>
            </View>
        </View>
    );
}

const sv = StyleSheet.create({
    card: { width: '100%', height: 160, borderRadius: 22, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    iconWrap: { opacity: 0.7 },
    nameTag: { position: 'absolute', top: 10, left: 12, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    nameText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

export default function LdrScreen() {
    const insets = useSafeAreaInsets();
    const {
        partner1, partner2, roomId, setRoomId, setIsHost, isHost,
        cardCount, setCardCount, addHistoryEntry, addPoint, userId, isPro, showAlert, setMode
    } = useStore(useShallow(state => ({
        partner1: state.partner1,
        partner2: state.partner2,
        roomId: state.roomId,
        setRoomId: state.setRoomId,
        setIsHost: state.setIsHost,
        isHost: state.isHost,
        cardCount: state.cardCount,
        setCardCount: state.setCardCount,
        addHistoryEntry: state.addHistoryEntry,
        addPoint: state.addPoint,
        userId: state.userId,
        isPro: state.isPro,
        showAlert: state.showAlert,
        setMode: state.setMode
    })));

    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [joinCode, setJoinCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [tab, setTab] = useState<'create' | 'join'>('create');
    const [messages, setMessages] = useState<any[]>([]);
    const [roomType, setRoomType] = useState<'video' | 'normal'>('video');
    const [selectedLdrVibe, setSelectedLdrVibe] = useState<CardType | 'all'>('all');

    const activeCard: DareCard | null = roomData?.current_card ?? null;
    const partnerConnected = !!roomData?.guest_user_id;

    const engine = useRef<IRtcEngine | null>(null);
    const [remoteUid, setRemoteUid] = useState<number | null>(null);
    const [isJoined, setIsJoined] = useState(false);

    useEffect(() => {
        if (roomId) {
            const unsubRoom = subscribeToRoomV2(roomId, setRoomData);
            const unsubChat = subscribeToChatV2(roomId, (msgs: any[]) => {
                setMessages(msgs);
            });
            
            // Camera & Mic permission
            if (roomType === 'video' || (roomData && roomData.room_type === 'video')) {
                (async () => {
                    const { Camera } = await import('expo-camera');
                    await Camera.requestCameraPermissionsAsync();
                    await Camera.requestMicrophonePermissionsAsync();
                })();
                initAgora();
            }

            return () => { 
                unsubRoom(); 
                unsubChat(); 
                leaveAgora();
            };
        }
    }, [roomId, roomType, roomData?.room_type]);

    const initAgora = async () => {
        if (AGORA_APP_ID === 'YOUR_AGORA_APP_ID') {
            console.warn('Agora App ID not set. Video call will not work.');
            return;
        }
        try {
            engine.current = createAgoraRtcEngine();
            engine.current.initialize({ appId: AGORA_APP_ID });
            
            engine.current.registerEventHandler({
                onJoinChannelSuccess: (connection, elapsed) => {
                    setIsJoined(true);
                },
                onUserJoined: (connection, uid, elapsed) => {
                    setRemoteUid(uid);
                },
                onUserOffline: (connection, uid, reason) => {
                    setRemoteUid(null);
                },
                onError: (err, msg) => {
                    console.error('Agora Error:', err, msg);
                }
            });

            engine.current.enableVideo();
            engine.current.startPreview();
            
            engine.current.joinChannel('', roomId, JSON.stringify(userId), {
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                publishMicrophoneTrack: true,
                publishCameraTrack: isCameraOn,
                autoSubscribeAudio: true,
                autoSubscribeVideo: true,
            });
        } catch (e) {
            console.error('Failed to init Agora:', e);
        }
    };

    const leaveAgora = () => {
        if (engine.current) {
            engine.current.leaveChannel();
            engine.current.release();
            engine.current = null;
            setIsJoined(false);
            setRemoteUid(null);
        }
    };

    useEffect(() => {
        if (engine.current && isJoined) {
            engine.current.muteLocalAudioStream(isMuted);
        }
    }, [isMuted, isJoined]);

    useEffect(() => {
        if (engine.current && isJoined) {
            engine.current.muteLocalVideoStream(!isCameraOn);
        }
    }, [isCameraOn, isJoined]);

    const handleCreateRoom = async () => {
        if (!userId) { showAlert('Login Required', 'Please log in first to create a room.'); return; }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        try {
            const code = await createLdrRoomV2(userId, partner1 || 'Player 1', roomType);
            setGeneratedCode(code);
            setIsWaiting(true);
            setRoomId(code);
            setIsHost(true);
            setMode('ldr');
        } catch (e: any) {
            showAlert('Error', e.message || 'Failed to create room. Please try again.');
        } finally { setLoading(false); }
    };

    const handleJoinRoom = async (codeOverride?: string) => {
        if (!userId) { showAlert('Login Required', 'Please log in first to join a room.'); return; }
        const code = (codeOverride ?? joinCode).trim().toUpperCase();
        if (code.length !== 6) { showAlert('Invalid Code', 'Room codes must be exactly 6 characters.'); return; }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        try {
            await joinLdrRoomV2(code, userId, partner1 || 'Guest');
            setRoomId(code); 
            setIsHost(false); 
            setMode('ldr');
            setJoinCode('');
        } catch (e: any) {
            showAlert('Error', e.message || 'Failed to join room.');
        } finally { setLoading(false); }
    };

    const handleDrawDare = async () => {
        if (!roomId || !userId || !roomData) return;
        if (roomData.current_turn_user_id !== userId) {
            showAlert('Not Your Turn', `Please wait for ${partner2 || 'partner'} to finish their dare.`);
            return;
        }
        if (!isPro && cardCount <= 0) { showAlert('No Cards', 'Buy more cards from the Shop to continue!'); return; }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const card = useStore.getState().drawCard(selectedLdrVibe === 'all' ? 'ldr' : selectedLdrVibe);
        if (!card) {
            showAlert('Wait!', 'Could not draw a card. Make sure you have enough cards in your inventory!');
            return;
        }
        try {
            await syncDrawnCardV2(roomId, card);
            if (!isPro) setCardCount(cardCount - 1);
            if (roomData) setRoomData({ ...roomData, current_card: card });
        } catch (e: any) { showAlert('Error', e.message || 'Failed to drawing dare.'); }
    };

    const handleDone = async () => {
        if (!roomId || !activeCard || !userId || !roomData) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowConfetti(true);
        try {
            const h = (roomData.host_score ?? 0) + (isHost ? 1 : 0);
            const g = (roomData.guest_score ?? 0) + (!isHost ? 1 : 0);
            const nextTurnId = isHost ? roomData.guest_user_id : roomData.host_user_id;
            if (nextTurnId) { await updateRoomScoreV2(roomId, h, g, nextTurnId); }
            else { await updateRoomScoreV2(roomId, h, g); }
            await clearRoomCardV2(roomId);
            if (roomData) setRoomData({ ...roomData, current_card: null, host_score: h, guest_score: g, current_turn_user_id: nextTurnId || roomData.current_turn_user_id });
            addPoint('both');
            addHistoryEntry({ id: Date.now().toString(), date: new Date().toISOString(), card: activeCard, winner: 'both' });
        } catch {}
        setTimeout(() => setShowConfetti(false), 3000);
    };

    const handleSkip = async () => {
        if (!roomId || !userId) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try { 
            useStore.getState().drawCard();
            await clearRoomCardV2(roomId); 
            if (roomData) setRoomData({ ...roomData, current_card: null });
        } catch (e) { console.warn('Failed to skip dare:', e); }
    };

    const sendReaction = async (emoji: string) => {
        if (!roomId || !userId) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try { await sendChatMessageV2(roomId, userId, partner1 || 'Partner', `REACTION:${emoji}`); } catch {}
    };

    const leaveRoom = () => showAlert('Leave Session', 'Are you sure you want to end this LDR session?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => {
            setRoomId(null); setRoomData(null); setGeneratedCode(null); setIsWaiting(false);
        }},
    ]);

    const shareCode = async () => {
        if (generatedCode) {
            try { await Share.share({ message: `Join me on Rumbala! Code: ${generatedCode}` }); } catch {}
        }
    };

    if (!roomId) {
        return (
            <AnimatedBackground colors={BG_COLORS}>
                <SafeAreaView style={styles.setupRoot} edges={['top']}>
                    <StatusBar barStyle="dark-content" />
                    <Animated.View entering={FadeInDown.duration(500)} style={[styles.navBar, glassStyles.header]}>
                        <View style={{ width: 40 }} />
                        <Text style={styles.navTitle}>LDR Mode</Text>
                        <View style={{ width: 40 }} />
                    </Animated.View>
                    <ScrollView contentContainerStyle={styles.setupScroll} showsVerticalScrollIndicator={false}>
                        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.setupHeader}>
                            <View style={styles.setupIconWrap}>
                                <LinearGradient colors={['#2D1B69', '#FF6B35']} style={styles.setupIcon}>
                                    <Ionicons name="heart" size={28} color="#fff" />
                                </LinearGradient>
                            </View>
                            <Text style={styles.setupSubtitle}>Play dares with your partner in real-time, no matter the distance 💕</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={[styles.tabRow, glassStyles.container]}>
                            <TouchableOpacity style={[styles.tab, tab === 'create' && styles.tabActive]} onPress={() => setTab('create')}>
                                <Ionicons name="add-circle-outline" size={16} color={tab === 'create' ? '#fff' : '#666'} />
                                <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>Create Room</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tab, tab === 'join' && styles.tabActive]} onPress={() => setTab('join')}>
                                <Ionicons name="enter-outline" size={16} color={tab === 'join' ? '#fff' : '#666'} />
                                <Text style={[styles.tabText, tab === 'join' && styles.tabTextActive]}>Join Room</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        {tab === 'create' ? (
                            <Animated.View entering={FadeInUp.delay(300).duration(500)} style={[styles.card, glassStyles.container]}>
                                <Text style={styles.cardHeading}>Select Room Type</Text>
                                <View style={styles.modeRow}>
                                    <TouchableOpacity 
                                        style={[styles.modeBtn, glassStyles.container, roomType === 'video' && styles.modeBtnActive]} 
                                        onPress={() => { setRoomType('video'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                    >
                                        <Ionicons name="videocam" size={20} color={roomType === 'video' ? '#fff' : '#2D1B69'} />
                                        <Text style={[styles.modeBtnText, roomType === 'video' && styles.modeBtnTextActive]}>Video</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.modeBtn, glassStyles.container, roomType === 'normal' && styles.modeBtnActive]} 
                                        onPress={() => { setRoomType('normal'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                    >
                                        <Ionicons name="chatbubble-ellipses" size={20} color={roomType === 'normal' ? '#fff' : '#2D1B69'} />
                                        <Text style={[styles.modeBtnText, roomType === 'normal' && styles.modeBtnTextActive]}>Normal</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.cardDesc}>Hosts can invite their partner and choose if they want to see via video or just text.</Text>
                                <View style={styles.featureList}>
                                    <View style={styles.featureRow}>
                                        <View style={styles.featureDot} />
                                        <Text style={styles.featureText}>Real-time synchronized dares</Text>
                                    </View>
                                    <View style={styles.featureRow}>
                                        <View style={styles.featureDot} />
                                        <Text style={styles.featureText}>Interactive cloud scores</Text>
                                    </View>
                                    <View style={styles.featureRow}>
                                        <View style={styles.featureDot} />
                                        <Text style={styles.featureText}>{roomType === 'video' ? 'Live video reaction' : 'Live emoji reactions'}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={handleCreateRoom} disabled={loading} activeOpacity={0.85} style={styles.primaryBtnWrap}>
                                    <LinearGradient colors={['#FF9800', '#FF6B35']} style={styles.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        <Ionicons name="add-circle-outline" size={20} color="#fff" />
                                        <Text style={styles.primaryBtnText}>{loading ? 'Creating...' : 'Create Room'}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        ) : (
                            <Animated.View entering={FadeInUp.delay(300).duration(500)} style={[styles.card, glassStyles.container]}>
                                <Text style={styles.cardHeading}>🔗 Join a Session</Text>
                                <Text style={styles.cardDesc}>Enter the 6-character code your partner shared with you.</Text>
                                <TextInput
                                    style={styles.codeInput}
                                    placeholder="ENTER CODE"
                                    placeholderTextColor="#ccc"
                                    value={joinCode}
                                    onChangeText={t => setJoinCode(t.toUpperCase())}
                                    maxLength={6}
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity onPress={() => handleJoinRoom()} disabled={loading} activeOpacity={0.85} style={styles.primaryBtnWrap}>
                                    <LinearGradient colors={['#2D1B69', '#5B3FCF']} style={styles.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        <Ionicons name="enter-outline" size={20} color="#fff" />
                                        <Text style={styles.primaryBtnText}>{loading ? 'Joining...' : 'Join Room'}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </AnimatedBackground>
        );
    }

    if (isWaiting && isHost && !partnerConnected) {
        return (
            <View style={styles.waitRoot}>
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={['#1a1035', '#2D1B69', '#4A2C8A']} style={StyleSheet.absoluteFill} />
                <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                    <View style={styles.navBar}>
                        <View style={{ width: 40 }} />
                        <Text style={[styles.navTitle, { color: '#fff' }]}>LDR Mode</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <Animated.View entering={FadeIn.duration(600)} style={styles.waitContent}>
                        <View style={[styles.waitIconWrap, { backgroundColor: 'rgba(255,107,53,0.2)' }]}>
                            <Ionicons name="heart" size={42} color="#FF6B35" />
                        </View>
                        <Text style={styles.waitTitle}>Session Ready!</Text>
                        <Text style={styles.waitSubtitle}>Share your code with {partner2 || 'your partner'}</Text>
                        <View style={styles.codeBox}>
                            {(generatedCode || '').split('').map((ch, i) => (
                                <View key={i} style={[styles.codeChar, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                    <Text style={styles.codeCharText}>{ch}</Text>
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity style={[styles.shareBtn, glassStyles.container, { borderColor: 'rgba(255,107,53,0.5)' }]} onPress={shareCode}>
                            <Ionicons name="share-outline" size={18} color="#FF6B35" />
                            <Text style={styles.shareBtnText}>Share Code</Text>
                        </TouchableOpacity>
                        <View style={styles.waitingIndicator}>
                            <View style={styles.waitDot} />
                            <Text style={styles.waitingText}>Waiting for partner to join...</Text>
                        </View>
                        <TouchableOpacity style={styles.leaveLinkBtn} onPress={leaveRoom}>
                            <Text style={styles.leaveLinkText}>Cancel Session</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <View style={styles.sessionRoot}>
                <StatusBar barStyle="dark-content" />
                <SafeAreaView edges={['top']}>
                    <Animated.View entering={FadeInDown.duration(500)} style={[styles.navBar, glassStyles.header]}>
                        <View style={{ width: 40 }} />
                        <Text style={styles.navTitle}>LDR Mode</Text>
                        <View style={{ width: 40 }} />
                    </Animated.View>
                </SafeAreaView>

                {showConfetti && (
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        <LottieView source={require('../../assets/confetti.json')} autoPlay loop={false} style={StyleSheet.absoluteFill} />
                    </View>
                )}

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={[styles.sessionScroll, { paddingTop: 10, paddingBottom: insets.bottom + 16 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {roomData?.room_type === 'video' && (
                        <Animated.View entering={FadeInDown.duration(400)} style={styles.videoSection}>
                            <PartnerVideoCard 
                                name={partner2 || 'Partner'} 
                                isLive={partnerConnected} 
                                remoteUid={remoteUid} 
                            />
                        </Animated.View>
                    )}

                    {activeCard ? (
                        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={[styles.dareCard, glassStyles.container, { borderColor: 'rgba(255,107,53,0.3)' }]}>
                            <View style={styles.dareCardHeader}>
                                <View style={styles.dareActiveLabel}>
                                    <View style={styles.dareActiveDot} />
                                    <Text style={styles.dareActiveText}>ACTIVE DARE</Text>
                                </View>
                                <DareTimer seconds={activeCard.timer ?? 45} />
                            </View>
                            <Text style={styles.dareTitle}>"{activeCard.text}"</Text>
                            <Text style={styles.dareDesc}>Complete the dare and tap Done when finished!</Text>
                            <View style={styles.dareActions}>
                                <TouchableOpacity style={[styles.skipBtn, glassStyles.container]} onPress={handleSkip}>
                                    <Ionicons name="play-skip-forward" size={14} color="#FF9800" />
                                    <Text style={styles.skipBtnText}>Skip</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
                                    <LinearGradient colors={['#10B981', '#059669']} style={styles.doneBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                        <Text style={styles.doneBtnText}>Done!</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    ) : (
                        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={[styles.drawPromptCard, glassStyles.container]}>
                            <View style={[styles.turnBar, roomData?.current_turn_user_id === userId ? styles.turnBarActive : styles.turnBarWait]}>
                                <Ionicons name={roomData?.current_turn_user_id === userId ? "flash" : "time-outline"} size={16} color="#fff" />
                                <Text style={styles.turnBarText}>
                                    {roomData?.current_turn_user_id === userId ? 'IT IS YOUR TURN!' : `WAITING FOR ${partner2?.toUpperCase() || 'PARTNER'}...`}
                                </Text>
                            </View>
                            <Text style={styles.drawPromptTitle}>Ready to Play?</Text>
                            <Text style={styles.drawPromptSub}>
                                {roomData?.current_turn_user_id === userId ? 'Draw a dare to start your turn!' : `${partner2 || 'Partner'} is currently picking their dare...`}
                            </Text>
                            {roomData?.current_turn_user_id === userId && (
                                <TouchableOpacity style={styles.drawBtnWrap} onPress={handleDrawDare} activeOpacity={0.85}>
                                    <LinearGradient colors={['#FF9800', '#FF6B35']} style={styles.drawBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        <Ionicons name="shuffle" size={20} color="#fff" />
                                        <Text style={styles.drawBtnText}>Draw a Dare</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </Animated.View>
                    )}

                    {roomData?.room_type === 'video' && (
                        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.videoSection}>
                            <SelfVideoCard name={partner1 || 'You'} isCameraOn={isCameraOn} />
                        </Animated.View>
                    )}

                    {roomData && (
                        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={[styles.scoreRow, glassStyles.container]}>
                            <View style={styles.scoreItem}>
                                <Text style={styles.scoreName}>{partner1 || 'You'}</Text>
                                <Text style={styles.scoreValue}>{roomData.host_score ?? 0}</Text>
                            </View>
                            <View style={styles.scoreVs}><Text style={styles.scoreVsText}>pts</Text></View>
                            <View style={styles.scoreItem}>
                                <Text style={styles.scoreName}>{partner2 || 'Partner'}</Text>
                                <Text style={styles.scoreValue}>{roomData.guest_score ?? 0}</Text>
                            </View>
                        </Animated.View>
                    )}

                    <Animated.View entering={FadeInUp.delay(350).duration(400)} style={styles.bottomControls}>
                        <View style={[styles.reactionPicker, glassStyles.container]}>
                            {(['❤️', '🔥', '😘', '✨', '🥰'] as const).map(e => (
                                <TouchableOpacity key={e} onPress={() => sendReaction(e)} style={[styles.reactionBtn, glassStyles.container]}>
                                    <Text style={{ fontSize: 24 }}>{e}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.syncBtn} activeOpacity={0.85} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
                            <LinearGradient colors={['#FF9800', '#FF6B35']} style={styles.syncBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Ionicons name="sync" size={18} color="#fff" />
                                <Text style={styles.syncBtnText}>Sync Reactions</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.controlBtns}>
                            <TouchableOpacity style={[styles.controlBtn, glassStyles.container]} onPress={() => router.push(`/chat/${roomId}?name=${encodeURIComponent(partner2 || 'Partner')}`)}>
                                <Ionicons name="chatbubbles-outline" size={22} color="#666" />
                                {messages.length > 0 && <View style={styles.chatBadge} />}
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.controlBtn, glassStyles.container]} onPress={() => setIsMuted(!isMuted)}>
                                <Ionicons name={isMuted ? 'mic-off-outline' : 'mic-outline'} size={22} color={isMuted ? '#FF4444' : '#666'} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.controlBtn, glassStyles.container]} onPress={() => setIsCameraOn(!isCameraOn)}>
                                <Ionicons name={isCameraOn ? 'videocam-outline' : 'videocam-off-outline'} size={22} color={isCameraOn ? '#666' : '#999'} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.endCallBtn} onPress={leaveRoom}>
                                <Ionicons name="call" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </View>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    setupRoot: { flex: 1, backgroundColor: 'transparent' },
    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    navTitle: { fontFamily: 'Pacifico_400Regular', fontSize: 20, color: '#1a1a1a' },
    setupScroll: { paddingHorizontal: 20, paddingBottom: 40 },
    setupHeader: { alignItems: 'center', paddingTop: 20, paddingBottom: 28 },
    setupIconWrap: { marginBottom: 14 },
    setupIcon: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    setupSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
    tabRow: { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 20, gap: 4 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 13 },
    tabActive: { backgroundColor: '#2D1B69' },
    tabText: { fontSize: 13, fontWeight: '700', color: '#666' },
    tabTextActive: { color: '#fff' },
    card: { borderRadius: 24, padding: 24 },
    cardHeading: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 8 },
    cardDesc: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 20 },
    featureList: { gap: 10, marginBottom: 24 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    featureDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B35' },
    featureText: { fontSize: 14, color: '#444', fontWeight: '600' },
    primaryBtnWrap: { borderRadius: 14, overflow: 'hidden' },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    codeInput: { backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 14, borderWidth: 2, borderColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 20, paddingVertical: 16, fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: 8, color: '#2D1B69', marginBottom: 20 },

    waitRoot: { flex: 1 },
    waitContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    waitIconWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    waitTitle: { fontFamily: 'Pacifico_400Regular', fontSize: 30, color: '#fff', marginBottom: 8 },
    waitSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 32, textAlign: 'center' },
    codeBox: { flexDirection: 'row', gap: 8, marginBottom: 32 },
    codeChar: { width: 44, height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    codeCharText: { fontSize: 24, fontWeight: '900', color: '#fff' },
    shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14, marginBottom: 32 },
    shareBtnText: { color: '#FF6B35', fontSize: 15, fontWeight: '700' },
    waitingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    waitDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF9800' },
    waitingText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
    leaveLinkBtn: { marginTop: 28 },
    leaveLinkText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },

    sessionRoot: { flex: 1, backgroundColor: 'transparent' },
    sessionScroll: { paddingHorizontal: 16, gap: 12 },
    videoSection: { width: '100%' },

    dareCard: { borderRadius: 22, padding: 20 },
    dareCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    dareActiveLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dareActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B35' },
    dareActiveText: { fontSize: 11, fontWeight: '900', color: '#FF6B35', letterSpacing: 1 },
    dareTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 8, fontStyle: 'italic' },
    dareDesc: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 18 },
    dareActions: { flexDirection: 'row', gap: 10 },
    skipBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 12 },
    skipBtnText: { fontSize: 14, fontWeight: '700', color: '#FF9800' },
    doneBtn: { flex: 2, borderRadius: 12, overflow: 'hidden' },
    doneBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
    doneBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

    drawPromptCard: { borderRadius: 22, padding: 24, alignItems: 'center' },
    drawPromptTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 8 },
    drawPromptSub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
    drawBtnWrap: { width: '100%', borderRadius: 14, overflow: 'hidden' },
    drawBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    drawBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    scoreRow: { borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
    scoreItem: { alignItems: 'center', gap: 4 },
    scoreName: { fontSize: 12, fontWeight: '700', color: '#888' },
    scoreValue: { fontSize: 28, fontWeight: '900', color: '#1a1a1a' },
    scoreVs: { alignItems: 'center' },
    scoreVsText: { fontSize: 12, color: '#bbb', fontWeight: '600' },

    bottomControls: { gap: 12 },
    syncBtn: { borderRadius: 16, overflow: 'hidden' },
    syncBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18 },
    syncBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    controlBtns: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
    controlBtn: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
    endCallBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FF4444', justifyContent: 'center', alignItems: 'center' },

    reactionsOverlay: { position: 'absolute', bottom: 300, left: 0, right: 0, height: 100, pointerEvents: 'none' },
    reactionBubble: { position: 'absolute', bottom: 0 },
    reactionPicker: { flexDirection: 'row', justifyContent: 'center', gap: 10, padding: 12, borderRadius: 24, marginBottom: 8 },
    reactionBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

    modeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    modeBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', gap: 8 },
    modeBtnActive: { backgroundColor: '#2D1B69' },
    modeBtnText: { fontSize: 14, fontWeight: '700', color: '#2D1B69' },
    modeBtnTextActive: { color: '#fff' },

    turnBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, borderRadius: 12, marginBottom: 16 },
    turnBarActive: { backgroundColor: '#FF6B35' },
    turnBarWait: { backgroundColor: '#A8A8C0' },
    turnBarText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

    vibeFiltersScroll: { paddingVertical: 10, gap: 8, marginTop: 10 },
    vibePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', borderWidth: 1, borderColor: 'transparent' },
    vibePillActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
    vibePillText: { fontSize: 10, fontWeight: '800', color: '#666' },
    vibePillTextActive: { color: '#fff' },

    chatBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B35', borderWidth: 1.5, borderColor: '#fff' },
});
