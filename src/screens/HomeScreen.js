import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import MedicineCard from '../components/MedicineCard';
import { getMedicines, deleteMedicine } from '../utils/database';
import { cancelMedicineNotification } from '../components/NotificationManager';

const HomeScreen = ({ navigation }) => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [expired, setExpired] = useState([]);

  // Load medicines when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadMedicines();
    }, [])
  );

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const medicinesList = await getMedicines();
      setMedicines(medicinesList);
      
      // Process medicine data
      categorizeByExpiry(medicinesList);
    } catch (error) {
      console.error('Error loading medicines:', error);
      Alert.alert('Error', 'Failed to load medicines. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categorizeByExpiry = (medicinesList) => {
    const now = new Date();
    const soon = [];
    const exp = [];
    
    medicinesList.forEach(medicine => {
      if (!medicine.expiryDate) return;
      
      // Parse expiry date (MM/YYYY format)
      const [month, year] = medicine.expiryDate.split('/');
      const expiryDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      
      // Add 3 months to current date for "soon" comparison
      const soonDate = new Date(now);
      soonDate.setMonth(soonDate.getMonth() + 3);
      
      if (expiryDate <= now) {
        exp.push(medicine);
      } else if (expiryDate <= soonDate) {
        soon.push(medicine);
      }
    });
    
    setExpiringSoon(soon);
    setExpired(exp);
  };

  const handleDeleteMedicine = async (id) => {
    Alert.alert(
      'Delete Medicine',
      'Are you sure you want to delete this medicine?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedicine(id);
              
              // Cancel any scheduled notifications for this medicine
              await cancelMedicineNotification(id);
              
              // Reload medicines
              loadMedicines();
            } catch (error) {
              console.error('Error deleting medicine:', error);
              Alert.alert('Error', 'Failed to delete medicine. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleMedicinePress = (medicine) => {
    navigation.navigate('MedicineDetails', { medicineId: medicine.id });
  };

  // Render each medicine item
  const renderMedicineItem = ({ item }) => (
    <MedicineCard
      medicine={item}
      onPress={handleMedicinePress}
      onDelete={handleDeleteMedicine}
    />
  );
  
  // Render list header with section title
  const renderSectionHeader = (title, count) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  );
  
  // Render empty state
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="medical-services" size={80} color="#CCCCCC" />
      <Text style={styles.emptyText}>No medicines added yet</Text>
      <Text style={styles.emptySubText}>
        Add your first medicine by tapping the + button
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medicine Tracker</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id}
          renderItem={renderMedicineItem}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={() => (
            <>
              {expired.length > 0 && (
                <>
                  {renderSectionHeader('Expired Medicines', expired.length)}
                  {expired.map(medicine => (
                    <MedicineCard
                      key={medicine.id}
                      medicine={medicine}
                      onPress={handleMedicinePress}
                      onDelete={handleDeleteMedicine}
                    />
                  ))}
                </>
              )}
              {expiringSoon.length > 0 && (
                <>
                  {renderSectionHeader('Expiring Soon', expiringSoon.length)}
                  {expiringSoon.map(medicine => (
                    <MedicineCard
                      key={medicine.id}
                      medicine={medicine}
                      onPress={handleMedicinePress}
                      onDelete={handleDeleteMedicine}
                    />
                  ))}
                </>
              )}
              {medicines.length > 0 && (
                renderSectionHeader('All Medicines', medicines.length)
              )}
            </>
          )}
          ListEmptyComponent={renderEmptyList}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddMedicine')}
      >
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#2196F3',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  countBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default HomeScreen;