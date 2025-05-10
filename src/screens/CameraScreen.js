import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { processImage } from '../utils/ocrHelper';
import * as Device from 'expo-device';

const CameraScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef(null);

  // Initialize camera safely
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        // First check if we're on a physical device since simulators might cause issues
        if (!Device.isDevice) {
          console.log('Not a physical device, camera functionality may be limited');
        }
        
        // Request camera permissions
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        
        // Get camera types safely
        if (Camera && Camera.Constants && Camera.Constants.Type) {
          setCameraType(Camera.Constants.Type.back);
        } else {
          console.log('Camera.Constants.Type is not available');
        }
      } catch (error) {
        console.error('Error initializing camera:', error);
        setHasPermission(false);
      }
    };
    
    initializeCamera();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      setIsProcessing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync();
        await processAndNavigate(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const pickImage = async () => {
    setIsProcessing(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        await processAndNavigate(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processAndNavigate = async (imageUri) => {
    try {
      const extractedData = await processImage(imageUri);
      navigation.navigate('AddMedicine', { 
        imageUri,
        extractedData
      });
    } catch (error) {
      console.error('Error processing image:', error);
      // Even if OCR fails, we want to allow manual entry
      navigation.navigate('AddMedicine', { 
        imageUri,
        extractedData: { name: '', company: '', expiryDate: '' }
      });
    }
  };

  const flipCamera = () => {
    if (Camera && Camera.Constants && Camera.Constants.Type) {
      setCameraType(
        cameraType === Camera.Constants.Type.back
          ? Camera.Constants.Type.front
          : Camera.Constants.Type.back
      );
    } else {
      console.log('Cannot flip camera: Camera.Constants.Type is not available');
    }
  };

  // Display loading if permission or camera type are not yet determined
  if (hasPermission === null || cameraType === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity 
          style={styles.galleryOnlyButton}
          onPress={pickImage}>
          <Text style={styles.galleryOnlyButtonText}>Select from Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isProcessing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Processing image...</Text>
        </View>
      ) : (
        <>
          <Camera style={styles.camera} type={cameraType} ref={cameraRef}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={pickImage}
              >
                <MaterialIcons name="photo-library" size={28} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.flipButton}
                onPress={flipCamera}
              >
                <MaterialIcons name="flip-camera-android" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </Camera>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  flipButton: {
    alignSelf: 'flex-end',
    marginRight: 20,
  },
  galleryButton: {
    alignSelf: 'flex-end',
    marginLeft: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  galleryOnlyButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
  },
  galleryOnlyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default CameraScreen;