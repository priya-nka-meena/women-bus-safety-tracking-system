import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../../services/authService';
import { BusService } from '../../services/busService';
import { LocationService } from '../../services/locationService';
import { User, Bus, LocationData } from '../../types';

interface Props {
  navigation: any;
}

const DriverStatusScreen: React.FC<Props> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [assignedBus, setAssignedBus] = useState<Bus | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dutyStats, setDutyStats] = useState({
    totalDutyTime: '00:00:00',
    passengersServed: 0,
    tripsCompleted: 0
  });

  useEffect(() => {
    loadDriverData();
    checkDutyStatus();
    
    // Set up location listener
    const locationInterval = setInterval(() => {
      checkDutyStatus();
    }, 5000);

    return () => clearInterval(locationInterval);
  }, []);

  const loadDriverData = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);

      if (currentUser?.assignedBusNumber) {
        const bus = await BusService.getBusByNumber(currentUser.assignedBusNumber);
        setAssignedBus(bus);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    }
  };

  const checkDutyStatus = async () => {
    try {
      if (assignedBus) {
        // Check if bus has active location in Firebase
        // This would typically involve checking the realtime database
        // For now, we'll simulate the status
        const location = await LocationService.getCurrentLocation();
        setCurrentLocation(location);
        
        // In a real implementation, you'd check if the bus location is being updated
        setIsOnDuty(assignedBus.isActive);
      }
    } catch (error) {
      console.error('Error checking duty status:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDriverData();
    await checkDutyStatus();
    setRefreshing(false);
  };

  const handleStartDuty = () => {
    if (!assignedBus) {
      Alert.alert('No Bus Assigned', 'Please wait for admin to assign a bus to you.');
      return;
    }
    navigation.navigate('DriverDuty', { bus: assignedBus });
  };

  const handleViewDetails = () => {
    Alert.alert(
      'Bus Details',
      `Bus Number: ${assignedBus?.busNumber}\nCapacity: ${assignedBus?.capacity}\nCurrent Passengers: ${assignedBus?.femalePassengerCount}`,
      [{ text: 'OK' }]
    );
  };

  const handleContactAdmin = () => {
    Alert.alert(
      'Contact Admin',
      'For support, please contact:\n\nEmail: admin@womensafety.com\nPhone: 1800-123-4567'
    );
  };

  const getStatusColor = () => {
    if (!assignedBus) return '#ccc';
    return isOnDuty ? '#4CAF50' : '#FF9800';
  };

  const getStatusText = () => {
    if (!assignedBus) return 'No Bus Assigned';
    return isOnDuty ? 'On Duty' : 'Off Duty';
  };

  const getStatusIcon = () => {
    if (!assignedBus) return 'help-circle';
    return isOnDuty ? 'checkmark-circle' : 'close-circle';
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Status</Text>
        <Text style={styles.headerSubtitle}>Real-time duty information</Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons 
            name={getStatusIcon()} 
            size={40} 
            color={getStatusColor()} 
          />
          <View style={styles.statusInfo}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
            <Text style={styles.statusSubtext}>
              {assignedBus ? `Bus ${assignedBus.busNumber}` : 'No bus assigned'}
            </Text>
          </View>
        </View>

        {currentLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Current Location</Text>
            <Text style={styles.coordinatesText}>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.updateTimeText}>
              Last updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>

      {/* Bus Information */}
      {assignedBus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bus Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bus Number:</Text>
              <Text style={styles.infoValue}>{assignedBus.busNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Capacity:</Text>
              <Text style={styles.infoValue}>{assignedBus.capacity} passengers</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Female Passengers:</Text>
              <Text style={styles.infoValue}>{assignedBus.femalePassengerCount}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[styles.infoValue, { color: getStatusColor() }]}>
                {assignedBus.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Duty Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Statistics</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#2196f3" />
            <Text style={styles.statValue}>{dutyStats.totalDutyTime}</Text>
            <Text style={styles.statLabel}>Total Duty Time</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#e91e63" />
            <Text style={styles.statValue}>{dutyStats.passengersServed}</Text>
            <Text style={styles.statLabel}>Passengers Served</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="bus" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{dutyStats.tripsCompleted}</Text>
            <Text style={styles.statLabel}>Trips Completed</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, !assignedBus && styles.disabledButton]}
          onPress={handleStartDuty}
          disabled={!assignedBus}
        >
          <Ionicons name={isOnDuty ? "stop-circle" : "play-circle"} size={20} color="#fff" />
          <Text style={styles.actionButtonText}>
            {isOnDuty ? 'End Duty' : 'Start Duty'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleViewDetails}>
          <Ionicons name="information-circle" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleContactAdmin}>
          <Ionicons name="call" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Contact Admin</Text>
        </TouchableOpacity>
      </View>

      {/* Important Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Important Notes</Text>
        <View style={styles.notesCard}>
          <View style={styles.noteItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.noteText}>
              Keep location sharing enabled while on duty
            </Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="warning" size={16} color="#FF9800" />
            <Text style={styles.noteText}>
              Update your status when starting or ending duty
            </Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="shield-checkmark" size={16} color="#2196f3" />
            <Text style={styles.noteText}>
              Your location helps ensure passenger safety
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusInfo: {
    marginLeft: 15,
    flex: 1,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  locationInfo: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  coordinatesText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  updateTimeText: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196f3',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 10,
    gap: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    gap: 10,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noteText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

export default DriverStatusScreen;
