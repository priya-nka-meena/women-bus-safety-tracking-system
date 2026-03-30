import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../../services/authService';
import { BusService } from '../../services/busService';
import { LocationService } from '../../services/locationService';
import { User, NearbyBus, LocationData } from '../../types';

interface Props {
  navigation: any;
}

const PassengerDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [nearbyBuses, setNearbyBuses] = useState<NearbyBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    loadUserData();
    loadNearbyBuses();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadNearbyBuses = async () => {
    try {
      setLoading(true);
      
      // Get user's current location
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
      
      // Get nearby buses
      const buses = await BusService.getNearbyBuses(location);
      setNearbyBuses(buses);
    } catch (error) {
      console.error('Error loading nearby buses:', error);
      Alert.alert('Error', 'Failed to load nearby buses. Please check location permissions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
    loadNearbyBuses();
  };

  const getSafetyStatusColor = (status: string) => {
    switch (status) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#f44336';
      default: return '#666';
    }
  };

  const getSafetyStatusText = (status: string) => {
    switch (status) {
      case 'high': return 'Safe';
      case 'medium': return 'Moderate';
      case 'low': return 'Caution';
      default: return 'Unknown';
    }
  };

  const handleBusSelect = (bus: NearbyBus) => {
    navigation.navigate('LiveTracking', { 
      busNumber: bus.busNumber,
      busLocation: bus.location
    });
  };

  const handleViewAllBuses = () => {
    navigation.navigate('NearbyBuses', { userLocation });
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
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>{user?.name || 'Passenger'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle" size={40} color="#e91e63" />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Journey')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="bus" size={30} color="#fff" />
          </View>
          <Text style={styles.actionTitle}>Start Journey</Text>
          <Text style={styles.actionSubtitle}>Find buses near you</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('EmergencyContacts')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="people" size={30} color="#fff" />
          </View>
          <Text style={styles.actionTitle}>Emergency</Text>
          <Text style={styles.actionSubtitle}>Manage contacts</Text>
        </TouchableOpacity>
      </View>

      {/* Nearby Buses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Buses</Text>
          <TouchableOpacity onPress={handleViewAllBuses}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading nearby buses...</Text>
          </View>
        ) : nearbyBuses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bus-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No buses found nearby</Text>
            <Text style={styles.emptySubtext}>Try refreshing or check your location</Text>
          </View>
        ) : (
          <View style={styles.busList}>
            {nearbyBuses.slice(0, 3).map((bus, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.busCard}
                onPress={() => handleBusSelect(bus)}
              >
                <View style={styles.busHeader}>
                  <View>
                    <Text style={styles.busNumber}>{bus.busNumber}</Text>
                    <Text style={styles.driverName}>{bus.driverName}</Text>
                  </View>
                  <View style={styles.safetyBadge}>
                    <Text style={[
                      styles.safetyText,
                      { color: getSafetyStatusColor(bus.safetyStatus) }
                    ]}>
                      {getSafetyStatusText(bus.safetyStatus)}
                    </Text>
                  </View>
                </View>

                <View style={styles.busDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.detailText}>{bus.distance.toFixed(1)} km away</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {Math.round(bus.estimatedArrival / 60000)} min
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="woman" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {bus.femalePassengerCount} female
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Safety Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Tips</Text>
        <View style={styles.tipsContainer}>
          <View style={styles.tipItem}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.tipText}>Always share your journey details</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.tipText}>Use SOS button in emergency situations</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.tipText}>Keep emergency contacts updated</Text>
          </View>
        </View>
      </View>

      {/* Emergency SOS Button */}
      <View style={styles.sosContainer}>
        <TouchableOpacity 
          style={styles.sosButton}
          onPress={() => navigation.navigate('SOS')}
        >
          <Ionicons name="warning" size={30} color="#fff" />
          <Text style={styles.sosText}>SOS Emergency</Text>
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
    paddingTop: 20,
    paddingBottom: 10,
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
  },
  profileButton: {
    padding: 5,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e91e63',
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
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#e91e63',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  busList: {
    gap: 10,
  },
  busCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
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
    marginBottom: 10,
  },
  busNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  driverName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  safetyBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  safetyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  busDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  tipsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  sosContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    paddingVertical: 20,
    borderRadius: 12,
    gap: 10,
  },
  sosText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default PassengerDashboardScreen;
