import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import MedicineDetailsScreen from '../screens/MedicineDetailsScreen';
import AddMedicineScreen from '../screens/AddMedicineScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Medicine Tracker' }} />
        <Stack.Screen name="Camera" component={CameraScreen} options={{ title: 'Scan Medicine' }} />
        <Stack.Screen name="MedicineDetails" component={MedicineDetailsScreen} options={{ title: 'Medicine Details' }} />
        <Stack.Screen name="AddMedicine" component={AddMedicineScreen} options={{ title: 'Add Medicine' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;