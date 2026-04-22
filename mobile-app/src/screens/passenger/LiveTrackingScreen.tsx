import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  PermissionsAndroid,
  Platform,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, Circle, UrlTile } from 'react-native-maps';
import { LocationService } from '../../services/locationService';
import { BusService } from '../../services/busService';
import AuthService from '../../services/authService';
import DriverService, { BusLocation as DriverBusLocation } from '../../services/driverService';
import { LocationData } from '../../types';

// Types for enhanced tracking
interface BusLocation extends LocationData {
  busNumber: string;
  lastUpdated: number;
  speed?: number; // km/h
  heading?: number;
}

interface AnimatedBusMarker {
  busNumber: string;
  coordinate: Animated.ValueXY;
  location: BusLocation;
  distance?: number;
  eta?: string;
}

interface Props {
  navigation: any;
  route: any;
}

const { width, height } = Dimensions.get('window');

const LiveTrackingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { busNumber, busLocation, sourceStop, destinationStop } = route.params || {};
  
  // Map and location states
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(true);
  const [journeyActive, setJourneyActive] = useState(false);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  
  // Multiple buses states
  const [buses, setBuses] = useState<Map<string, AnimatedBusMarker>>(new Map());
  const [nearestBus, setNearestBus] = useState<AnimatedBusMarker | null>(null);
  const [proximityAlertsTriggered, setProximityAlertsTriggered] = useState<Set<string>>(new Set());
  
  // Refs for animations and subscriptions
  const mapRef = useRef<MapView>(null);
  const busSubscriptions = useRef<Map<string, any>>(new Map());
  const animationTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (busNumber) {
      requestLocationPermission();
    }

    return () => {
      // Cleanup all subscriptions and animations
      cleanupAllSubscriptions();
    };
  }, [busNumber]);

  useEffect(() => {
    if (locationPermission && busNumber) {
      startLocationTracking();
      getCurrentLocation();
      startJourney();
    }
  }, [locationPermission, busNumber]);

  // Update map region when user location changes
  useEffect(() => {
    if (userLocation && nearestBus) {
      initializeMapRegion(userLocation, nearestBus.location);
      updateRouteCoordinates(userLocation, nearestBus.location);
    }
  }, [userLocation, nearestBus]);

  // Haversine formula for distance calculation
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }, []);

  // Calculate ETA based on distance and speed
  const calculateETA = useCallback((distance: number, speed: number = 30): string => {
    // Default speed: 30 km/h for city buses
    if (distance <= 0) return 'Arrived';
    
    const timeInHours = distance / speed;
    const timeInMinutes = Math.round(timeInHours * 60);
    
    if (timeInMinutes < 1) return '< 1 min';
    if (timeInMinutes < 60) return `${timeInMinutes} min`;
    
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = timeInMinutes % 60;
    return `${hours}h ${minutes}min`;
  }, []);

  // Check proximity and trigger alerts
  const checkProximityAlert = useCallback((busNumber: string, distance: number) => {
    if (distance <= 0.5 && !proximityAlertsTriggered.has(busNumber)) { // 500 meters
      // Trigger proximity alert
      Alert.alert(
        'Bus Nearby!',
        `Bus ${busNumber} is within 500 meters of your location.`,
        [{ text: 'OK' }]
      );
      
      // Mark alert as triggered for this bus
      setProximityAlertsTriggered(prev => new Set(prev).add(busNumber));
    } else if (distance > 0.5) {
      // Reset alert when bus moves away
      setProximityAlertsTriggered(prev => {
        const newSet = new Set(prev);
        newSet.delete(busNumber);
        return newSet;
      });
    }
  }, [proximityAlertsTriggered]);

  // Update route coordinates for polyline
  const updateRouteCoordinates = useCallback((userLoc: LocationData, busLoc: LocationData) => {
    setRouteCoordinates([
      { latitude: userLoc.latitude, longitude: userLoc.longitude },
      { latitude: busLoc.latitude, longitude: busLoc.longitude },
    ]);
  }, []);

  // Cleanup all subscriptions and animations
  const cleanupAllSubscriptions = useCallback(() => {
    // Clear Firebase subscriptions
    busSubscriptions.current.forEach(subscription => {
      if (subscription && subscription.off) {
        subscription.off();
      }
    });
    busSubscriptions.current.clear();
    
    // Clear animation timers
    animationTimers.current.forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    animationTimers.current.clear();
  }, []);

  // Create animated marker for a bus
  const createAnimatedMarker = useCallback((busNumber: string, location: BusLocation): AnimatedBusMarker => {
    const coordinate = new Animated.ValueXY({
      x: location.longitude,
      y: location.latitude,
    });

    return {
      busNumber,
      coordinate,
      location,
    };
  }, []);

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const hasPermission = await LocationService.requestLocationPermissions();
      setLocationPermission(hasPermission);
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Location permission is required for live tracking. Please enable it in settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to request location permission');
    }
  };

  // Initialize map region
  const initializeMapRegion = (userLoc: LocationData, busLoc: LocationData) => {
    const midLat = (userLoc.latitude + busLoc.latitude) / 2;
    const midLng = (userLoc.longitude + busLoc.longitude) / 2;
    const latDelta = Math.abs(userLoc.latitude - busLoc.latitude) * 1.5;
    const lngDelta = Math.abs(userLoc.longitude - busLoc.longitude) * 1.5;

    setMapRegion({
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: Math.max(latDelta, 0.02),
      longitudeDelta: Math.max(lngDelta, 0.02),
    });

    // Create route coordinates (simple straight line for now)
    setRouteCoordinates([
      { latitude: userLoc.latitude, longitude: userLoc.longitude },
      { latitude: busLoc.latitude, longitude: busLoc.longitude },
    ]);
  };

  const startLocationTracking = () => {
    if (!busNumber) return;

    // Subscribe to specific bus location from DriverService
    const unsubscribe = DriverService.subscribeToBusLocation(busNumber, (busLocation: DriverBusLocation | null) => {
      const busLocations = new Map<string, BusLocation>();
      
      if (busLocation) {
        const enhancedBusLocation: BusLocation = {
          latitude: busLocation.latitude,
          longitude: busLocation.longitude,
          timestamp: busLocation.timestamp,
          busNumber: busLocation.busNumber,
          lastUpdated: busLocation.lastUpdated,
          speed: busLocation.speed,
          heading: busLocation.heading
        };
        busLocations.set(busLocation.busNumber, enhancedBusLocation);
      }
      const updatedBuses = new Map<string, AnimatedBusMarker>();
      let closestBus: AnimatedBusMarker | null = null;
      let minDistance = Infinity;

      busLocations.forEach((busLocation, busNum) => {
        let animatedMarker = buses.get(busNum);
        
        // Create new animated marker if it doesn't exist
        if (!animatedMarker) {
          animatedMarker = createAnimatedMarker(busNum, busLocation);
        } else {
          // Animate to new position
          Animated.timing(animatedMarker.coordinate, {
            toValue: {
              x: busLocation.longitude,
              y: busLocation.latitude,
            },
            duration: 1000, // Smooth 1-second animation
            useNativeDriver: false,
          }).start();
          
          // Update location data
          animatedMarker.location = busLocation;
        }

        // Calculate distance from user
        if (userLocation) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            busLocation.latitude,
            busLocation.longitude
          );
          
          animatedMarker.distance = distance;
          animatedMarker.eta = calculateETA(distance, busLocation.speed || 30);
          
          // Check for proximity alerts
          checkProximityAlert(busNum, distance);
          
          // Find nearest bus
          if (distance < minDistance) {
            minDistance = distance;
            closestBus = animatedMarker;
          }
        }

        updatedBuses.set(busNum, animatedMarker);
      });

      setBuses(updatedBuses);
      setNearestBus(closestBus);
    });

    // Store unsubscribe function for cleanup
    busSubscriptions.current.set('allBuses', unsubscribe);
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get your current location');
    } finally {
      setLoading(false);
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
          currentLocation: nearestBus?.location || undefined
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
    if (nearestBus) {
      const locationLink = `https://maps.google.com/?q=${nearestBus.location.latitude},${nearestBus.location.longitude}`;
      Alert.alert(
        'Share Location',
        `Bus ${nearestBus.busNumber} Location:\n${locationLink}`,
        [
          { text: 'OK' }
        ]
      );
    } else {
      Alert.alert('No Bus Available', 'No active buses found to share location.');
    }
  };

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
        {!locationPermission ? (
          <View style={styles.permissionContainer}>
            <Ionicons name="location" size={60} color="#ccc" />
            <Text style={styles.permissionText}>Location Permission Required</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestLocationPermission}>
              <Text style={styles.permissionButtonText}>Enable Location</Text>
            </TouchableOpacity>
          </View>
        ) : loading || !mapRegion || buses.size === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e91e63" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            followsUserLocation={false}
            zoomEnabled={true}
            pitchEnabled={true}
            rotateEnabled={true}
            scrollEnabled={true}
          >
            {/* OpenStreetMap Tiles */}
            <UrlTile
              urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
            {/* User Location Marker */}
            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
                title="Your Location"
                description="You are here"
                pinColor="#2196F3" // Blue color for user
              />
            )}
            
            {/* Multiple Bus Markers */}
            {Array.from(buses.values()).map((bus) => (
              <Marker
                key={bus.busNumber}
                coordinate={{
                  latitude: bus.location.latitude,
                  longitude: bus.location.longitude,
                }}
                title={`Bus ${bus.busNumber}`}
                description={`ETA: ${bus.eta || 'Calculating...'}`}
                pinColor="#F44336" // Red color for bus
              >
                <View style={styles.busMarker}>
                  <Ionicons name="bus" size={24} color="#fff" />
                  <View style={styles.busNumberBadge}>
                    <Text style={styles.busNumberText}>{bus.busNumber}</Text>
                  </View>
                </View>
              </Marker>
            ))}
            
            {/* Proximity Alert Circle for Nearest Bus */}
            {nearestBus && nearestBus.distance && nearestBus.distance <= 0.5 && (
              <Circle
                center={{
                  latitude: nearestBus.location.latitude,
                  longitude: nearestBus.location.longitude,
                }}
                radius={500} // 500 meters
                strokeColor="#FF9800"
                fillColor="rgba(255, 152, 0, 0.2)"
                strokeWidth={2}
              />
            )}
            
            {/* Route Line to Nearest Bus */}
            {routeCoordinates.length > 1 && nearestBus && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#e91e63"
                strokeWidth={3}
                lineDashPattern={[10, 5]}
              />
            )}
          </MapView>
        )}
      </View>

      {/* Journey Info */}
      <View style={styles.journeyInfo}>
        <View style={styles.journeyHeader}>
          <View>
            <Text style={styles.journeyTitle}>Live Bus Tracking</Text>
            <Text style={styles.journeyRoute}>
              {buses.size} Active Bus{buses.size !== 1 ? 'es' : ''}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {nearestBus ? 'Tracking' : 'Searching'}
            </Text>
          </View>
        </View>

        {/* Nearest Bus ETA */}
        {nearestBus && (
          <View style={styles.nearestBusInfo}>
            <View style={styles.nearestBusHeader}>
              <Ionicons name="bus" size={20} color="#e91e63" />
              <Text style={styles.nearestBusTitle}>Nearest Bus: {nearestBus.busNumber}</Text>
            </View>
            <View style={styles.etaContainer}>
              <Ionicons name="time" size={20} color="#4CAF50" />
              <View>
                <Text style={styles.etaLabel}>ETA</Text>
                <Text style={styles.etaValue}>{nearestBus.eta || 'Calculating...'}</Text>
              </View>
            </View>
            <View style={styles.distanceContainer}>
              <Ionicons name="location" size={20} color="#2196f3" />
              <View>
                <Text style={styles.distanceLabel}>Distance</Text>
                <Text style={styles.distanceValue}>
                  {nearestBus.distance ? `${nearestBus.distance.toFixed(1)} km` : 'Calculating...'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* All Buses List */}
        {buses.size > 1 && (
          <View style={styles.allBusesContainer}>
            <Text style={styles.allBusesTitle}>All Active Buses</Text>
            <View style={styles.busesList}>
              {Array.from(buses.values())
                .sort((a, b) => (a.distance || 0) - (b.distance || 0))
                .map((bus) => (
                  <View key={bus.busNumber} style={styles.busListItem}>
                    <View style={styles.busListItemLeft}>
                      <Text style={styles.busListItemNumber}>{bus.busNumber}</Text>
                      {bus.distance && (
                        <Text style={styles.busListItemDistance}>
                          {bus.distance.toFixed(1)} km
                        </Text>
                      )}
                    </View>
                    <View style={styles.busListItemRight}>
                      <Text style={styles.busListItemEta}>
                        {bus.eta || '...'}
                      </Text>
                    </View>
                  </View>
                ))
              }
            </View>
          </View>
        )}
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
    marginHorizontal: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  busMarker: {
    backgroundColor: '#e91e63',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  busNumberBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e91e63',
  },
  busNumberText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  nearestBusInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  nearestBusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  nearestBusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  etaLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  etaValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  distanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196f3',
    marginLeft: 4,
  },
  allBusesContainer: {
    marginTop: 10,
  },
  allBusesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  busesList: {
    flexDirection: 'column',
  },
  busListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 6,
  },
  busListItemLeft: {
    flexDirection: 'column',
  },
  busListItemNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  busListItemDistance: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  busListItemRight: {
    alignItems: 'flex-end',
  },
  busListItemEta: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
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
