import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

type NetworkListener = (isOnline: boolean) => void;

class NetworkMonitor {
    private static instance: NetworkMonitor;
    private isOnline: boolean = true;
    private wasOffline: boolean = false;
    private listeners: Set<NetworkListener> = new Set();
    private intervalId: any = null;
    private isChecking: boolean = false;

    private constructor() {
        this.init();
    }

    public static getInstance(): NetworkMonitor {
        if (!NetworkMonitor.instance) {
            NetworkMonitor.instance = new NetworkMonitor();
        }
        return NetworkMonitor.instance;
    }

    private init() {
        // Initial check
        this.checkConnectivity();

        // Listen to app foreground/background transitions
        AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                this.checkConnectivity();
                this.startPolling();
            } else {
                this.stopPolling();
            }
        });

        this.startPolling();
    }

    private startPolling() {
        this.stopPolling();
        // Check every 20 seconds while app is in foreground
        this.intervalId = setInterval(() => {
            this.checkConnectivity();
        }, 20000);
    }

    private stopPolling() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    public async checkConnectivity(): Promise<boolean> {
        if (this.isChecking) return this.isOnline;
        this.isChecking = true;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            // Fast captive portal 204 endpoint (standard, lightweight, no body)
            const response = await fetch('https://clients3.google.com/generate_204', {
                method: 'HEAD',
                cache: 'no-cache',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const online = response.status === 204 || response.ok;
            this.setOnline(online);
            return online;
        } catch {
            // If the fast probe fails, try one fallback probe to prevent false positives
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3500);
                const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
                    method: 'HEAD',
                    cache: 'no-cache',
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                const online = res.ok;
                this.setOnline(online);
                return online;
            } catch {
                this.setOnline(false);
                return false;
            }
        } finally {
            this.isChecking = false;
        }
    }

    public reportNetworkError() {
        // If an API request fails with a network exception, trigger check immediately
        this.checkConnectivity();
    }

    private setOnline(online: boolean) {
        if (this.isOnline !== online) {
            if (!online) {
                this.wasOffline = true;
            }
            this.isOnline = online;
            this.notifyListeners();
        }
    }

    public subscribe(listener: NetworkListener): () => void {
        this.listeners.add(listener);
        listener(this.isOnline);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.isOnline));
    }

    public getStatus(): { isOnline: boolean; wasOffline: boolean } {
        return { isOnline: this.isOnline, wasOffline: this.wasOffline };
    }

    public clearWasOffline() {
        this.wasOffline = false;
    }
}

export const networkMonitor = NetworkMonitor.getInstance();

export function useNetworkStatus(): { isOnline: boolean; wasOffline: boolean; clearWasOffline: () => void } {
    const [isOnline, setIsOnline] = useState(networkMonitor.getStatus().isOnline);
    const [wasOffline, setWasOffline] = useState(networkMonitor.getStatus().wasOffline);

    useEffect(() => {
        const unsubscribe = networkMonitor.subscribe((online) => {
            setIsOnline(online);
            setWasOffline(networkMonitor.getStatus().wasOffline);
        });
        return unsubscribe;
    }, []);

    return {
        isOnline,
        wasOffline,
        clearWasOffline: () => {
            networkMonitor.clearWasOffline();
            setWasOffline(false);
        },
    };
}
