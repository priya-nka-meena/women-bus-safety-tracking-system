import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../../services/authService';
import { BusService } from '../../services/busService';
import { User, Bus } from '../../types';

interface Props {
  navigation: any;
}

const DriverDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [assignedBus, setAssignedBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);

      if (currentUser?.assignedBusNumber) {
        const bus = await BusService.getBusByNumber(currentUser.assignedBusNumber);
        setAssignedBus(bus);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleStartDuty = () => {
    if (!assignedBus) {
      Alert.alert('No Bus Assigned', 'Please wait for admin to assign a bus to you.');
      return;
    }
    navigation.navigate('DriverDuty', { bus: assignedBus });
  };

  const handleViewStatus = () => {
    navigation.navigate('DriverStatus');
  };

  const handleProfile = () => {
    navigation.navigate('DriverProfile');
  };

  const handleContactAdmin = () => {
    Alert.alert(
      'Contact Admin',
      'For support, please contact:\n\nEmail: admin@womensafety.com\nPhone: 1800-123-4567'
    );
  };

  const getDutyStatusColor = () => {
    if (!assignedBus) return '#ccc';
    return assignedBus.isActive ? '#4CAF50' : '#FF9800';
  };

  const getDutyStatusText = () => {
    if (!assignedBus) return 'No Bus Assigned';
    return assignedBus.isActive ? 'On Duty' : 'Off Duty';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>{user?.name || 'Driver'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={handleProfile}
        >
          <Ionicons name="person-circle" size={40} color="#2196f3" />
        </TouchableOpacity>
      </View>

      {/* Bus Assignment Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bus Assignment</Text>
        {assignedBus ? (
          <View style={styles.busCard}>
            <View style={styles.busHeader}>
              <View>
                <Text style={styles.busNumber}>{assignedBus.busNumber}</Text>
                <Text style={styles.driverName}>Assigned to you</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getDutyStatusColor() }]}>
                <Text style={styles.statusText}>{getDutyStatusText()}</Text>
              </View>
            </View>
            
            <View style={styles.busDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="people" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {assignedBus.femalePassengerCount} female passengers
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="speedometer" size={16} color="#666" />
                <Text style={styles.detailText}>
                  Capacity: {assignedBus.capacity}
                </Text>
              </View>
            </View>

            <View style={styles.routeInfo}>
              <Text style={styles.routeTitle}>Route:</Text>
              <Text style={styles.routeText}>
                {assignedBus.route.join(' → ')}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.noBusCard}>
            <Ionicons name="bus" size={60} color="#ccc" />
            <Text style={styles.noBusText}>No Bus Assigned</Text>
            <Text style={styles.noBusSubtext}>
              Please wait for admin to assign a bus to your account
            </Text>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleContactAdmin}
            >
              <Text style={styles.contactButtonText}>Contact Admin</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={[styles.actionCard, !assignedBus && styles.disabledCard]}
          onPress={handleStartDuty}
          disabled={!assignedBus}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="play-circle" size={30} color="#fff" />
          </View>
          <Text style={styles.actionTitle}>Start Duty</Text>
          <Text style={styles.actionSubtitle}>
            {assignedBus ? 'Begin location sharing' : 'No bus assigned'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={handleViewStatus}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="location" size={30} color="#fff" />
          </View>
          <Text style={styles.actionTitle}>View Status</Text>
          <Text style={styles.actionSubtitle}>Check current duty status</Text>
        </TouchableOpacity>
      </View>

      {/* Important Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Important Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color="#2196f3" />
            <Text style={styles.infoText}>
              Always keep location sharing enabled while on duty
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.infoText}>
              Your location helps ensure passenger safety
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="warning" size={20} color="#FF9800" />
            <Text style={styles.infoText}>
              Stop sharing location when your duty ends
            </Text>
          </View>
        </View>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity 
          style={styles.supportCard}
          onPress={handleContactAdmin}
        >
          <Ionicons name="call" size={24} color="#2196f3" />
          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>Contact Support</Text>
            <Text style={styles.supportSubtitle}>Get help from admin team</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  profileButton: {
    padding: 5,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  busCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  busNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  driverName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  busDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  routeInfo: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  routeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  routeText: {
    fontSize: 14,
    color: '#333',
  },
  noBusCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noBusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
  },
  noBusSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledCard: {
    opacity: 0.5,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
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
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  supportContent: {
    flex: 1,
    marginLeft: 15,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  supportSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default DriverDashboardScreen;
