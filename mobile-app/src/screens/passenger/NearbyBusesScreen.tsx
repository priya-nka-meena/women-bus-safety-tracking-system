import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BusService } from '../../services/busService';
import { LocationService } from '../../services/locationService';
import { NearbyBus, LocationData } from '../../types';

interface Props {
  navigation: any;
  route: any;
}

const NearbyBusesScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userLocation, sourceStop, destinationStop, buses: passedBuses } = route.params || {};
  
  const [buses, setBuses] = useState<NearbyBus[]>(passedBuses || []);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(userLocation || null);

  useEffect(() => {
    if (!passedBuses) {
      loadNearbyBuses();
    }
  }, []);

  const loadNearbyBuses = async () => {
    if (!location) {
      try {
        const currentLocation = await LocationService.getCurrentLocation();
        setLocation(currentLocation);
        fetchNearbyBuses(currentLocation);
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'Could not get your location');
      }
    } else {
      fetchNearbyBuses(location);
    }
  };

  const fetchNearbyBuses = async (currentLocation: LocationData) => {
    setLoading(true);
    try {
      const nearbyBuses = await BusService.getNearbyBuses(currentLocation);
      setBuses(nearbyBuses);
    } catch (error) {
      console.error('Error fetching nearby buses:', error);
      Alert.alert('Error', 'Failed to load nearby buses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNearbyBuses();
  };

  const handleBusSelect = (bus: NearbyBus) => {
    Alert.alert(
      'Board Bus',
      `Do you want to board ${bus.busNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Board',
          onPress: () => {
            // Update passenger count and navigate to live tracking
            BusService.updateBusPassengerCount(bus.busNumber, 1);
            navigation.navigate('LiveTracking', {
              busNumber: bus.busNumber,
              busLocation: bus.location,
              sourceStop,
              destinationStop
            });
          },
        },
      ]
    );
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

  const renderBusItem = ({ item }: { item: NearbyBus }) => (
    <TouchableOpacity 
      style={styles.busCard}
      onPress={() => handleBusSelect(item)}
    >
      <View style={styles.busHeader}>
        <View>
          <Text style={styles.busNumber}>{item.busNumber}</Text>
          <Text style={styles.driverName}>{item.driverName}</Text>
        </View>
        <View style={styles.safetyBadge}>
          <Text style={[
            styles.safetyText,
            { color: getSafetyStatusColor(item.safetyStatus) }
          ]}>
            {getSafetyStatusText(item.safetyStatus)}
          </Text>
        </View>
      </View>

      <View style={styles.busDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.detailText}>{item.distance.toFixed(1)} km away</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.detailText}>
            {Math.round(item.estimatedArrival / 60000)} min
          </Text>
        </View>
      </View>

      <View style={styles.passengerInfo}>
        <View style={styles.passengerItem}>
          <Ionicons name="woman" size={16} color="#e91e63" />
          <Text style={styles.passengerText}>
            {item.femalePassengerCount} female passengers
          </Text>
        </View>
        <View style={styles.passengerItem}>
          <Ionicons name="trending-up" size={16} color="#2196f3" />
          <Text style={styles.passengerText}>
            {item.predictedFemaleCount} predicted at next stop
          </Text>
        </View>
      </View>

      <View style={styles.actionFooter}>
        <Text style={styles.boardText}>Tap to board this bus</Text>
        <Ionicons name="chevron-forward" size={20} color="#e91e63" />
      </View>
    </TouchableOpacity>
  );

  if (loading && buses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
        <Text style={styles.loadingText}>Finding nearby buses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Buses</Text>
        {sourceStop && destinationStop && (
          <Text style={styles.routeInfo}>
            {sourceStop} → {destinationStop}
          </Text>
        )}
      </View>

      {/* Bus List */}
      <FlatList
        data={buses}
        renderItem={renderBusItem}
        keyExtractor={(item, index) => `${item.busNumber}-${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bus-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No buses found nearby</Text>
            <Text style={styles.emptySubtext}>
              Try refreshing or check your location settings
            </Text>
          </View>
        }
      />

      {/* Safety Info */}
      <View style={styles.safetyInfo}>
        <Text style={styles.safetyTitle}>Safety Levels</Text>
        <View style={styles.safetyLevels}>
          <View style={styles.safetyLevel}>
            <View style={[styles.safetyDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.safetyLevelText}>High (30%+ female)</Text>
          </View>
          <View style={styles.safetyLevel}>
            <View style={[styles.safetyDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.safetyLevelText}>Medium (15-30% female)</Text>
          </View>
          <View style={styles.safetyLevel}>
            <View style={[styles.safetyDot, { backgroundColor: '#f44336' }]} />
            <Text style={styles.safetyLevelText}>Low (&lt;15% female)</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  routeInfo: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  listContainer: {
    padding: 20,
  },
  busCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
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
    fontSize: 20,
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
  passengerInfo: {
    marginBottom: 15,
  },
  passengerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  passengerText: {
    fontSize: 12,
    color: '#333',
  },
  actionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  boardText: {
    fontSize: 14,
    color: '#e91e63',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  safetyInfo: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  safetyLevels: {
    gap: 8,
  },
  safetyLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  safetyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  safetyLevelText: {
    fontSize: 12,
    color: '#666',
  },
});

export default NearbyBusesScreen;
