import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Alert, Share, StatusBar, ScrollView,
    ActivityIndicator, useWindowDimensions
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue, useAnimatedStyle, withRepeat, withSequence,
    withTiming, Easing, FadeIn, FadeInDown, FadeInUp,
    withDelay, cancelAnimation
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useStore } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import {
    createLdrRoomV2, joinLdrRoomV2, subscribeToRoomV2,
    syncDrawnCardV2, updateRoomScoreV2, clearRoomCardV2,
    RoomData, sendChatMessageV2, subscribeToChatV2, getRoomDataV2, getChatMessagesV2
} from '../../src/services/roomApi';
import { CARDS, DareCard, CardType } from '../../src/constants/cards';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput } from 'react-native';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../../src/constants/glass';
import PaywallModal from '../../src/components/PaywallModal';
import { purchasePackage } from '../../src/services/revenueCatService';
import * as AgoraModule from 'react-native-agora';
import UIKitModule from 'agora-rn-uikit';

const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || ''; 


const BG_COLORS = ['#F5F3FF', '#EDE9F8', '#FDFCFB']; // Techy romantic LDR base

// ── Timer Component ──
function DareTimer({ seconds }: { seconds: number }) {
    const [remaining, setRemaining] = useState(seconds);
    useEffect(() => {
        setRemaining(seconds);
        const interval = setInterval(() => {
            setRemaining((prev: number) => (prev > 0 ? prev - 1 : 0));
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
function PartnerVideoCard({ name, isLive, remoteUid, isAgoraLoaded, AgoraModule, roomId }: { name: string; isLive: boolean; remoteUid: number | null, isAgoraLoaded: boolean, AgoraModule: any, roomId: string | null }) {
    const glow = useSharedValue(0.5);
    useEffect(() => {
        glow.value = withRepeat(withSequence(
            withTiming(1, { duration: 1500 }),
            withTiming(0.5, { duration: 1500 }),
        ), -1, true);
        return () => cancelAnimation(glow);
    }, []);
    const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

    if (isLive && remoteUid) {
        return (
            <View style={[pv.card, glassStyles.container]}>
                {isAgoraLoaded && AgoraModule?.RtcSurfaceView ? (
                    <AgoraModule.RtcSurfaceView 
                        style={StyleSheet.absoluteFill} 
                        canvas={{ uid: remoteUid ?? 0, channelId: roomId?.trim().toUpperCase(), renderMode: AgoraModule.RenderModeType?.RenderModeFit ?? 1 }} 
                    />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
                )}
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

// ── Pulse Ring Component ──
function PulseRing() {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.2);
    useEffect(() => {
        scale.value = withRepeat(withTiming(1.5, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
        opacity.value = withRepeat(withSequence(withTiming(0.4, { duration: 1000 }), withTiming(0, { duration: 1000 })), -1, false);
        return () => {
            cancelAnimation(scale);
            cancelAnimation(opacity);
        };
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));
    return <Animated.View style={[styles.pulseRing, animatedStyle]} />;
}

// ── Agora Utility ──
// Agora requires numeric UIDs (32-bit int). Supabase gives UUID strings.
const getNumericUid = (uuid?: string): number => {
    if (!uuid) return 0;
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
        const char = uuid.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Force to 32-bit signed integer
    }
    return Math.abs(hash);
};

// ── You (Self) Video Card ──
function SelfVideoCard({ name, isCameraOn, isAgoraLoaded, AgoraModule, engine, localUid, isJoined, roomId }: { name: string; isCameraOn: boolean; isAgoraLoaded: boolean; AgoraModule: any; engine: any; localUid: number | null; isJoined: boolean; roomId: string | null }) {
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

    const canShowAgoraPreview = isJoined && isAgoraLoaded && AgoraModule?.RtcSurfaceView && engine?.current && typeof localUid === 'number';
    const normalizedRoomId = roomId?.trim().toUpperCase();

    return (
        <View style={[sv.card, glassStyles.container]}>
            {canShowAgoraPreview ? (
                <AgoraModule.RtcSurfaceView
                    style={StyleSheet.absoluteFill}
                    canvas={{
                        uid: 0,
                        channelId: normalizedRoomId,
                        sourceType: AgoraModule.VideoSourceType?.VideoSourceCameraPrimary ?? 0,
                        renderMode: AgoraModule.RenderModeType?.RenderModeFit ?? 1,
                        mirrorMode: AgoraModule.VideoMirrorModeType?.VideoMirrorModeEnabled ?? 1,
                    }}
                    zOrderMediaOverlay={true}
                />
            ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0f0f14', justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator color="#FF6B35" />
                </View>
            )}
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
        partner1, partner2, setPartner1, setPartner2,
        roomId, setRoomId, setIsHost, isHost,
        cardCount, setCardCount, addHistoryEntry, addPoint, userId, isPro, showAlert, setMode
    } = useStore(useShallow(state => ({
        partner1: state.partner1,
        partner2: state.partner2,
        setPartner1: state.setPartner1,
        setPartner2: state.setPartner2,
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
    const { width, height } = useWindowDimensions();
    const [joinCode, setJoinCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [isValidatingRoom, setIsValidatingRoom] = useState(false);
    const [isRoomValidated, setIsRoomValidated] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [tab, setTab] = useState<'create' | 'join'>('create');
    const [messages, setMessages] = useState<any[]>([]);
    const [roomType, setRoomType] = useState<'video' | 'normal'>('video');
    const [selectedLdrVibe, setSelectedLdrVibe] = useState<CardType | 'all'>('all');
    const [showPaywall, setShowPaywall] = useState(false);

    const activeCard: DareCard | null = roomData?.current_card ?? null;
    const partnerConnected = !!roomData?.guest_user_id;

    const engine = useRef<any>(null);
    const [localUid, setLocalUid] = useState<number | null>(null);
    const [hasLocalVideoFrame, setHasLocalVideoFrame] = useState(false);
    const [remoteUid, setRemoteUid] = useState<number | null>(null);
    const [useCustomUI, setUseCustomUI] = useState(true); 
    const [isJoined, setIsJoined] = useState(false);
    const isAgoraLoaded = true;
    const isAgoraInitializing = useRef(false);

    // 🛡️ Session Activity Validation (Self-Cleaning)
    useEffect(() => {
        if (!roomId) {
            setIsRoomValidated(false);
            setIsValidatingRoom(false);
            return;
        }

        if (isRoomValidated) {
            setIsValidatingRoom(false);
            return;
        }

        setIsValidatingRoom(true);
        setIsRoomValidated(false);

        const timeoutId = setTimeout(() => {
            console.warn('--- ROOM VALIDATION TIMEOUT: clearing stale roomId');
            setRoomId(null);
            setRoomData(null);
            setIsWaiting(false);
            setIsRoomValidated(false);
            setIsValidatingRoom(false);
            leaveAgora();
        }, 6000);

        (async () => {
            try {
                const { getRoomDataV2 } = await import('../../src/services/roomApi');
                const data = await getRoomDataV2(roomId);
                if (!data || !data.is_active) {
                    console.log('--- INVALID OR INACTIVE ROOM DETECTED. EJECTING...');
                    setRoomId(null);
                    setRoomData(null);
                    setIsWaiting(false);
                    setIsRoomValidated(false);
                    leaveAgora();
                } else {
                    setRoomData(data);
                    setRoomType(data.room_type || 'video');
                    if (data.guest_user_id) setIsWaiting(false);
                    else if (isHost) setIsWaiting(true);
                    setIsRoomValidated(true);
                }
            } catch (e) {
                console.warn('Session verification failed:', e);
                setRoomId(null); // Clear on any error to be safe
                setIsRoomValidated(false);
                leaveAgora();
            } finally {
                clearTimeout(timeoutId);
                setIsValidatingRoom(false);
            }
        })();

        return () => clearTimeout(timeoutId);
    }, [roomId, isHost, isRoomValidated]);

    // Sync partner display names from room data to local store to avoid mismatches
    useEffect(() => {
        if (!roomData || !userId) return;

        const selfIsHost = roomData.host_user_id === userId;
        const myName = selfIsHost ? roomData.host_name : roomData.guest_name;
        const partnerName = selfIsHost ? roomData.guest_name : roomData.host_name;

        if (myName && myName !== partner1) setPartner1(myName);
        if (partnerName && partnerName !== partner2) setPartner2(partnerName);
    }, [roomData?.host_name, roomData?.guest_name, roomData?.host_user_id, roomData?.guest_user_id, userId, partner1, partner2, setPartner1, setPartner2]);

    useEffect(() => {
        if (!roomId || !isRoomValidated) return;

        const unsubRoom = subscribeToRoomV2(roomId, (data: RoomData) => {
            setRoomData(data);
            setRoomType(data.room_type || 'video');
            if (data.guest_user_id) {
                setIsWaiting(false);
            }
        });
        const unsubChat = subscribeToChatV2(roomId, (msgs: any[]) => {
            setMessages(msgs);
        });

        return () => {
            unsubRoom();
            unsubChat();
        };
    }, [roomId, isRoomValidated]);

    const ensureMediaPermissions = async () => {
        const { Camera } = await import('expo-camera');

        let camStatus = (await Camera.getCameraPermissionsAsync()).status;
        if (camStatus !== 'granted') {
            camStatus = (await Camera.requestCameraPermissionsAsync()).status;
        }

        let micStatus = (await Camera.getMicrophonePermissionsAsync()).status;
        if (micStatus !== 'granted') {
            micStatus = (await Camera.requestMicrophonePermissionsAsync()).status;
        }

        const ok = camStatus === 'granted' && micStatus === 'granted';
        if (!ok) {
            showAlert('Permissions Required', 'Camera and Microphone access are needed for video calls.');
        }
        return ok;
    };

    // Retry Agora init when modules finish loading after validation is done
    useEffect(() => {
        const effectiveRoomType = roomData?.room_type || roomType;
        if (!roomId || !isRoomValidated || effectiveRoomType !== 'video') {
            if (engine.current) leaveAgora();
            return;
        }
        if (!isAgoraLoaded) return;

        let cancelled = false;
        (async () => {
            const hasPermission = await ensureMediaPermissions();
            if (!hasPermission || cancelled) return;
            await initAgora();
        })();

        return () => {
            cancelled = true;
        };
    }, [roomId, roomData?.room_type, roomType, isRoomValidated, isAgoraLoaded]);

    useEffect(() => {
        return () => {
            leaveAgora();
        };
    }, []);

    const initAgora = async () => {
        if (engine.current || isAgoraInitializing.current) return;

        if (AGORA_APP_ID === 'YOUR_AGORA_APP_ID' || !AGORA_APP_ID) {
            console.warn('--- AGORA: APP ID not set. Check your .env file.');
            showAlert('Config Error', 'Agora App ID is missing. Check your .env setup.');
            return;
        }
        
        // Safety check for caching issues
        console.log(`--- AGORA: Using App ID (last 6): ...${AGORA_APP_ID.slice(-6)}`);
        
        if (!isAgoraLoaded || !AgoraModule) return;
        const roomCode = roomId?.trim().toUpperCase();
        if (!roomCode) {
            console.warn('--- AGORA: Missing room code, skipping channel join.');
            return;
        }
        try {
            isAgoraInitializing.current = true;
            const numericUid = getNumericUid(userId || undefined);
            setLocalUid(numericUid);
            console.log(`--- AGORA: INITIALIZING FOR USER: ${numericUid} (from ${userId})`);

            engine.current = AgoraModule.createAgoraRtcEngine();
            engine.current.initialize({ appId: AGORA_APP_ID });
            
            engine.current.registerEventHandler({
                onJoinChannelSuccess: (connection: any, elapsed: number) => {
                    console.log('--- AGORA: SUCCESSFULLY JOINED CHANNEL:', connection.channelId, 'UID:', connection.localUid);
                    setIsJoined(true);
                    if (typeof connection?.localUid === 'number') setLocalUid(connection.localUid);
                    try {
                        engine.current?.enableLocalAudio(!isMuted);
                        engine.current?.muteLocalAudioStream(isMuted);
                        if (engine.current?.setEnableSpeakerphone) {
                            engine.current.setEnableSpeakerphone(true);
                        }
                    } catch (audioErr) {
                        console.warn('--- AGORA: Failed to apply local audio state on join:', audioErr);
                    }
                },
                onUserJoined: (connection: any, uid: number, elapsed: number) => {
                    console.log('--- AGORA: REMOTE USER JOINED:', uid);
                    setRemoteUid(uid);
                    try {
                        if (engine.current?.muteRemoteAudioStream) {
                            engine.current.muteRemoteAudioStream(uid, false);
                        }
                    } catch (remoteAudioErr) {
                        console.warn('--- AGORA: Failed to unmute remote audio stream:', remoteAudioErr);
                    }
                },
                onUserOffline: (connection: any, uid: number, reason: number) => {
                    console.log('--- AGORA: USER OFFLINE:', uid);
                    setRemoteUid(null);
                },
                onFirstLocalVideoFrame: () => {
                    setHasLocalVideoFrame(true);
                },
                onFirstLocalVideoFramePublished: () => {
                    setHasLocalVideoFrame(true);
                },
                onError: (err: number, msg: string) => {
                    console.error('--- AGORA ERROR:', err, msg);
                    // Show a helpful alert for common failures
                    if (err === 101) showAlert('Agora Error', 'Invalid App ID. Please check your .env file.');
                    else if (err === 110) showAlert('Agora Error', 'Token required but not provided. Check Agora Console settings.');
                    else showAlert('Video Error', `Connection failed: ${msg} (Code: ${err})`);
                }
            });

            engine.current.enableVideo();
            engine.current.enableAudio(); 
            engine.current.enableLocalAudio(true);
            engine.current.enableLocalVideo(true);
            engine.current.setClientRole(AgoraModule.ClientRoleType.ClientRoleBroadcaster);
            if (engine.current.setAudioProfile && AgoraModule.AudioProfileType && AgoraModule.AudioScenarioType) {
                engine.current.setAudioProfile(
                    AgoraModule.AudioProfileType.AudioProfileDefault,
                    AgoraModule.AudioScenarioType.AudioScenarioDefault,
                );
            }
            if (engine.current.setDefaultAudioRouteToSpeakerphone) {
                engine.current.setDefaultAudioRouteToSpeakerphone(true);
            }
            if (engine.current.setEnableSpeakerphone) {
                engine.current.setEnableSpeakerphone(true);
            }
            if (engine.current.muteAllRemoteAudioStreams) engine.current.muteAllRemoteAudioStreams(false);
            if (engine.current.muteAllRemoteVideoStreams) engine.current.muteAllRemoteVideoStreams(false);
            engine.current.setVideoEncoderConfiguration({
                dimensions: { width: 640, height: 360 },
                frameRate: 15,
                bitrate: 600,
                orientationMode: AgoraModule.OrientationMode.OrientationModeAdaptive,
            });
            engine.current.startPreview();
            engine.current.adjustPlaybackSignalVolume(100);
            
            const channelId = roomCode;
            console.log(`--- AGORA: JOINING CHANNEL: "${channelId}" as UID: ${numericUid}`);
            
            engine.current.joinChannel('', channelId, numericUid, {
                channelProfile: AgoraModule.ChannelProfileType.ChannelProfileCommunication,
                clientRoleType: AgoraModule.ClientRoleType.ClientRoleBroadcaster,
                publishMicrophoneTrack: true,
                publishCameraTrack: isCameraOn,
                autoSubscribeAudio: true,
                autoSubscribeVideo: true,
            });
        } catch (e) {
            console.error('Failed to init Agora:', e);
            showAlert('Video Error', 'Failed to initialize video call. Please try reconnecting.');
        } finally {
            isAgoraInitializing.current = false;
        }
    };

    const leaveAgora = () => {
        if (engine.current) {
            engine.current.leaveChannel();
            engine.current.release();
            engine.current = null;
            setIsJoined(false);
            setRemoteUid(null);
            setHasLocalVideoFrame(false);
            setLocalUid(null);
        }
    };

    useEffect(() => {
        if (engine.current && isJoined) {
            engine.current.enableLocalAudio(!isMuted);
            engine.current.muteLocalAudioStream(isMuted);
        }
    }, [isMuted, isJoined]);

    useEffect(() => {
        if (engine.current && isJoined) {
            engine.current.enableLocalVideo(isCameraOn);
            engine.current.muteLocalVideoStream(!isCameraOn);
            if (!isCameraOn) setHasLocalVideoFrame(false);
        }
    }, [isCameraOn, isJoined]);

    const handleCreateRoom = async () => {
        if (!userId) { showAlert('Login Required', 'Please log in first to create a room.'); return; }
        if (!isPro && roomType === 'video') {
            setShowPaywall(true); 
            return; 
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        try {
            const code = await createLdrRoomV2(userId, partner1 || 'Player 1', roomType);
            setGeneratedCode(code);
            setIsWaiting(true);
            setRoomId(code);
            setIsHost(true);
            setMode('ldr');
            setIsRoomValidated(true);
            setIsValidatingRoom(false);
        } catch (e: any) {
            showAlert('Error', e.message || 'Failed to create room. Please try again.');
        } finally { setLoading(false); }
    };

    const handleJoinRoom = async (codeOverride?: string) => {
        if (!userId) { showAlert('Login Required', 'Please log in first to join a room.'); return; }
        const code = (codeOverride ?? joinCode).replace(/\s+/g, '').toUpperCase();
        if (code.length !== 6) { showAlert('Invalid Code', 'Room codes must be exactly 6 characters.'); return; }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        try {
            await joinLdrRoomV2(code, userId, partner1 || 'Guest');
            setRoomId(code); 
            setIsHost(false); 
            setMode('ldr');
            setIsRoomValidated(true);
            setIsValidatingRoom(false);
            setJoinCode('');
        } catch (e: any) {
            console.error('JOIN ERROR:', e);
            const msg = e.message || '';

            showAlert('Join Failed', `${msg}\n\nCheck your internet connection and room code.`);
        } finally { setLoading(false); }
    };

    const handleManualSync = async () => {
        if (!roomId) return;
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const [latestRoom, latestMessages] = await Promise.all([
                getRoomDataV2(roomId),
                getChatMessagesV2(roomId),
            ]);
            if (latestRoom) {
                setRoomData(latestRoom);
            }
            if (latestMessages) {
                setMessages(latestMessages);
            }
        } catch {
            showAlert('Sync Failed', 'Could not refresh room state. Please try again.');
        }
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
            const actingAsHost = roomData.host_user_id === userId;
            const h = (roomData.host_score ?? 0) + (actingAsHost ? 1 : 0);
            const g = (roomData.guest_score ?? 0) + (!actingAsHost ? 1 : 0);
            const nextTurnId = actingAsHost ? roomData.guest_user_id : roomData.host_user_id;
            if (nextTurnId) { await updateRoomScoreV2(roomId, h, g, nextTurnId); }
            else { await updateRoomScoreV2(roomId, h, g); }
            await clearRoomCardV2(roomId);
            if (roomData) setRoomData({ ...roomData, current_card: null, host_score: h, guest_score: g, current_turn_user_id: nextTurnId || roomData.current_turn_user_id });
            addPoint('both');
            addHistoryEntry({ id: Date.now().toString(), date: new Date().toISOString(), card: activeCard, winner: 'both' });
        } catch {
            showAlert('Update Failed', 'Could not sync score update. Please try again.');
        }
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

    const leaveRoom = (skipConfirm: boolean = false) => {
        const performLeave = async () => {
            setLoading(true);
            try {
                // Try to mark as inactive in DB if host
                if (isHost && roomId) {
                    const { supabase } = await import('../../src/services/supabase');
                    await supabase.from('rooms').update({ is_active: false }).eq('code', roomId);
                }
                setRoomId(null); 
                setRoomData(null); 
                setGeneratedCode(null); 
                setIsWaiting(false);
                setIsRoomValidated(false);
                setIsValidatingRoom(false);
                leaveAgora();
            } catch (e) {
                setRoomId(null); // Fallback: clear local state regardless
                setIsRoomValidated(false);
                setIsValidatingRoom(false);
            } finally { setLoading(false); }
        };

        if (skipConfirm) {
            performLeave();
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showAlert('Leave Session', 'Are you sure you want to end this LDR session?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: performLeave },
        ]);
    };

    const handlePaywallSubscribe = async (pkg: any) => {
        try {
            const result = await purchasePackage(pkg);
            if (result.success) {
                useStore.getState().setIsPro(true);
                setShowPaywall(false);
                showAlert('🎉 Welcome to Pro!', 'You now have unlimited access.');
            }
        } catch (e) {
            console.warn('Purchase failed from popup', e);
        }
    };

    const shareCode = async () => {
        if (generatedCode) {
            try { await Share.share({ message: `Join me on Rumbala! Code: ${generatedCode}` }); } catch {}
        }
    };

    if (roomId && isValidatingRoom && !isRoomValidated) {
        return (
            <AnimatedBackground colors={BG_COLORS}>
                <SafeAreaView edges={['top']} style={styles.setupRoot}>
                    <StatusBar barStyle="dark-content" />
                    <View style={[styles.reconnectCard, glassStyles.container]}>
                        <ActivityIndicator size="large" color="#FF6B35" />
                        <Text style={styles.reconnectTitle}>Reconnecting...</Text>
                        <Text style={styles.reconnectSub}>Verifying your last LDR session before joining video.</Text>
                        <TouchableOpacity style={styles.reconnectBtn} onPress={() => leaveRoom(true)}>
                            <Text style={styles.reconnectBtnText}>Skip & go to lobby</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </AnimatedBackground>
        );
    }

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
                            <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} style={[styles.card, glassStyles.container]}>
                                <View style={styles.cardBadge}>
                                    <Text style={styles.cardBadgeText}>HOST A SESSION</Text>
                                </View>
                                <Text style={styles.cardHeading}>Start your journey</Text>
                                <Text style={styles.cardDesc}>Choose your connection type and invite your partner to play together in real-time.</Text>
                                
                                <View style={styles.modeGrid}>
                                    <TouchableOpacity 
                                        activeOpacity={0.7}
                                        style={[styles.modeTile, roomType === 'video' && styles.modeTileActive]} 
                                        onPress={() => { 
                                            if (!isPro) {
                                                setShowPaywall(true);
                                                return;
                                            }
                                            setRoomType('video'); 
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
                                        }}
                                    >
                                        <View style={[styles.modeIconBase, roomType === 'video' ? styles.modeIconActive : styles.modeIconInactive]}>
                                            <Ionicons name="videocam" size={24} color={roomType === 'video' ? '#fff' : '#2D1B69'} />
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Text style={[styles.modeTileTitle, roomType === 'video' && styles.modeTileTitleActive]}>Video Call</Text>
                                            {!isPro && <Ionicons name="diamond" size={12} color="#FF6B35" />}
                                        </View>
                                        <Text style={styles.modeTileSub}>{isPro ? 'Face-to-face dares' : 'Premium Feature'}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        activeOpacity={0.7}
                                        style={[styles.modeTile, roomType === 'normal' && styles.modeTileActive]} 
                                        onPress={() => { setRoomType('normal'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                    >
                                        <View style={[styles.modeIconBase, roomType === 'normal' ? styles.modeIconActive : styles.modeIconInactive]}>
                                            <Ionicons name="chatbubbles" size={24} color={roomType === 'normal' ? '#fff' : '#2D1B69'} />
                                        </View>
                                        <Text style={[styles.modeTileTitle, roomType === 'normal' && styles.modeTileTitleActive]}>Text Mode</Text>
                                        <Text style={styles.modeTileSub}>Sync via reactions</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.spacer} />

                                <TouchableOpacity onPress={handleCreateRoom} disabled={loading} activeOpacity={0.85} style={styles.primaryBtnWrap}>
                                    <LinearGradient colors={['#2D1B69', '#5B3FCF']} style={styles.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Ionicons name="sparkles" size={20} color="#fff" />
                                                <Text style={styles.primaryBtnText}>Initialize Room</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        ) : (
                            <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} style={[styles.card, glassStyles.container]}>
                                <View style={[styles.cardBadge, { backgroundColor: 'rgba(255,107,53,0.1)' }]}>
                                    <Text style={[styles.cardBadgeText, { color: '#FF6B35' }]}>GUEST JOIN</Text>
                                </View>
                                <Text style={styles.cardHeading}>Connect to Partner</Text>
                                <Text style={styles.cardDesc}>Enter the unique code shared by your partner to start your synchronized session.</Text>
                                
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.codeInput}
                                        placeholder="CODE"
                                        placeholderTextColor="rgba(45,27,105,0.2)"
                                        value={joinCode}
                                        onChangeText={t => setJoinCode(t.toUpperCase())}
                                        maxLength={6}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                    />
                                    <View style={styles.inputBgGlow} />
                                </View>

                                <TouchableOpacity onPress={() => handleJoinRoom()} disabled={loading} activeOpacity={0.85} style={styles.primaryBtnWrap}>
                                    <LinearGradient colors={['#FF9800', '#FF6B35']} style={styles.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Ionicons name="enter" size={20} color="#fff" />
                                                <Text style={styles.primaryBtnText}>Join Session</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                    </ScrollView>
                </SafeAreaView>
                <PaywallModal 
                    visible={showPaywall} 
                    onClose={() => setShowPaywall(false)}
                    onSubscribe={handlePaywallSubscribe}
                />
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
                            <TouchableOpacity onPress={() => leaveRoom()} style={styles.backBtn}>
                            <Ionicons name="close-outline" size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={[styles.navTitle, { color: '#fff' }]}>LDR Session</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <Animated.View entering={FadeIn.duration(600)} style={styles.waitContent}>
                        <View style={styles.pulseContainer}>
                            <View style={[styles.waitIconWrap, { backgroundColor: 'rgba(255,107,53,0.3)' }]}>
                                <Ionicons name="heart" size={48} color="#FF6B35" />
                            </View>
                            <PulseRing />
                        </View>
                        
                        <Text style={styles.waitTitle}>Waiting for connection...</Text>
                        <Text style={styles.waitSubtitle}>Your partner needs this code to join your synchronized world</Text>
                        
                        <View style={styles.codeContainer}>
                            {(generatedCode || '').split('').map((ch: string, i: number) => (
                                <View key={i} style={[styles.codeChar, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                                    <Text style={styles.codeCharText}>{ch}</Text>
                                </View>
                            ))}
                        </View>
                        
                        <TouchableOpacity 
                            style={[styles.shareBtnV2, glassStyles.container, { backgroundColor: 'rgba(255,107,53,0.1)' }]} 
                            onPress={shareCode}
                            activeOpacity={0.7}
                        >
                            <LinearGradient colors={['#FF9800', '#FF6B35']} style={styles.sideGlow} start={{x:0,y:0}} end={{x:1,y:0}} />
                            <Ionicons name="share-social" size={20} color="#FF6B35" />
                            <Text style={styles.shareBtnText}>Share Invitation Code</Text>
                        </TouchableOpacity>

                        <View style={styles.statusIndicator}>
                           <ActivityIndicator color="rgba(255,255,255,0.4)" />
                        </View>

                        <TouchableOpacity style={styles.cancelLink} onPress={() => leaveRoom()}>
                            <Text style={styles.cancelLinkText}>Cancel & Exit Session</Text>
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
                        <TouchableOpacity style={styles.backBtn} onPress={() => leaveRoom()}>
                            <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
                        </TouchableOpacity>
                        <Text style={styles.navTitle}>LDR Mode</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setUseCustomUI(!useCustomUI);
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            style={styles.uiToggle}
                        >
                            <Ionicons name={useCustomUI ? "sparkles-outline" : "videocam-outline"} size={22} color={useCustomUI ? "#FF6B35" : "#666"} />
                        </TouchableOpacity>
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
                            {useCustomUI ? (
                                <View style={styles.videoContainer}>
                                    <PartnerVideoCard 
                                        name={partner2 || 'Partner'} 
                                        isLive={partnerConnected} 
                                        remoteUid={remoteUid} 
                                        isAgoraLoaded={isAgoraLoaded}
                                        AgoraModule={AgoraModule}
                                        roomId={roomId}
                                    />
                                    <SelfVideoCard 
                                        name={partner1 || 'You'} 
                                        isCameraOn={isCameraOn} 
                                        isAgoraLoaded={isAgoraLoaded}
                                        AgoraModule={AgoraModule}
                                        engine={engine}
                                        localUid={localUid}
                                        isJoined={isJoined}
                                        roomId={roomId}
                                    />
                                </View>
                            ) : (
                                <View style={styles.uikitWrapper}>
                                {isAgoraLoaded && UIKitModule ? (
                                    <UIKitModule 
                                        connectionData={{
                                            appId: AGORA_APP_ID,
                                            channel: roomId || 'test',
                                        }}
                                        styleProps={{
                                            UIKitContainer: { height: 400, borderRadius: 20, overflow: 'hidden' },
                                        }}
                                    />
                                ) : (
                                    <View style={[styles.uikitWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                                        <Text style={{ color: '#666' }}>Loading Video Engine...</Text>
                                    </View>
                                )}
                                </View>
                            )}
                        </Animated.View>
                    )}

                    {activeCard ? (
                        <Animated.View entering={require('react-native-reanimated').FlipInYRight.springify().damping(15).stiffness(100)} style={[styles.dareCard, glassStyles.container, { borderColor: 'rgba(255,107,53,0.3)' }]}>
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
                        <Animated.View entering={require('react-native-reanimated').ZoomIn.springify().damping(15).stiffness(100)} style={[styles.drawPromptCard, glassStyles.container]}>
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


                    {roomData && (
                        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={[styles.scoreRow, glassStyles.container]}>
                            <View style={styles.scoreItem}>
                                <Text style={styles.scoreName}>{partner1 || 'You'}</Text>
                                <Text style={styles.scoreValue}>{roomData.host_user_id === userId ? (roomData.host_score ?? 0) : (roomData.guest_score ?? 0)}</Text>
                            </View>
                            <View style={styles.scoreVs}><Text style={styles.scoreVsText}>pts</Text></View>
                            <View style={styles.scoreItem}>
                                <Text style={styles.scoreName}>{partner2 || 'Partner'}</Text>
                                <Text style={styles.scoreValue}>{roomData.host_user_id === userId ? (roomData.guest_score ?? 0) : (roomData.host_score ?? 0)}</Text>
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

                        <TouchableOpacity style={styles.syncBtn} activeOpacity={0.85} onPress={handleManualSync}>
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
                            <TouchableOpacity style={styles.endCallBtn} onPress={() => leaveRoom(true)}>
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
    reconnectCard: { marginTop: 80, marginHorizontal: 20, padding: 24, borderRadius: 20, alignItems: 'center', gap: 12 },
    reconnectTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
    reconnectSub: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18 },
    reconnectBtn: { marginTop: 4, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(255,107,53,0.12)' },
    reconnectBtnText: { color: '#FF6B35', fontWeight: '700' },
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
    pulseContainer: { marginBottom: 32, alignItems: 'center', justifyContent: 'center' },
    waitIconWrap: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    pulseRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: 'rgba(255,107,53,0.2)', zIndex: 1 },
    waitTitle: { fontFamily: 'Pacifico_400Regular', fontSize: 32, color: '#fff', marginBottom: 12, textAlign: 'center' },
    waitSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 40, textAlign: 'center', lineHeight: 20 },
    codeContainer: { flexDirection: 'row', gap: 10, marginBottom: 48 },
    codeChar: { width: 48, height: 60, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    codeCharText: { fontSize: 28, fontWeight: '900', color: '#fff' },
    shareBtnV2: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, paddingHorizontal: 28, paddingVertical: 18, marginBottom: 24, overflow: 'hidden' },
    sideGlow: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, opacity: 0.8 },
    shareBtnText: { color: '#FF6B35', fontSize: 16, fontWeight: '800' },
    statusIndicator: { height: 60, justifyContent: 'center' },
    cancelLink: { marginTop: 32, padding: 10 },
    cancelLinkText: { color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },

    sessionRoot: { flex: 1, backgroundColor: 'transparent' },
    sessionScroll: { paddingHorizontal: 16, gap: 12 },
    uiToggle: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    videoSection: { width: '100%', marginBottom: 8 },
    videoContainer: { gap: 12 },
    cardBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(45,27,105,0.08)', marginBottom: 16 },
    cardBadgeText: { fontSize: 10, fontWeight: '900', color: '#2D1B69', letterSpacing: 1 },
    modeGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    modeTile: { flex: 1, padding: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center' },
    modeTileActive: { backgroundColor: 'rgba(45,27,105,0.05)', borderColor: 'rgba(45,27,105,0.2)' },
    modeIconBase: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    modeIconActive: { backgroundColor: '#2D1B69' },
    modeIconInactive: { backgroundColor: 'rgba(45,27,105,0.08)' },
    modeTileTitle: { fontSize: 14, fontWeight: '800', color: '#2D1B69', marginBottom: 2 },
    modeTileTitleActive: { color: '#2D1B69' },
    modeTileSub: { fontSize: 10, color: '#666', fontWeight: '500' },
    spacer: { height: 4 },
    inputWrapper: { position: 'relative', marginBottom: 24, padding: 4 },
    inputBgGlow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 28, backgroundColor: 'rgba(255,107,53,0.05)', zIndex: -1 },
    uikitWrapper: {
        height: 400,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 12,
    },
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
