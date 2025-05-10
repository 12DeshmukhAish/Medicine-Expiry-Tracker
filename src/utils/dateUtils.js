/**
 * Formats a date object to MM/YYYY format
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string in MM/YYYY format
 */
export const formatDateToMonthYear = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${year}`;
};

/**
 * Parses a date string in MM/YYYY format to a Date object
 * @param {string} dateString - Date string in MM/YYYY format
 * @returns {Date} - Date object representing the first day of that month/year
 */
export const parseMonthYearDate = (dateString) => {
  if (!dateString) return null;
  
  const [month, year] = dateString.split('/');
  
  if (!month || !year) return null;
  
  // Create date for the first day of the month
  return new Date(parseInt(year), parseInt(month) - 1, 1);
};

/**
 * Checks if a medicine is expired
 * @param {string} expiryDateString - Expiry date in MM/YYYY format
 * @returns {boolean} - True if medicine is expired, false otherwise
 */
export const isExpired = (expiryDateString) => {
  const expiryDate = parseMonthYearDate(expiryDateString);
  if (!expiryDate) return false;
  
  const today = new Date();
  
  // Set today's date to the first of the month for accurate month comparison
  const todayFirstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  return expiryDate <= todayFirstOfMonth;
};

/**
 * Checks if a medicine is expiring soon
 * @param {string} expiryDateString - Expiry date in MM/YYYY format
 * @param {number} daysThreshold - Threshold for "expiring soon" in days
 * @returns {boolean} - True if medicine is expiring soon, false otherwise
 */
export const isExpiringSoon = (expiryDateString, daysThreshold = 60) => {
  const expiryDate = parseMonthYearDate(expiryDateString);
  if (!expiryDate) return false;
  
  const today = new Date();
  
  // If already expired, it's not "expiring soon"
  if (isExpired(expiryDateString)) return false;
  
  // Calculate the future date threshold
  const thresholdDate = new Date();
  thresholdDate.setDate(today.getDate() + daysThreshold);
  
  return expiryDate <= thresholdDate;
};

/**
 * Calculates days remaining until expiry
 * @param {string} expiryDateString - Expiry date in MM/YYYY format
 * @returns {number} - Days remaining until expiry (negative if expired)
 */
export const daysUntilExpiry = (expiryDateString) => {
  const expiryDate = parseMonthYearDate(expiryDateString);
  if (!expiryDate) return null;
  
  const today = new Date();
  
  // Calculate difference in days
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Returns a human-readable expiry status
 * @param {string} expiryDateString - Expiry date in MM/YYYY format
 * @returns {Object} - Object with status and description
 */
export const getExpiryStatus = (expiryDateString) => {
  if (!expiryDateString) {
    return {
      status: 'unknown',
      description: 'No expiry date',
    };
  }
  
  if (isExpired(expiryDateString)) {
    return {
      status: 'expired',
      description: 'Expired',
    };
  }
  
  const days = daysUntilExpiry(expiryDateString);
  
  if (days <= 30) {
    return {
      status: 'critical',
      description: `Expires in ${days} days`,
    };
  }
  
  if (days <= 90) {
    return {
      status: 'warning',
      description: `Expires in ${Math.floor(days / 30)} months`,
    };
  }
  
  return {
    status: 'good',
    description: `Expires in ${Math.floor(days / 30)} months`,
  };
};