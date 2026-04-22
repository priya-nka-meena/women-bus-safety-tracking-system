import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  BackHandler,
  Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SOSService } from '../../services/sosService';
import AuthService from '../../services/authService';
import { LocationService } from '../../services/locationService';
import { User, LocationData } from '../../types';

interface Props {
  navigation: any;
}

const SOSScreen: React.FC<Props> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isCountingDown, setIsCountingDown] = useState(false);

  useEffect(() => {
    loadUserData();
    getCurrentLocation();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isCountingDown) {
        cancelSOS();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCountingDown && countdown > 0) {
      interval = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isCountingDown && countdown === 0) {
      triggerSOS();
    }

    return () => clearTimeout(interval);
  }, [isCountingDown, countdown]);

  const loadUserData = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location. Please enable location services.');
    }
  };

  const startSOSCountdown = () => {
    setIsCountingDown(true);
    setCountdown(5);
    Vibration.vibrate(500);
  };

  const cancelSOS = () => {
    setIsCountingDown(false);
    setCountdown(5);
    Vibration.cancel();
  };

  const triggerSOS = async () => {
    if (!user || !userLocation) {
      Alert.alert('Error', 'User information or location not available');
      return;
    }

    setLoading(true);
    try {
      // Get current bus number (this would come from active journey)
      // For demo purposes, we'll use a sample bus number
      const busNumber = 'BUS-101';

      await SOSService.triggerSOS(
        user.id,
        user.name,
        user.phone,
        busNumber,
        userLocation
      );

      setSosTriggered(true);
      Vibration.vibrate([500, 500, 500]);
      
      Alert.alert(
        'SOS Alert Sent!',
        'Emergency alerts have been sent to your emergency contacts and authorities. Help is on the way.',
        [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
      );
    } catch (error) {
      console.error('Error triggering SOS:', error);
      Alert.alert('Error', 'Failed to send SOS alert. Please try again or call emergency services directly.');
    } finally {
      setLoading(false);
      setIsCountingDown(false);
      setCountdown(5);
    }
  };

  const callEmergency = () => {
    Alert.alert(
      'Emergency Call',
      'Choose emergency service to call:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Police (100)', onPress: () => console.log('Calling 100') },
        { text: 'Women Helpline (1091)', onPress: () => console.log('Calling 1091') }
      ]
    );
  };

  const sendTestSMS = async () => {
    if (!user || !userLocation) {
      Alert.alert('Error', 'User information or location not available');
      return;
    }

    try {
      const message = `TEST SOS Alert from ${user.name}. Location: https://maps.google.com/?q=${userLocation.latitude},${userLocation.longitude}`;
      await SOSService.sendTestSMS(user.phone, message);
      Alert.alert('Test SMS Sent', 'Test message has been sent successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test SMS');
    }
  };

  if (sosTriggered) {
    return (
      <View style={styles.container}>
        <View style={styles.alertContainer}>
          <Ionicons name="warning" size={80} color="#4CAF50" />
          <Text style={styles.alertTitle}>SOS Alert Sent!</Text>
          <Text style={styles.alertMessage}>
            Emergency alerts have been sent to your emergency contacts and authorities.
            Help is on the way.
          </Text>
          <TouchableOpacity 
            style={styles.okButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="warning" size={60} color="#f44336" />
        <Text style={styles.title}>Emergency SOS</Text>
        <Text style={styles.subtitle}>Press and hold to send emergency alert</Text>
      </View>

      <View style={styles.content}>
        {/* SOS Button */}
        <TouchableOpacity 
          style={[
            styles.sosButton,
            isCountingDown && styles.sosButtonActive
          ]}
          onPressIn={startSOSCountdown}
          onPressOut={cancelSOS}
          disabled={loading}
        >
          {isCountingDown ? (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{countdown}</Text>
              <Text style={styles.releaseText}>Release to cancel</Text>
            </View>
          ) : (
            <View style={styles.sosButtonContent}>
              <Ionicons name="warning" size={50} color="#fff" />
              <Text style={styles.sosButtonText}>PRESS & HOLD</Text>
              <Text style={styles.sosButtonSubtext}>for 5 seconds to send SOS</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Emergency Contacts */}
        <View style={styles.emergencySection}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          {user?.emergencyContacts && user.emergencyContacts.length > 0 ? (
            user.emergencyContacts.slice(0, 3).map((contact, index) => (
              <View key={index} style={styles.contactItem}>
                <Ionicons name="person" size={20} color="#666" />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                <Text style={styles.contactRelation}>{contact.relationship}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noContactsText}>No emergency contacts found</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={callEmergency}>
            <Ionicons name="call" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Call Emergency</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={sendTestSMS}>
            <Ionicons name="mail" size={24} color="#e91e63" />
            <Text style={styles.testButtonText}>Send Test SMS</Text>
          </TouchableOpacity>
        </View>

        {/* Safety Information */}
        <View style={styles.safetyInfo}>
          <Text style={styles.infoTitle}>What happens when you trigger SOS?</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.infoText}>Alert sent to emergency contacts</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.infoText}>Police and women helpline notified</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.infoText}>Your current location shared</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.infoText}>Bus information included</Text>
            </View>
          </View>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#f44336" />
          <Text style={styles.loadingText}>Sending SOS Alert...</Text>
        </View>
      )}
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
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  sosButtonActive: {
    backgroundColor: '#ff6b6b',
    transform: [{ scale: 1.05 }],
  },
  sosButtonContent: {
    alignItems: 'center',
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  sosButtonSubtext: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#fff',
  },
  releaseText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 10,
  },
  emergencySection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 10,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  contactRelation: {
    fontSize: 12,
    color: '#e91e63',
    fontWeight: 'bold',
  },
  noContactsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196f3',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e91e63',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 10,
  },
  testButtonText: {
    color: '#e91e63',
    fontSize: 14,
    fontWeight: 'bold',
  },
  safetyInfo: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoList: {
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  alertContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 20,
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  okButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  okButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SOSScreen;
