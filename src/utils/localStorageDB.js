// src/utils/localStorageDB.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isExpired, isExpiringSoon, daysUntilExpiry } from './dateUtils';

const STORAGE_KEY = 'medicines_data';

// Initialize database
export const initDatabase = async () => {
  try {
    const existingData = await AsyncStorage.getItem(STORAGE_KEY);
    if (!existingData) {
      // Initialize with empty array if no data exists
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
    return true;
  } catch (error) {
    console.error('Error initializing local storage database:', error);
    return false;
  }
};

// Add a new medicine
export const addMedicine = async (medicine) => {
  try {
    const medicines = await getAllMedicines();
    const newMedicine = {
      ...medicine,
      id: Date.now().toString(), // Generate a unique ID
      createdAt: new Date().toISOString()
    };
    
    medicines.push(newMedicine);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(medicines));
    return newMedicine.id;
  } catch (error) {
    console.error('Error adding medicine:', error);
    throw error;
  }
};

// Get all medicines
export const getAllMedicines = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting all medicines:', error);
    return [];
  }
};

// Get medicine by ID
export const getMedicineById = async (id) => {
  try {
    const medicines = await getAllMedicines();
    return medicines.find(medicine => medicine.id === id) || null;
  } catch (error) {
    console.error('Error getting medicine by ID:', error);
    return null;
  }
};

// Update a medicine
export const updateMedicine = async (id, updatedData) => {
  try {
    const medicines = await getAllMedicines();
    const index = medicines.findIndex(medicine => medicine.id === id);
    
    if (index !== -1) {
      medicines[index] = { ...medicines[index], ...updatedData };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(medicines));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating medicine:', error);
    throw error;
  }
};

// Delete a medicine
export const deleteMedicine = async (id) => {
  try {
    const medicines = await getAllMedicines();
    const filteredMedicines = medicines.filter(medicine => medicine.id !== id);
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredMedicines));
    return true;
  } catch (error) {
    console.error('Error deleting medicine:', error);
    throw error;
  }
};

// Get medicines that are about to expire
export const getExpiringMedicines = async (daysThreshold = 30) => {
  try {
    const medicines = await getAllMedicines();
    
    return medicines.filter(medicine => {
      // Skip already expired medicines
      if (isExpired(medicine.expiryDate)) return false;
      
      // Check if expiring within threshold
      return isExpiringSoon(medicine.expiryDate, daysThreshold);
    }).map(medicine => ({
      ...medicine,
      daysUntilExpiry: daysUntilExpiry(medicine.expiryDate)
    }));
  } catch (error) {
    console.error('Error getting expiring medicines:', error);
    return [];
  }
};

// Get expired medicines
export const getExpiredMedicines = async () => {
  try {
    const medicines = await getAllMedicines();
    
    return medicines.filter(medicine => isExpired(medicine.expiryDate))
      .map(medicine => ({
        ...medicine,
        daysUntilExpiry: daysUntilExpiry(medicine.expiryDate)
      }));
  } catch (error) {
    console.error('Error getting expired medicines:', error);
    return [];
  }
};