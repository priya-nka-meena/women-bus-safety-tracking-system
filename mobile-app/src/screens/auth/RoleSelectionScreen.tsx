import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  navigation: any;
  route: any;
}

const RoleSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userData } = route.params || {};

  const handleRoleSelection = (role: 'passenger' | 'driver') => {
    if (role === 'passenger') {
      navigation.navigate('AadhaarVerification', { userData, role });
    } else if (role === 'driver') {
      navigation.navigate('LicenseVerification', { userData, role });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="people" size={60} color="#e91e63" />
        <Text style={styles.title}>Select Your Role</Text>
        <Text style={styles.subtitle}>Choose how you want to use the app</Text>
      </View>

      <View style={styles.rolesContainer}>
        <TouchableOpacity 
          style={[styles.roleCard, styles.passengerCard]}
          onPress={() => handleRoleSelection('passenger')}
        >
          <View style={styles.roleIcon}>
            <Ionicons name="woman" size={80} color="#fff" />
          </View>
          <Text style={styles.roleTitle}>Passenger</Text>
          <Text style={styles.roleDescription}>
            Track buses, get safety alerts, and use SOS features
          </Text>
          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Live Bus Tracking</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>SOS Emergency</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Safety Status</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.roleCard, styles.driverCard]}
          onPress={() => handleRoleSelection('driver')}
        >
          <View style={styles.roleIcon}>
            <Ionicons name="man" size={80} color="#fff" />
          </View>
          <Text style={styles.roleTitle}>Driver</Text>
          <Text style={styles.roleDescription}>
            Share your location and help track bus movements
          </Text>
          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Location Sharing</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Duty Management</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Bus Assignment</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={20} color="#666" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  rolesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  passengerCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e91e63',
  },
  driverCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  roleIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  features: {
    width: '100%',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 5,
  },
});

export default RoleSelectionScreen;
