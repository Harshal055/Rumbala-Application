import React from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    Dimensions, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOut, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store/useStore';
import { glassStyles, glassTokens } from '../constants/glass';

const { width } = Dimensions.get('window');

export default function CustomAlert() {
    const { alertConfig, hideAlert } = useStore();
    const { visible, title, message, buttons } = alertConfig;

    const getIcon = (titleText: string) => {
        const lowerTitle = titleText.toLowerCase();
        if (lowerTitle.includes('error') || lowerTitle.includes('fail') || lowerTitle.includes('wrong')) {
            return { name: 'alert-circle', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
        }
        if (lowerTitle.includes('success') || lowerTitle.includes('done') || lowerTitle.includes('saved')) {
            return { name: 'checkmark-circle', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
        }
        if (lowerTitle.includes('warning') || lowerTitle.includes('caution')) {
            return { name: 'warning', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
        }
        return { name: 'information-circle', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' };
    };

    const icon = getIcon(title || '');

    const handleButtonPress = (onPress?: () => void) => {
        hideAlert();
        if (onPress) {
            // Delay slightly to allow modal to close smoothly
            setTimeout(onPress, 150);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={hideAlert}
            hardwareAccelerated={true}
            statusBarTranslucent={true}
        >
            {visible && (
                <View style={styles.overlay}>
                    <Animated.View 
                        entering={FadeInDown.springify().damping(15).stiffness(100)} 
                        exiting={FadeOut.duration(200)}
                        style={[styles.container, glassStyles.container, { backgroundColor: 'rgba(255, 255, 255, 0.98)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)' }]}
                    >
                        <Animated.View entering={ZoomIn.delay(100)} style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
                            <Ionicons name={icon.name as any} size={42} color={icon.color} />
                        </Animated.View>
    
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
    
                        <View style={[styles.buttonContainer, buttons && buttons.length > 2 && { flexDirection: 'column' }]}>
                            {buttons && buttons.length > 0 ? (
                                buttons.map((btn, idx) => {
                                    const isCancel = btn.style === 'cancel';
                                    const isDestructive = btn.style === 'destructive';
                                    const isDefault = !isCancel && !isDestructive;

                                    if (isDefault) {
                                        return (
                                            <TouchableOpacity 
                                                key={idx}
                                                style={[styles.button, styles.stackButton]}
                                                onPress={() => handleButtonPress(btn.onPress)}
                                                activeOpacity={0.8}
                                            >
                                                <LinearGradient 
                                                    colors={['#1a1a1a', '#333333']}
                                                    style={styles.gradientBtn}
                                                    start={{x:0, y:0}} end={{x:1, y:1}}
                                                >
                                                    <Text style={styles.primaryBtnText}>{btn.text}</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        );
                                    }

                                    return (
                                        <TouchableOpacity 
                                            key={idx}
                                            style={[
                                                styles.button,
                                                isCancel ? styles.cancelBtn : styles.destructiveBtn,
                                                buttons.length > 2 && styles.stackButton
                                            ]}
                                            onPress={() => handleButtonPress(btn.onPress)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[
                                                styles.buttonText,
                                                isCancel ? styles.cancelBtnText : styles.primaryBtnText
                                            ]}>
                                                {btn.text}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <TouchableOpacity 
                                    style={[styles.button, styles.stackButton]}
                                    onPress={() => handleButtonPress()}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient 
                                        colors={['#1a1a1a', '#333333']}
                                        style={styles.gradientBtn}
                                        start={{x:0, y:0}} end={{x:1, y:1}}
                                    >
                                        <Text style={styles.primaryBtnText}>OK</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                </View>
            )}
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1a1a1a',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#444',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        fontWeight: '600',
        paddingHorizontal: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        height: 54,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    gradientBtn: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stackButton: {
        width: '100%',
    },
    defaultBtn: {
        backgroundColor: '#1a1a1a',
    },
    destructiveBtn: {
        backgroundColor: '#EF4444',
    },
    cancelBtn: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
    cancelBtnText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '800',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '900',
    }
});
