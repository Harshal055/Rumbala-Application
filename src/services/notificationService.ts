import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useStore } from '../store/useStore';

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
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  const enabled = finalStatus === 'granted';
  useStore.getState().setNotificationsEnabled(enabled);
  return enabled;
};

export const scheduleDailyQuestionReminder = async () => {
  try {
    // Clear any existing scheduled notifications to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    const enabled = useStore.getState().notificationsEnabled;
    if (!enabled) return;

    // Schedule a daily notification at 10:00 AM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Couple Question 💏",
        body: "It's time for today's question! Open Rumbala to share your thoughts.",
        data: { screen: 'daily' },
        sound: true,
      },
      trigger: {
        hour: 10,
        minute: 0,
        repeats: true,
      } as any,
    });
  } catch (e) {
    console.warn('[NotificationService] Failed to schedule:', e);
  }
};

export const initNotifications = async () => {
  if (Platform.OS === 'web') return;
  
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') {
    useStore.getState().setNotificationsEnabled(true);
    await scheduleDailyQuestionReminder();
  }
};
