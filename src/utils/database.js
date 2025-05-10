import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing medicine list
const MEDICINES_STORAGE_KEY = 'medicines_list';

/**
 * Save a medicine to local storage
 * @param {Object} medicine - Medicine object to save
 * @returns {Promise<string>} - ID of the saved medicine
 */
export const saveMedicine = async (medicine) => {
  try {
    // Generate a unique ID if one doesn't exist
    if (!medicine.id) {
      medicine.id = Date.now().toString();
    }
    
    // Add timestamp for when this medicine was added
    medicine.addedAt = Date.now();
    
    // Get existing medicines
    const medicines = await getMedicines();
    
    // Add new medicine to the list
    medicines.push(medicine);
    
    // Save updated list
    await AsyncStorage.setItem(MEDICINES_STORAGE_KEY, JSON.stringify(medicines));
    
    return medicine.id;
  } catch (error) {
    console.error('Error saving medicine:', error);
    throw error;
  }
};

/**
 * Get all medicines from local storage
 * @returns {Promise<Array>} - Array of medicine objects
 */
export const getMedicines = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(MEDICINES_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error getting medicines:', error);
    return [];
  }
};

/**
 * Get a specific medicine by ID
 * @param {string} id - Medicine ID
 * @returns {Promise<Object|null>} - Medicine object or null if not found
 */
export const getMedicineById = async (id) => {
  try {
    const medicines = await getMedicines();
    return medicines.find(med => med.id === id) || null;
  } catch (error) {
    console.error('Error getting medicine by ID:', error);
    return null;
  }
};

/**
 * Update an existing medicine
 * @param {Object} medicine - Updated medicine object
 * @returns {Promise<boolean>} - Success status
 */
export const updateMedicine = async (medicine) => {
  try {
    const medicines = await getMedicines();
    const index = medicines.findIndex(med => med.id === medicine.id);
    
    if (index !== -1) {
      medicines[index] = { ...medicines[index], ...medicine };
      await AsyncStorage.setItem(MEDICINES_STORAGE_KEY, JSON.stringify(medicines));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating medicine:', error);
    throw error;
  }
};

/**
 * Delete a medicine by ID
 * @param {string} id - Medicine ID to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteMedicine = async (id) => {
  try {
    const medicines = await getMedicines();
    const filteredMedicines = medicines.filter(med => med.id !== id);
    
    if (filteredMedicines.length !== medicines.length) {
      await AsyncStorage.setItem(MEDICINES_STORAGE_KEY, JSON.stringify(filteredMedicines));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting medicine:', error);
    throw error;
  }
};

/**
 * Get all medicines that are expiring soon
 * @param {number} daysThreshold - Number of days to consider as "expiring soon"
 * @returns {Promise<Array>} - Array of expiring medicines
 */
export const getExpiringSoonMedicines = async (daysThreshold = 60) => {
  try {
    const medicines = await getMedicines();
    const now = new Date();
    
    return medicines.filter(medicine => {
      if (!medicine.expiryDate) return false;
      
      // Parse expiry date (MM/YYYY format)
      const [month, year] = medicine.expiryDate.split('/');
      const expiryDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      
      // Add days threshold to current date for comparison
      const thresholdDate = new Date(now);
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
      
      return expiryDate <= thresholdDate && expiryDate >= now;
    });
  } catch (error) {
    console.error('Error getting expiring medicines:', error);
    return [];
  }
};

/**
 * Clear all medicines data
 * @returns {Promise<void>}
 */
export const clearAllMedicines = async () => {
  try {
    await AsyncStorage.removeItem(MEDICINES_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing medicines:', error);
    throw error;
  }
};