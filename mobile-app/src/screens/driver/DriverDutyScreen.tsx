import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  BackHandler,
  Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationService } from '../../services/locationService';
import { BusService } from '../../services/busService';
import { Bus, LocationData } from '../../types';

interface Props {
  navigation: any;
  route: any;
}

const DriverDutyScreen: React.FC<Props> = ({ navigation, route }) => {
  const { bus } = route.params || {};
  
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationSharingActive, setLocationSharingActive] = useState(false);
  const [dutyStartTime, setDutyStartTime] = useState<Date | null>(null);
  const [dutyDuration, setDutyDuration] = useState<string>('00:00:00');
  
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isOnDuty) {
        Alert.alert(
          'Location Sharing Active',
          'Please stop location sharing before going back.',
          [{ text: 'OK' }]
        );
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isOnDuty]);

  useEffect(() => {
    if (isOnDuty) {
      startDurationTimer();
    } else {
      stopDurationTimer();
    }

    return () => {
      stopDurationTimer();
    };
  }, [isOnDuty]);

  const startDurationTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      if (dutyStartTime) {
        const now = new Date();
        const diff = now.getTime() - dutyStartTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setDutyDuration(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const startLocationSharing = async () => {
    try {
      // Get initial location
      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);

      // Start location tracking
      await LocationService.startLocationTracking(async (locationData) => {
        setCurrentLocation(locationData);
        
        // Update bus location in Firebase
        await LocationService.updateBusLocation(bus.busNumber, locationData);
        
        // Update bus status in Firestore
        await BusService.updateBusPassengerCount(bus.busNumber, 0); // Just to update status
      });

      // Set up interval for regular updates
      locationIntervalRef.current = setInterval(async () => {
        try {
          const latestLocation = await LocationService.getCurrentLocation();
          setCurrentLocation(latestLocation);
          await LocationService.updateBusLocation(bus.busNumber, latestLocation);
        } catch (error) {
          console.error('Error updating location:', error);
        }
      }, 5000); // Update every 5 seconds

      setIsOnDuty(true);
      setLocationSharingActive(true);
      setDutyStartTime(new Date());
      Vibration.vibrate(200);

      Alert.alert('Duty Started', 'Location sharing is now active.');
    } catch (error) {
      console.error('Error starting location sharing:', error);
      Alert.alert('Error', 'Failed to start location sharing. Please check location permissions.');
    }
  };

  const stopLocationSharing = async () => {
    try {
      // Stop location tracking
      LocationService.stopLocationTracking();

      // Clear intervals
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }

      // Clear bus location from Firebase
      await LocationService.clearBusLocation(bus.busNumber);

      // Update bus status
      await BusService.updateBusPassengerCount(bus.busNumber, 0); // Just to update status

      setIsOnDuty(false);
      setLocationSharingActive(false);
      setDutyStartTime(null);
      setDutyDuration('00:00:00');
      Vibration.vibrate(200);

      Alert.alert(
        'Duty Ended',
        `Total duty time: ${dutyDuration}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error stopping location sharing:', error);
      Alert.alert('Error', 'Failed to stop location sharing.');
    }
  };

  const handleDutyToggle = () => {
    if (isOnDuty) {
      Alert.alert(
        'End Duty',
        'Are you sure you want to end your duty and stop location sharing?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'End Duty', style: 'destructive', onPress: stopLocationSharing }
        ]
      );
    } else {
      Alert.alert(
        'Start Duty',
        'This will enable real-time location sharing for your bus. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start Duty', onPress: startLocationSharing }
        ]
      );
    }
  };

  const formatCoordinates = (lat: number, lon: number) => {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Duty Management</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Bus Info */}
      <View style={styles.busInfo}>
        <Text style={styles.busNumber}>{bus.busNumber}</Text>
        <Text style={styles.driverName}>Driver: {route.params?.user?.name || 'You'}</Text>
      </View>

      {/* Duty Status */}
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: isOnDuty ? '#4CAF50' : '#ccc' }
        ]} />
        <Text style={styles.statusText}>
          {isOnDuty ? 'On Duty - Location Sharing Active' : 'Off Duty'}
        </Text>
      </View>

      {/* Duty Duration */}
      {isOnDuty && (
        <View style={styles.durationContainer}>
          <Text style={styles.durationLabel}>Duty Duration</Text>
          <Text style={styles.durationText}>{dutyDuration}</Text>
        </View>
      )}

      {/* Current Location */}
      <View style={styles.locationContainer}>
        <Text style={styles.locationTitle}>Current Location</Text>
        {currentLocation ? (
          <View style={styles.locationInfo}>
            <Text style={styles.coordinatesText}>
              {formatCoordinates(currentLocation.latitude, currentLocation.longitude)}
            </Text>
            <Text style={styles.updateTimeText}>
              Last updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        ) : (
          <Text style={styles.noLocationText}>Waiting for location...</Text>
        )}
      </View>

      {/* Main Action Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[
            styles.dutyButton,
            isOnDuty ? styles.stopButton : styles.startButton
          ]}
          onPress={handleDutyToggle}
        >
          <Ionicons 
            name={isOnDuty ? "stop-circle" : "play-circle"} 
            size={40} 
            color="#fff" 
          />
          <Text style={styles.dutyButtonText}>
            {isOnDuty ? 'END DUTY' : 'START DUTY'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Important Information */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Important Information</Text>
        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.infoText}>
              Location will be updated every 5 seconds
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.infoText}>
              Keep app open and screen on for accurate tracking
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="warning" size={16} color="#FF9800" />
            <Text style={styles.infoText}>
              Stop location sharing when your shift ends
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={16} color="#2196f3" />
            <Text style={styles.infoText}>
              Your location helps ensure passenger safety
            </Text>
          </View>
        </View>
      </View>

      {/* Emergency Contact */}
      <View style={styles.emergencyContainer}>
        <TouchableOpacity style={styles.emergencyButton}>
          <Ionicons name="call" size={20} color="#f44336" />
          <Text style={styles.emergencyText}>Emergency Contact</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  busInfo: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  busNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  driverName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  durationContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  durationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  durationText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  locationContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  locationInfo: {
    alignItems: 'center',
  },
  coordinatesText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  updateTimeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  noLocationText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dutyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 15,
    gap: 10,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  dutyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
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
  emergencyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f44336',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 10,
  },
  emergencyText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DriverDutyScreen;
