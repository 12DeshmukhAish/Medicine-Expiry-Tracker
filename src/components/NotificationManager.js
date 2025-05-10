import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseMonthYearDate } from '../utils/dateUtils';

// Storage key for notification IDs
const NOTIFICATION_IDS_KEY = 'medicine_notification_ids';

// Configure default notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications
 * @returns {Promise<string|null>} - Notification token or null if not available
 */
export const registerForPushNotificationsAsync = async () => {
  let token;
  
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for notification!');
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('medicine-expiry', {
      name: 'Medicine Expiry Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
};

/**
 * Schedule a notification for medicine expiry
 * @param {Object} medicine - Medicine object
 * @returns {Promise<string>} - Notification ID
 */
export const scheduleMedicineExpiryNotification = async (medicine) => {
  try {
    if (!medicine.expiryDate) {
      console.log('No expiry date for medicine, skipping notification');
      return null;
    }
    
    // Parse expiry date
    const expiryDate = parseMonthYearDate(medicine.expiryDate);
    if (!expiryDate) {
      console.log('Invalid expiry date format');
      return null;
    }
    
    // Schedule notification for 30 days before expiry
    const notificationDate = new Date(expiryDate);
    notificationDate.setDate(notificationDate.getDate() - 30);
    
    // If the notification date is in the past, don't schedule
    if (notificationDate < new Date()) {
      console.log('Notification date is in the past, skipping');
      return null;
    }
    
    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Medicine Expiring Soon',
        body: `${medicine.name} is expiring next month (${medicine.expiryDate})`,
        data: { medicineId: medicine.id },
      },
      trigger: notificationDate,
    });
    
    // Store the notification ID with the medicine ID
    await saveNotificationId(medicine.id, notificationId);
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Cancel a scheduled notification for a medicine
 * @param {string} medicineId - Medicine ID
 * @returns {Promise<void>}
 */
export const cancelMedicineNotification = async (medicineId) => {
  try {
    const notificationIds = await getNotificationIds();
    
    if (notificationIds[medicineId]) {
      await Notifications.cancelScheduledNotificationAsync(notificationIds[medicineId]);
      
      // Remove from storage
      delete notificationIds[medicineId];
      await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(notificationIds));
    }
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

/**
 * Get notification IDs from storage
 * @returns {Promise<Object>} - Object mapping medicine IDs to notification IDs
 */
const getNotificationIds = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : {};
  } catch (error) {
    console.error('Error getting notification IDs:', error);
    return {};
  }
};

/**
 * Save notification ID for a medicine
 * @param {string} medicineId - Medicine ID
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
const saveNotificationId = async (medicineId, notificationId) => {
  try {
    const notificationIds = await getNotificationIds();
    notificationIds[medicineId] = notificationId;
    await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(notificationIds));
  } catch (error) {
    console.error('Error saving notification ID:', error);
  }
};

/**
 * Check and reschedule all notifications for medicines
 * @param {Array} medicines - Array of medicine objects
 * @returns {Promise<void>}
 */
export const updateAllNotifications = async (medicines) => {
  try {
    // Cancel all existing notifications
    const notificationIds = await getNotificationIds();
    
    for (const notificationId of Object.values(notificationIds)) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
    
    // Clear notification IDs storage
    await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify({}));
    
    // Reschedule notifications for all medicines
    for (const medicine of medicines) {
      await scheduleMedicineExpiryNotification(medicine);
    }
  } catch (error) {
    console.error('Error updating notifications:', error);
  }
};

export default {
  registerForPushNotificationsAsync,
  scheduleMedicineExpiryNotification,
  cancelMedicineNotification,
  updateAllNotifications,
};