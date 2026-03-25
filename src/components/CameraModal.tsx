import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { glassStyles } from '../constants/glass';

interface CameraModalProps {
    visible: boolean;
    onClose: () => void;
    onPhotoTaken: (uri: string) => void;
}

export default function CameraModal({ visible, onClose, onPhotoTaken }: CameraModalProps) {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!visible) return null;

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <Modal 
                visible={visible} 
                animationType="slide" 
                transparent={false}
                hardwareAccelerated={true}
                statusBarTranslucent={true}
            >
                <View style={[styles.permissionContainer, { backgroundColor: '#000' }]}>
                    <View style={[styles.iconWrap, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <Ionicons name="camera-outline" size={48} color="#fff" />
                    </View>
                    <Text style={[styles.permissionText, { color: '#fff' }]}>We need camera access to capture your daring proofs! 📸</Text>
                    <TouchableOpacity style={styles.grantButton} onPress={requestPermission} activeOpacity={0.8}>
                        <LinearGradient colors={['#FF6B35', '#FF8C00']} style={styles.btnGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                            <Text style={styles.grantButtonText}>Enable Camera</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={styles.cancelBtnText}>Maybe Later</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    function toggleCameraFacing() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    const takePicture = async () => {
        if (cameraRef && !isProcessing) {
            setIsProcessing(true);
            try {
                const photo = await cameraRef.takePictureAsync({
                    quality: 0.7,
                });
                if (photo) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setPhotoUri(photo.uri);
                }
            } catch (e) {
                console.error('Failed to take picture:', e);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const confirmPhoto = () => {
        if (photoUri) {
            onPhotoTaken(photoUri);
            setPhotoUri(null);
            onClose();
        }
    };

    const retakePhoto = () => {
        setPhotoUri(null);
    };

    const handleClose = () => {
        setPhotoUri(null);
        onClose();
    };

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            transparent={false}
            hardwareAccelerated={true}
            statusBarTranslucent={true}
        >
            <View style={styles.container}>
                {photoUri ? (
                    // PREVIEW SCREEN
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: photoUri }} style={styles.previewImage} />
                        <View style={styles.previewActions}>
                            <TouchableOpacity style={[styles.retakeBtn, glassStyles.container]} onPress={retakePhoto}>
                                <Ionicons name="refresh" size={24} color="#fff" />
                                <Text style={styles.btnText}>Retake</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={confirmPhoto} activeOpacity={0.8}>
                                <LinearGradient colors={['#FF6B35', '#FF8C00']} style={styles.btnGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Ionicons name="checkmark" size={24} color="#fff" />
                                        <Text style={styles.confirmBtnText}>Submit Proof</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    // CAMERA SCREEN
                    <CameraView
                        style={styles.camera}
                        facing={facing}
                        ref={(ref) => setCameraRef(ref)}
                    >
                        <View style={styles.headerRow}>
                            <TouchableOpacity style={styles.iconBtn} onPress={handleClose}>
                                <Ionicons name="close" size={32} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconBtn} onPress={toggleCameraFacing}>
                                <Ionicons name="camera-reverse" size={32} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footerRow}>
                            <TouchableOpacity
                                style={styles.captureBtnInner}
                                onPress={takePicture}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="#FF6B35" />
                                ) : (
                                    <View style={styles.captureCore} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </CameraView>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1, justifyContent: 'space-between' },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    iconBtn: {
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 30,
    },
    footerRow: {
        paddingBottom: 50,
        alignItems: 'center',
    },
    captureBtnInner: {
        width: 80,
        height: 80,
        borderWidth: 4,
        borderColor: '#fff',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 20, 147, 0.5)',
    },
    captureCore: {
        width: 60,
        height: 60,
        backgroundColor: '#fff',
        borderRadius: 30,
    },
    previewContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    previewImage: {
        flex: 1,
        resizeMode: 'cover',
    },
    previewActions: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        justifyContent: 'space-between',
        gap: 12,
    },
    retakeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        height: 60,
        borderRadius: 30,
    },
    confirmBtn: {
        flex: 1.5,
        borderRadius: 30,
        overflow: 'hidden',
    },
    btnGradient: {
        width: '100%',
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 8 },
    confirmBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    iconWrap: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    permissionText: { fontSize: 20, textAlign: 'center', marginBottom: 40, lineHeight: 30, fontWeight: '700' },
    grantButton: { width: '100%', borderRadius: 30, overflow: 'hidden', marginBottom: 15 },
    grantButtonText: { color: '#fff', fontSize: 18, fontWeight: '900' },
    cancelBtn: { padding: 15 },
    cancelBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: '700' }
});

