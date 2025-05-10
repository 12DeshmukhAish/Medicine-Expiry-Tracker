import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseMonthYearDate } from '../utils/dateUtils';

// Storage key for notification IDs
const NOTIFICATION_IDS_KEY = 'medicine_notification_ids';

// Ensure notifications are only initialized on physical devices
const initializeNotifications = () => {
  // Only run this setup on an actual device to avoid the error
  if (Device.isDevice) {
    // Configure default notification handler for local notifications only
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
};

// Initialize notifications safely
try {
  initializeNotifications();
} catch (error) {
  console.log('Notification initialization failed, likely running in Expo Go:', error);
}

/**
 * Request local notification permissions
 * @returns {Promise<boolean>} - Whether permissions were granted
 */
export const requestNotificationPermissions = async () => {
  try {
    if (!Device.isDevice) {
      console.log('Must use physical device for notifications');
      return false;
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get permission for notifications');
      return false;
    }

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('medicine-expiry', {
          name: 'Medicine Expiry Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      } catch (channelError) {
        console.log('Error setting up notification channel:', channelError);
        // Continue even if channel setup fails
      }
    }

    return true;
  } catch (error) {
    console.log('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Schedule a notification for medicine expiry (local notification only)
 * @param {Object} medicine - Medicine object
 * @returns {Promise<string|null>} - Notification ID or null if scheduling failed
 */
export const scheduleMedicineExpiryNotification = async (medicine) => {
  try {
    // Skip if no expiry date or not on a physical device
    if (!medicine.expiryDate || !Device.isDevice) {
      console.log(!medicine.expiryDate 
        ? 'No expiry date for medicine, skipping notification' 
        : 'Not on a physical device, skipping notification');
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
    
    // Request permissions first
    const permissionGranted = await requestNotificationPermissions();
    if (!permissionGranted) {
      return null;
    }
    
    try {
      // Schedule the LOCAL notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medicine Expiring Soon',
          body: `${medicine.name} is expiring next month (${medicine.expiryDate})`,
          data: { medicineId: medicine.id },
        },
        trigger: {
          date: notificationDate,
        },
      });
      
      // Store the notification ID with the medicine ID
      await saveNotificationId(medicine.id, notificationId);
      
      return notificationId;
    } catch (scheduleError) {
      console.error('Error scheduling notification:', scheduleError);
      return null;
    }
  } catch (error) {
    console.error('Error in scheduleMedicineExpiryNotification:', error);
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
    // Skip if not on a physical device
    if (!Device.isDevice) {
      return;
    }
    
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
    // Skip if not on a physical device
    if (!Device.isDevice) {
      console.log('Skipping notification updates on non-physical device');
      return;
    }
    
    // Cancel all existing notifications
    const notificationIds = await getNotificationIds();
    
    for (const notificationId of Object.values(notificationIds)) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      } catch (cancelError) {
        console.log(`Error canceling notification ${notificationId}:`, cancelError);
      }
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

// Export all necessary functions
export default {
  requestNotificationPermissions,
  scheduleMedicineExpiryNotification,
  cancelMedicineNotification,
  updateAllNotifications,
};