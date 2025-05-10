import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView,
  Alert 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { saveMedicine } from '../utils/database';
import MedicineForm from '../components/MedicineForm';
import CameraView from '../components/CameraView';
import { scheduleMedicineExpiryNotification } from '../components/NotificationManager';

const AddMedicineScreen = ({ navigation, route }) => {
  const [imageUri, setImageUri] = useState(null);
  const [extractedData, setExtractedData] = useState({
    name: '',
    company: '',
    expiryDate: ''
  });
  const [showCamera, setShowCamera] = useState(false);

  // If we have data from the camera screen, use it
  useEffect(() => {
    if (route.params?.imageUri) {
      setImageUri(route.params.imageUri);
    }
    
    if (route.params?.extractedData) {
      setExtractedData(route.params.extractedData);
    }
  }, [route.params]);

  const handleSaveMedicine = async (medicineData) => {
    try {
      // Save medicine to local storage
      const medicineId = await saveMedicine({
        ...medicineData,
        imageUri
      });
      
      // Schedule notification for this medicine
      await scheduleMedicineExpiryNotification({
        id: medicineId,
        ...medicineData
      });
      
      // Show success message
      Alert.alert(
        'Success',
        'Medicine has been saved successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    } catch (error) {
      console.error('Error saving medicine:', error);
      Alert.alert('Error', 'Failed to save medicine. Please try again.');
    }
  };

  const handleImageCaptured = (uri, data) => {
    setImageUri(uri);
    if (data) {
      setExtractedData(data);
    }
    setShowCamera(false);
  };

  const openCamera = () => {
    setShowCamera(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Medicine</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={openCamera}
        >
          <MaterialIcons name="add-a-photo" size={24} color="#FFFFFF" />
          <Text style={styles.cameraButtonText}>
            {imageUri ? 'Retake Photo' : 'Take Photo of Medicine'}
          </Text>
        </TouchableOpacity>

        <MedicineForm
          initialValues={extractedData}
          onSubmit={handleSaveMedicine}
          imageUri={imageUri}
        />
      </ScrollView>

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <CameraView
          onImageCaptured={handleImageCaptured}
          onCancel={() => setShowCamera(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerRight: {
    width: 40,
  },
  contentContainer: {
    padding: 16,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  cameraButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AddMedicineScreen;