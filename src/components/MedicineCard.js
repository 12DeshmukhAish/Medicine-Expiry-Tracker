import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { calculateDaysUntilExpiry } from '../utils/dateUtils';

const MedicineCard = ({ medicine, onPress }) => {
  const daysUntilExpiry = calculateDaysUntilExpiry(medicine.expiryDate);
  
  const getStatusColor = () => {
    if (daysUntilExpiry < 0) return '#ff3b30'; // Expired
    if (daysUntilExpiry < 30) return '#ff9500'; // Expiring soon
    return '#34c759'; // Valid
  };

  const getStatusText = () => {
    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry < 30) return `Expiring soon (${daysUntilExpiry} days)`;
    return `Valid (${daysUntilExpiry} days)`;
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <Title>{medicine.name}</Title>
        <Paragraph>{medicine.company || 'Unknown company'}</Paragraph>
        <Paragraph>Expiry: {medicine.expiryDate}</Paragraph>
        <Paragraph style={{ color: getStatusColor() }}>
          Status: {getStatusText()}
        </Paragraph>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    marginHorizontal: 10,
    marginTop: 10,
  },
});

export default MedicineCard;

// src/utils/database.js
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('medicines.db');

// Initialize database tables
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS medicines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          company TEXT,
          expiryDate TEXT NOT NULL,
          imageUri TEXT,
          createdAt TEXT NOT NULL
        )`,
        [],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

// Add a new medicine
export const addMedicine = (medicine) => {
  return new Promise((resolve, reject) => {
    const { name, company, expiryDate, imageUri } = medicine;
    const createdAt = new Date().toISOString();
    
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO medicines (name, company, expiryDate, imageUri, createdAt) VALUES (?, ?, ?, ?, ?)',
        [name, company, expiryDate, imageUri, createdAt],
        (_, result) => resolve(result.insertId),
        (_, error) => reject(error)
      );
    });
  });
};

// Get all medicines
export const getAllMedicines = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM medicines ORDER BY expiryDate ASC',
        [],
        (_, result) => {
          const items = [];
          for (let i = 0; i < result.rows.length; i++) {
            items.push(result.rows.item(i));
          }
          resolve(items);
        },
        (_, error) => reject(error)
      );
    });
  });
};

// Get a medicine by ID
export const getMedicineById = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM medicines WHERE id = ?',
        [id],
        (_, result) => {
          if (result.rows.length > 0) {
            resolve(result.rows.item(0));
          } else {
            resolve(null);
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};

// Delete a medicine
export const deleteMedicine = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM medicines WHERE id = ?',
        [id],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

// Get medicines that are about to expire
export const getExpiringMedicines = (daysThreshold = 30) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM medicines',
        [],
        (_, result) => {
          const now = new Date();
          const items = [];
          
          for (let i = 0; i < result.rows.length; i++) {
            const medicine = result.rows.item(i);
            const expiryParts = medicine.expiryDate.split('/');
            
            // Handle both MM/YYYY and DD/MM/YYYY formats
            let expiryDate;
            if (expiryParts.length === 2) {
              // MM/YYYY format
              expiryDate = new Date(parseInt(expiryParts[1]), parseInt(expiryParts[0]) - 1, 1);
              // Set to last day of month
              expiryDate.setMonth(expiryDate.getMonth() + 1);
              expiryDate.setDate(0);
            } else if (expiryParts.length === 3) {
              // DD/MM/YYYY format
              expiryDate = new Date(
                parseInt(expiryParts[2]),
                parseInt(expiryParts[1]) - 1,
                parseInt(expiryParts[0])
              );
            } else {
              // Skip invalid dates
              continue;
            }
            
            const diffTime = expiryDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= daysThreshold && diffDays >= 0) {
              items.push({
                ...medicine,
                daysUntilExpiry: diffDays
              });
            }
          }
          
          resolve(items);
        },
        (_, error) => reject(error)
      );
    });
  });
};