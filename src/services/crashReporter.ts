/**
 * Crash Reporter Service
 *
 * Captures unhandled JS errors, promise rejections, and component crashes.
 * Stores crash logs locally (AsyncStorage) and optionally sends them to
 * Supabase `crash_reports` table for backend triage.
 *
 * All errors are gated behind __DEV__ for console output; production
 * silently persists and uploads.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CrashReport {
    id: string;
    timestamp: string;
    error: string;
    stack: string;
    componentStack?: string;
    isFatal: boolean;
    source: 'error_boundary' | 'global_handler' | 'promise_rejection' | 'manual';
    screen?: string;
    platform: string;
    appVersion: string;
    userId?: string | null;
    deviceInfo?: Record<string, any>;
    uploaded: boolean;
}

const CRASH_LOG_KEY = '@Rumbala_crash_logs';
const MAX_LOCAL_LOGS = 20;

// ── Local Storage ──────────────────────────────────────────────────────────

export const getCrashLogs = async (): Promise<CrashReport[]> => {
    try {
        const raw = await AsyncStorage.getItem(CRASH_LOG_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const saveCrashLog = async (report: CrashReport): Promise<void> => {
    try {
        const logs = await getCrashLogs();
        const updated = [report, ...logs].slice(0, MAX_LOCAL_LOGS);
        await AsyncStorage.setItem(CRASH_LOG_KEY, JSON.stringify(updated));
    } catch (e) {
        if (__DEV__) console.error('Failed to save crash log:', e);
    }
};

export const clearCrashLogs = async (): Promise<void> => {
    await AsyncStorage.removeItem(CRASH_LOG_KEY);
};

export const markCrashUploaded = async (id: string): Promise<void> => {
    try {
        const logs = await getCrashLogs();
        const updated = logs.map(log =>
            log.id === id ? { ...log, uploaded: true } : log,
        );
        await AsyncStorage.setItem(CRASH_LOG_KEY, JSON.stringify(updated));
    } catch {}
};

// ── Remote Upload ──────────────────────────────────────────────────────────

export const uploadCrashReport = async (report: CrashReport): Promise<boolean> => {
    try {
        const { supabase } = await import('./supabase');
        const { error } = await supabase.from('crash_reports').insert({
            user_id: report.userId || null,
            error_message: report.error,
            stack_trace: report.stack,
            component_stack: report.componentStack || null,
            is_fatal: report.isFatal,
            source: report.source,
            screen: report.screen || null,
            platform: report.platform,
            app_version: report.appVersion,
            device_info: report.deviceInfo || {},
            created_at: report.timestamp,
        });
        if (error) {
            if (__DEV__) console.warn('Crash upload failed:', error.message);
            return false;
        }
        await markCrashUploaded(report.id);
        return true;
    } catch (e) {
        if (__DEV__) console.warn('Crash upload exception:', e);
        return false;
    }
};

/**
 * Retry uploading any locally stored crash reports that weren't uploaded yet.
 * Call this on app init (after network is likely available).
 */
export const flushPendingCrashReports = async (): Promise<void> => {
    try {
        const logs = await getCrashLogs();
        const pending = logs.filter(l => !l.uploaded);
        for (const log of pending) {
            await uploadCrashReport(log);
        }
    } catch {}
};

// ── Report Builder ─────────────────────────────────────────────────────────

export const buildCrashReport = (
    error: Error | string,
    source: CrashReport['source'],
    options?: {
        isFatal?: boolean;
        componentStack?: string;
        screen?: string;
    },
): CrashReport => {
    const err = typeof error === 'string' ? error : error.message || String(error);
    const stack = typeof error === 'string' ? '' : (error.stack || '');

    // Dynamically try to grab userId from store without circular deps
    let userId: string | null = null;
    try {
        const { useStore } = require('../store/useStore');
        userId = useStore.getState().userId;
    } catch {}

    return {
        id: `crash_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        error: err,
        stack,
        componentStack: options?.componentStack,
        isFatal: options?.isFatal ?? false,
        source,
        screen: options?.screen,
        platform: Platform.OS,
        appVersion: '1.0.3',
        userId,
        deviceInfo: {
            os: Platform.OS,
            version: Platform.Version,
        },
        uploaded: false,
    };
};

// ── Global Error Handlers ──────────────────────────────────────────────────

let _isInitialized = false;

/**
 * Install global error handlers (call once in _layout.tsx).
 * Catches:
 *   1. Unhandled JS exceptions (ErrorUtils)
 *   2. Unhandled Promise rejections
 */
export const initGlobalErrorHandlers = (): void => {
    if (_isInitialized) return;
    _isInitialized = true;

    // 1. Global JS error handler (React Native)
    const defaultHandler = (ErrorUtils as any).getGlobalHandler();

    (ErrorUtils as any).setGlobalHandler(async (error: Error, isFatal?: boolean) => {
        try {
            const report = buildCrashReport(error, 'global_handler', {
                isFatal: isFatal ?? false,
            });
            await saveCrashLog(report);
            // Best-effort upload
            uploadCrashReport(report).catch(() => {});
        } catch {}

        // Always call the default handler so the red box still shows in dev
        if (defaultHandler) {
            defaultHandler(error, isFatal);
        }
    });

    // 2. Unhandled Promise rejection
    const originalWarn = console.warn;
    if (typeof (global as any).addEventListener === 'function') {
        (global as any).addEventListener('unhandledrejection', (event: any) => {
            const error = event?.reason || 'Unknown promise rejection';
            const report = buildCrashReport(
                typeof error === 'string' ? new Error(error) : error,
                'promise_rejection',
            );
            saveCrashLog(report).catch(() => {});
            uploadCrashReport(report).catch(() => {});
        });
    }

    if (__DEV__) console.log('🛡️ Global error handlers installed');
};
