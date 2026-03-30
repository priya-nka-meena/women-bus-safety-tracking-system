import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens (we'll create these next)
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import AadhaarVerificationScreen from '../screens/auth/AadhaarVerificationScreen';
import LicenseVerificationScreen from '../screens/auth/LicenseVerificationScreen';

// Passenger screens
import PassengerDashboardScreen from '../screens/passenger/PassengerDashboardScreen';
import JourneyInputScreen from '../screens/passenger/JourneyInputScreen';
import NearbyBusesScreen from '../screens/passenger/NearbyBusesScreen';
import LiveTrackingScreen from '../screens/passenger/LiveTrackingScreen';
import SOSScreen from '../screens/passenger/SOSScreen';
import EmergencyContactsScreen from '../screens/passenger/EmergencyContactsScreen';
import PassengerProfileScreen from '../screens/passenger/PassengerProfileScreen';

// Driver screens
import DriverDashboardScreen from '../screens/driver/DriverDashboardScreen';
import DriverDutyScreen from '../screens/driver/DriverDutyScreen';
import DriverStatusScreen from '../screens/driver/DriverStatusScreen';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Passenger Tab Navigator
const PassengerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Journey') {
            iconName = focused ? 'bus' : 'bus-outline';
          } else if (route.name === 'SOS') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e91e63',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={PassengerDashboardScreen} />
      <Tab.Screen name="Journey" component={JourneyInputScreen} />
      <Tab.Screen name="SOS" component={SOSScreen} />
      <Tab.Screen name="Profile" component={PassengerProfileScreen} />
    </Tab.Navigator>
  );
};

// Driver Tab Navigator
const DriverTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Duty') {
            iconName = focused ? 'play-circle' : 'play-circle-outline';
          } else if (route.name === 'Status') {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196f3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DriverDashboardScreen} />
      <Tab.Screen name="Duty" component={DriverDutyScreen} />
      <Tab.Screen name="Status" component={DriverStatusScreen} />
      <Tab.Screen name="Profile" component={DriverProfileScreen} />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator: React.FC<{ userRole?: string }> = ({ userRole }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Auth Screens */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="RoleSelection" 
          component={RoleSelectionScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AadhaarVerification" 
          component={AadhaarVerificationScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="LicenseVerification" 
          component={LicenseVerificationScreen} 
          options={{ headerShown: false }}
        />

        {/* Passenger Screens */}
        <Stack.Screen 
          name="PassengerTabs" 
          component={PassengerTabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="NearbyBuses" 
          component={NearbyBusesScreen} 
          options={{ title: 'Nearby Buses' }}
        />
        <Stack.Screen 
          name="LiveTracking" 
          component={LiveTrackingScreen} 
          options={{ title: 'Live Tracking' }}
        />
        <Stack.Screen 
          name="EmergencyContacts" 
          component={EmergencyContactsScreen} 
          options={{ title: 'Emergency Contacts' }}
        />

        {/* Driver Screens */}
        <Stack.Screen 
          name="DriverTabs" 
          component={DriverTabNavigator} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
