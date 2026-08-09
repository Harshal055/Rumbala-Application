import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useStore } from '../store/useStore';
import { supabase } from './supabase';

// Configure how notifications are handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  const enabled = finalStatus === 'granted';
  useStore.getState().setNotificationsEnabled(enabled);
  if (enabled) {
    await scheduleAllReminders();
    registerPushTokenAsync().catch(() => {});
  }
  return enabled;
};

export const scheduleAllReminders = async () => {
  if (Platform.OS === 'web') return;

  try {
    // Clear any existing scheduled notifications to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    const enabled = useStore.getState().notificationsEnabled;
    if (!enabled) return;

    // 1. Morning Question (10:00 AM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Couple Question 💏",
        body: "It's time for today's couple question! Open Rumbala to share your thoughts.",
        data: { screen: 'daily' },
        sound: true,
      },
      trigger: {
        hour: 10,
        minute: 0,
        repeats: true,
      } as any,
    });

    // 2. Evening Streak Guardian (8:30 PM)
    const streak = useStore.getState().streak || 0;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔥 Don't Break Your Love Streak!",
        body: streak > 0
          ? `Keep your ${streak}-day streak alive! Connect with your partner before midnight.`
          : "Answer today's question together to ignite your new love streak! ✨",
        data: { screen: 'daily' },
        sound: true,
      },
      trigger: {
        hour: 20,
        minute: 30,
        repeats: true,
      } as any,
    });

    // 3. Night Intimacy & Dare Prompt (9:45 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌙 Ready for Tonight's Dare?",
        body: "Put the phones away, dim the lights, and draw your intimate couple dare. 🔥",
        data: { screen: 'home' },
        sound: true,
      },
      trigger: {
        hour: 21,
        minute: 45,
        repeats: true,
      } as any,
    });

  } catch (e) {
    console.warn('[NotificationService] Failed to schedule reminders:', e);
  }
};

/**
 * Registers this device for Expo push notifications and stores the token on the
 * user's profile so their partner can "nudge" them. Safe to call repeatedly —
 * it only writes when the token has changed.
 */
export const registerPushTokenAsync = async (userId?: string | null): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') return null;
    const uid = userId || useStore.getState().userId;
    if (!uid) return null;

    // Ensure we have permission before requesting a token.
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;

    // Android needs a notification channel for the token to deliver reliably.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Rumbala',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
      });
    }

    const projectId =
      (Constants.expoConfig as any)?.extra?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse.data;
    if (!token) return null;

    // Only write if the token changed to avoid needless updates.
    const { data: existing } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', uid)
      .maybeSingle();

    if (existing?.push_token !== token) {
      await supabase.from('profiles').update({ push_token: token }).eq('id', uid);
    }
    return token;
  } catch (e) {
    console.warn('[NotificationService] Failed to register push token:', e);
    return null;
  }
};

/**
 * Send an instant romantic "Thinking of You" love nudge to partner
 */
export const sendPartnerLoveNudge = async (partnerName?: string): Promise<boolean> => {
  const { partner1, roomId } = useStore.getState();
  const senderName = partner1 || 'Your partner';

  try {
    // 1. Broadcast over Supabase realtime channel if in active room
    if (roomId) {
      const channel = supabase.channel(`room-${roomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'partner_nudge',
        payload: { sender: senderName, message: `💖 ${senderName} is thinking of you right now!` }
      });
    }

    // 2. Schedule immediate local feedback notification
    if (Platform.OS !== 'web') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Sent to ${partnerName || 'Partner'}! 💖`,
          body: `We sent your sweet nudge to ${partnerName || 'them'}.`,
          sound: true,
        },
        trigger: null, // immediate
      });
    }
    return true;
  } catch (e) {
    console.warn('[NotificationService] Love nudge failed:', e);
    return false;
  }
};

export const initNotifications = async () => {
  if (Platform.OS === 'web') return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') {
    useStore.getState().setNotificationsEnabled(true);
    await scheduleAllReminders();
    // Refresh the stored push token for the logged-in user.
    registerPushTokenAsync().catch(() => {});
  }
};
