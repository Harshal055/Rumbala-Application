/**
 * SafeScreen — Per-screen Error Boundary Wrapper
 *
 * Catches render errors within individual screens so that a crash on one
 * tab doesn't take down the entire app. Shows a compact, inline recovery
 * card instead of the full-page crash screen.
 *
 * Usage:
 *   <SafeScreen name="Home">
 *     <HomeContent />
 *   </SafeScreen>
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import {
    buildCrashReport,
    saveCrashLog,
    uploadCrashReport,
} from '../services/crashReporter';

interface Props {
    children: ReactNode;
    /** Name of the screen — used in crash reports for context. */
    name: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    reportSent: boolean;
}

export default class SafeScreen extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, reportSent: false };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const report = buildCrashReport(error, 'error_boundary', {
            isFatal: false,
            componentStack: errorInfo.componentStack || undefined,
            screen: this.props.name,
        });

        await saveCrashLog(report);
        uploadCrashReport(report).catch(() => {});
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, reportSent: false });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Animated.View entering={ZoomIn.springify()} style={styles.iconWrap}>
                        <Ionicons name="sad-outline" size={48} color="#FF6B35" />
                    </Animated.View>

                    <Animated.Text entering={FadeInDown.delay(100)} style={styles.title}>
                        This screen hit a snag
                    </Animated.Text>

                    <Animated.Text entering={FadeInDown.delay(200)} style={styles.subtitle}>
                        The {this.props.name} page encountered an error.{'\n'}
                        Your data is safe — tap below to reload.
                    </Animated.Text>

                    <Animated.View entering={FadeInDown.delay(300)} style={styles.errorBox}>
                        <Ionicons name="code-slash" size={14} color="#EF4444" />
                        <Text style={styles.errorText} numberOfLines={2}>
                            {this.state.error?.message || 'Unknown error'}
                        </Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400)} style={{ width: '100%' }}>
                        <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={this.handleRetry}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#FF6B35', '#FF9800']}
                                style={styles.retryGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="refresh" size={18} color="#fff" />
                                <Text style={styles.retryText}>Reload Screen</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    <Text style={styles.hint}>
                        Error auto-reported to our team 🛡️
                    </Text>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#FAF9F6',
    },
    iconWrap: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(255, 107, 53, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 107, 53, 0.15)',
    },
    title: {
        fontFamily: 'Quicksand_700Bold',
        fontSize: 22,
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 20,
        fontWeight: '500',
        paddingHorizontal: 12,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.12)',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 28,
        width: '100%',
    },
    errorText: {
        flex: 1,
        fontSize: 12,
        color: '#EF4444',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontWeight: '600',
    },
    retryBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        width: '100%',
    },
    retryGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    retryText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
    hint: {
        fontSize: 11,
        color: '#aaa',
        fontWeight: '500',
        marginTop: 16,
    },
});
