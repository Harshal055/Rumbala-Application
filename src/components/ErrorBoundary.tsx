/**
 * ErrorBoundary — React Error Boundary with crash reporting.
 *
 * Wraps the entire app tree and catches render-time crashes.
 * Shows a premium, branded recovery screen with:
 *   • Error details (collapsible)
 *   • "Send Report" button → uploads to Supabase
 *   • "Try Again" button → re-mounts the component tree
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    StatusBar,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import {
    buildCrashReport,
    saveCrashLog,
    uploadCrashReport,
    CrashReport,
} from '../services/crashReporter';

const { width } = Dimensions.get('window');

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    crashReport: CrashReport | null;
    showDetails: boolean;
    reportSent: boolean;
    sendingReport: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            crashReport: null,
            showDetails: false,
            reportSent: false,
            sendingReport: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const report = buildCrashReport(error, 'error_boundary', {
            isFatal: true,
            componentStack: errorInfo.componentStack || undefined,
        });

        this.setState({ errorInfo, crashReport: report });

        // Persist locally
        await saveCrashLog(report);

        // Best-effort upload
        uploadCrashReport(report).catch(() => {});
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            crashReport: null,
            showDetails: false,
            reportSent: false,
            sendingReport: false,
        });
    };

    handleSendReport = async () => {
        if (!this.state.crashReport || this.state.sendingReport) return;
        this.setState({ sendingReport: true });
        const success = await uploadCrashReport(this.state.crashReport);
        this.setState({ sendingReport: false, reportSent: success });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <StatusBar barStyle="light-content" backgroundColor="#1C000B" />
                    <LinearGradient
                        colors={['#1C000B', '#2A0014', '#3E001A']}
                        style={styles.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Icon */}
                            <Animated.View
                                entering={ZoomIn.delay(100).springify()}
                                style={styles.iconWrap}
                            >
                                <LinearGradient
                                    colors={['rgba(239, 68, 68, 0.25)', 'rgba(239, 68, 68, 0.05)']}
                                    style={styles.iconGradient}
                                >
                                    <Ionicons name="warning" size={56} color="#EF4444" />
                                </LinearGradient>
                            </Animated.View>

                            {/* Title */}
                            <Animated.Text
                                entering={FadeInDown.delay(200).duration(500)}
                                style={styles.title}
                            >
                                Oops, Something Broke
                            </Animated.Text>

                            <Animated.Text
                                entering={FadeInDown.delay(300).duration(500)}
                                style={styles.subtitle}
                            >
                                Don't worry — your data is safe.{'\n'}
                                An unexpected error crashed this screen.
                            </Animated.Text>

                            {/* Error Summary Card */}
                            <Animated.View
                                entering={FadeInDown.delay(400).duration(500)}
                                style={styles.errorCard}
                            >
                                <View style={styles.errorCardHeader}>
                                    <Ionicons name="bug" size={18} color="#EF4444" />
                                    <Text style={styles.errorCardTitle}>Error Details</Text>
                                </View>
                                <Text style={styles.errorMessage} numberOfLines={3}>
                                    {this.state.error?.message || 'Unknown error'}
                                </Text>

                                {/* Toggle Details */}
                                <TouchableOpacity
                                    style={styles.detailsToggle}
                                    onPress={() =>
                                        this.setState(s => ({
                                            showDetails: !s.showDetails,
                                        }))
                                    }
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.detailsToggleText}>
                                        {this.state.showDetails
                                            ? 'Hide Stack Trace'
                                            : 'Show Stack Trace'}
                                    </Text>
                                    <Ionicons
                                        name={
                                            this.state.showDetails
                                                ? 'chevron-up'
                                                : 'chevron-down'
                                        }
                                        size={14}
                                        color="#888"
                                    />
                                </TouchableOpacity>

                                {this.state.showDetails && (
                                    <ScrollView
                                        style={styles.stackScroll}
                                        nestedScrollEnabled
                                    >
                                        <Text style={styles.stackText}>
                                            {this.state.error?.stack || 'No stack trace available'}
                                        </Text>
                                        {this.state.errorInfo?.componentStack && (
                                            <>
                                                <Text style={styles.stackLabel}>
                                                    Component Stack:
                                                </Text>
                                                <Text style={styles.stackText}>
                                                    {this.state.errorInfo.componentStack}
                                                </Text>
                                            </>
                                        )}
                                    </ScrollView>
                                )}
                            </Animated.View>

                            {/* Report ID */}
                            {this.state.crashReport && (
                                <Animated.View
                                    entering={FadeInDown.delay(500).duration(400)}
                                    style={styles.reportIdWrap}
                                >
                                    <Ionicons name="finger-print" size={14} color="#666" />
                                    <Text style={styles.reportIdText}>
                                        Report ID: {this.state.crashReport.id.slice(6, 22)}
                                    </Text>
                                </Animated.View>
                            )}

                            {/* Actions */}
                            <Animated.View
                                entering={FadeInUp.delay(600).duration(500)}
                                style={styles.actionsWrap}
                            >
                                {/* Send Report */}
                                <TouchableOpacity
                                    style={[
                                        styles.reportBtn,
                                        this.state.reportSent && styles.reportBtnSent,
                                    ]}
                                    onPress={this.handleSendReport}
                                    activeOpacity={0.8}
                                    disabled={
                                        this.state.reportSent || this.state.sendingReport
                                    }
                                >
                                    {this.state.sendingReport ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons
                                                name={
                                                    this.state.reportSent
                                                        ? 'checkmark-circle'
                                                        : 'cloud-upload'
                                                }
                                                size={20}
                                                color="#fff"
                                            />
                                            <Text style={styles.reportBtnText}>
                                                {this.state.reportSent
                                                    ? 'Report Sent!'
                                                    : 'Send Crash Report'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {/* Retry */}
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
                                        <Ionicons
                                            name="refresh"
                                            size={20}
                                            color="#fff"
                                        />
                                        <Text style={styles.retryBtnText}>
                                            Try Again
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>

                            {/* Footer hint */}
                            <Animated.Text
                                entering={FadeInDown.delay(700).duration(400)}
                                style={styles.footer}
                            >
                                If this keeps happening, try closing and reopening the app.
                            </Animated.Text>
                        </ScrollView>
                    </LinearGradient>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C000B',
    },
    gradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 28,
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 60,
    },

    // Icon
    iconWrap: {
        marginBottom: 28,
    },
    iconGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.15)',
    },

    // Text
    title: {
        fontFamily: 'Pacifico_400Regular',
        fontSize: 28,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
        paddingRight: 10,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
        fontWeight: '500',
        paddingHorizontal: 10,
    },

    // Error Card
    errorCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 16,
    },
    errorCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    errorCardTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#EF4444',
    },
    errorMessage: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        lineHeight: 20,
        marginBottom: 12,
    },
    detailsToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    detailsToggleText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '600',
    },

    // Stack trace
    stackScroll: {
        maxHeight: 200,
        marginTop: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 12,
    },
    stackLabel: {
        fontSize: 11,
        color: '#FF9800',
        fontWeight: '700',
        marginTop: 12,
        marginBottom: 4,
    },
    stackText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        lineHeight: 16,
    },

    // Report ID
    reportIdWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 28,
    },
    reportIdText: {
        fontSize: 11,
        color: '#666',
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },

    // Actions
    actionsWrap: {
        width: '100%',
        gap: 12,
        marginBottom: 24,
    },
    reportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderWidth: 1.5,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 18,
        paddingVertical: 16,
    },
    reportBtnSent: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    reportBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
    retryBtn: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    retryGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    retryBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },

    // Footer
    footer: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
        textAlign: 'center',
        fontWeight: '500',
    },
});
