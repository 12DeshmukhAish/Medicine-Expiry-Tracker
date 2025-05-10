import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { Title, Paragraph, Button, Card, Divider } from 'react-native-paper';
import { getMedicineById, deleteMedicine } from '../utils/database';
import { calculateDaysUntilExpiry } from '../utils/dateUtils';

const MedicineDetailsScreen = ({ route, navigation }) => {
  const { medicineId } = route.params;
  const [medicine, setMedicine] = useState(null);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(null);

  useEffect(() => {
    const loadMedicine = async () => {
      const data = await getMedicineById(medicineId);
      setMedicine(data);
      
      if (data?.expiryDate) {
        setDaysUntilExpiry(calculateDaysUntilExpiry(data.expiryDate));
      }
    };
    
    loadMedicine();
  }, [medicineId]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Medicine',
      'Are you sure you want to delete this medicine?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: async () => {
            await deleteMedicine(medicineId);
            navigation.goBack();
          },
          style: 'destructive'
        },
      ]
    );
  };

  if (!medicine) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.imageContainer}>
            {medicine.imageUri && (
              <Image source={{ uri: medicine.imageUri }} style={styles.image} />
            )}
          </View>
          
          <Title style={styles.title}>{medicine.name}</Title>
          
          <Divider style={styles.divider} />
          
          <View style={styles.infoContainer}>
            <Paragraph style={styles.label}>Company:</Paragraph>
            <Paragraph style={styles.value}>{medicine.company || 'N/A'}</Paragraph>
          </View>
          
          <View style={styles.infoContainer}>
            <Paragraph style={styles.label}>Expiry Date:</Paragraph>
            <Paragraph style={styles.value}>{medicine.expiryDate}</Paragraph>
          </View>
          
          <View style={styles.infoContainer}>
            <Paragraph style={styles.label}>Status:</Paragraph>
            <Paragraph style={[
              styles.value, 
              daysUntilExpiry < 0 ? styles.expired : 
              daysUntilExpiry < 30 ? styles.expiring : 
              styles.valid
            ]}>
              {daysUntilExpiry < 0 
                ? 'Expired' 
                : daysUntilExpiry < 30 
                  ? `Expiring soon (${daysUntilExpiry} days)` 
                  : `Valid (${daysUntilExpiry} days until expiry)`}
            </Paragraph>
          </View>
        </Card.Content>
      </Card>
      
      <Button 
        mode="contained" 
        onPress={handleDelete}
        style={styles.deleteButton}
        color="#ff3b30"
      >
        Delete Medicine
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
  },
  divider: {
    marginVertical: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    width: 100,
  },
  value: {
    flex: 1,
  },
  expired: {
    color: '#ff3b30',
    fontWeight: 'bold',
  },
  expiring: {
    color: '#ff9500',
    fontWeight: 'bold',
  },
  valid: {
    color: '#34c759',
  },
  deleteButton: {
    marginTop: 10,
  },
});

export default MedicineDetailsScreen;