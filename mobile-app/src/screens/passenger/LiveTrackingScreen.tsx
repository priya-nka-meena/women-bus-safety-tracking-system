import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationService } from '../../services/locationService';
import { BusService } from '../../services/busService';
import { AuthService } from '../../services/authService';
import { LocationData } from '../../types';

interface Props {
  navigation: any;
  route: any;
}

const { width, height } = Dimensions.get('window');

const LiveTrackingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { busNumber, busLocation, sourceStop, destinationStop } = route.params || {};
  
  const [currentBusLocation, setCurrentBusLocation] = useState<LocationData | null>(busLocation || null);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(true);
  const [journeyActive, setJourneyActive] = useState(false);

  useEffect(() => {
    if (busNumber) {
      startLocationTracking();
      getCurrentLocation();
      startJourney();
    }

    return () => {
      if (busNumber) {
        LocationService.unsubscribeFromBusLocation(busNumber);
      }
    };
  }, [busNumber]);

  const startLocationTracking = () => {
    if (!busNumber) return;

    LocationService.subscribeToBusLocation(busNumber, (location) => {
      setCurrentBusLocation(location);
    });
  };

  const getCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  const startJourney = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (user && sourceStop && destinationStop) {
        const journey = await BusService.createJourney({
          passengerId: user.id,
          busNumber: busNumber,
          sourceStop,
          destinationStop,
          startTime: new Date(),
          status: 'active',
          currentLocation: currentBusLocation || undefined
        });
        setJourneyActive(true);
        
        // Update passenger count
        await BusService.updateBusPassengerCount(busNumber, 1);
      }
    } catch (error) {
      console.error('Error starting journey:', error);
    }
  };

  const endJourney = async () => {
    Alert.alert(
      'End Journey',
      'Have you reached your destination?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Journey',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = await AuthService.getCurrentUser();
              if (user) {
                // Update passenger count
                await BusService.updateBusPassengerCount(busNumber, -1);
                setJourneyActive(false);
                
                Alert.alert(
                  'Journey Completed',
                  'Thank you for using Women Bus Safety System!',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.navigate('Dashboard')
                    }
                  ]
                );
              }
            } catch (error) {
              console.error('Error ending journey:', error);
              Alert.alert('Error', 'Failed to end journey');
            }
          }
        }
      ]
    );
  };

  const triggerSOS = () => {
    navigation.navigate('SOS');
  };

  const shareLocation = () => {
    if (currentBusLocation) {
      const locationLink = `https://maps.google.com/?q=${currentBusLocation.latitude},${currentBusLocation.longitude}`;
      Alert.alert(
        'Share Location',
        `Bus ${busNumber} Location:\n${locationLink}`,
        [
          { text: 'OK' }
        ]
      );
    }
  };

  const calculateDistance = () => {
    if (!userLocation || !currentBusLocation) return 0;
    return LocationService.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      currentBusLocation.latitude,
      currentBusLocation.longitude
    );
  };

  if (!currentBusLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
        <Text style={styles.loadingText}>Waiting for bus location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.busNumber}>{busNumber}</Text>
          <Text style={styles.trackingStatus}>
            {tracking ? 'Live Tracking' : 'Tracking Paused'}
          </Text>
        </View>
        <TouchableOpacity onPress={shareLocation}>
          <Ionicons name="share" size={24} color="#e91e63" />
        </TouchableOpacity>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {/* This would be replaced with actual map component */}
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={80} color="#ccc" />
          <Text style={styles.mapText}>Live Map View</Text>
          <Text style={styles.mapSubtext}>
            Bus Location: {currentBusLocation.latitude.toFixed(6)}, {currentBusLocation.longitude.toFixed(6)}
          </Text>
          
          {/* Bus marker */}
          <View style={[styles.marker, styles.busMarker]}>
            <Ionicons name="bus" size={24} color="#fff" />
          </View>
          
          {/* User marker */}
          {userLocation && (
            <View style={[styles.marker, styles.userMarker]}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          )}
        </View>
      </View>

      {/* Journey Info */}
      <View style={styles.journeyInfo}>
        <View style={styles.journeyHeader}>
          <View>
            <Text style={styles.journeyTitle}>Active Journey</Text>
            {sourceStop && destinationStop && (
              <Text style={styles.journeyRoute}>
                {sourceStop} → {destinationStop}
              </Text>
            )}
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>

        <View style={styles.journeyStats}>
          <View style={styles.statItem}>
            <Ionicons name="location" size={20} color="#e91e63" />
            <View>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{calculateDistance().toFixed(1)} km</Text>
            </View>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="time" size={20} color="#2196f3" />
            <View>
              <Text style={styles.statLabel}>Last Update</Text>
              <Text style={styles.statValue}>
                {new Date(currentBusLocation.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.sosButton}
          onPress={triggerSOS}
        >
          <Ionicons name="warning" size={24} color="#fff" />
          <Text style={styles.sosButtonText}>SOS</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.endJourneyButton}
          onPress={endJourney}
        >
          <Ionicons name="flag" size={24} color="#fff" />
          <Text style={styles.endJourneyButtonText}>End Journey</Text>
        </TouchableOpacity>
      </View>

      {/* Safety Tips */}
      <View style={styles.safetyTips}>
        <Text style={styles.safetyTipsTitle}>Safety Reminders</Text>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.tipText}>Keep your phone charged</Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.tipText}>Share your journey with family</Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.tipText}>Use SOS in emergency situations</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerInfo: {
    alignItems: 'center',
  },
  busNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  trackingStatus: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  mapSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  marker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  busMarker: {
    backgroundColor: '#e91e63',
    top: '40%',
    left: '30%',
  },
  userMarker: {
    backgroundColor: '#2196f3',
    bottom: '30%',
    right: '25%',
  },
  journeyInfo: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  journeyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  journeyRoute: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  journeyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 15,
  },
  sosButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 8,
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  endJourneyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 8,
  },
  endJourneyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  safetyTips: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  safetyTipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  tipText: {
    fontSize: 14,
    color: '#333',
  },
});

export default LiveTrackingScreen;
