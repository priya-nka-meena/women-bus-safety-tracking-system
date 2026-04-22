import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  PermissionsAndroid,
  Platform
} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../../services/authService';
import DriverService, { DriverLocation } from '../../services/driverService';

const { width, height } = Dimensions.get('window');

interface Props {
  navigation: any;
}

const DriverTrackingScreen: React.FC<Props> = ({ navigation }) => {
  const mapRef = useRef<MapView>(null);
  const [user, setUser] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<DriverLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busNumber, setBusNumber] = useState<string>('');
  const [assignedBus, setAssignedBus] = useState<string>('');

  useEffect(() => {
    loadDriverData();
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, []);

  const loadDriverData = async () => {
    try {
      console.log("DRIVER: Loading driver data...");
      const userData = await AuthService.getCurrentUser();
      
      if (!userData) {
        Alert.alert('Error', 'Please login first');
        navigation.replace('Login');
        return;
      }

      if (userData.role !== 'driver') {
        Alert.alert('Error', 'Access denied. Driver account required.');
        navigation.replace('Login');
        return;
      }

      setUser(userData);
      console.log("DRIVER: User data loaded:", userData);

      // Get assigned bus from license data
      if (userData.licenseNumber) {
        const licenseData = await AuthService.verifyDriverLicense(userData.licenseNumber);
        if (licenseData.valid && licenseData.assignedBus) {
          setAssignedBus(licenseData.assignedBus);
          setBusNumber(licenseData.assignedBus);
          console.log("DRIVER: Assigned bus:", licenseData.assignedBus);
        }
      }

      // Get current location
      const location = await DriverService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
      }

      setLoading(false);
    } catch (error) {
      console.log("DRIVER: Error loading data:", error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load driver data');
    }
  };

  const startTracking = async () => {
    if (!busNumber) {
      Alert.alert('Error', 'No bus assigned. Please contact admin.');
      return;
    }

    try {
      console.log("DRIVER: Starting tracking for bus:", busNumber);
      setLoading(true);

      await DriverService.startDriverTracking(
        busNumber,
        user.id,
        (location) => {
          setCurrentLocation(location);
          console.log("DRIVER: Location updated:", location);
        }
      );

      setIsTracking(true);
      setLoading(false);
      Alert.alert('Success', 'GPS tracking started successfully!');
    } catch (error) {
      console.log("DRIVER: Error starting tracking:", error);
      setLoading(false);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to start tracking');
    }
  };

  const stopTracking = async () => {
    try {
      console.log("DRIVER: Stopping tracking for bus:", busNumber);
      setLoading(true);

      await DriverService.stopDriverTracking(busNumber);
      setIsTracking(false);
      setLoading(false);
      Alert.alert('Success', 'GPS tracking stopped');
    } catch (error) {
      console.log("DRIVER: Error stopping tracking:", error);
      setLoading(false);
      Alert.alert('Error', 'Failed to stop tracking');
    }
  };

  const centerMapOnLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading driver data...</Text>
      </View>
    );
  }

  const initialRegion = currentLocation ? {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : {
    latitude: 28.6139, // Default to Delhi
    longitude: 77.2090,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Tracking</Text>
        <Text style={styles.busInfo}>Bus: {busNumber || 'Not Assigned'}</Text>
        <Text style={styles.driverInfo}>Driver: {user?.name}</Text>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
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

        {/* Driver/Bus Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title={`Bus ${busNumber}`}
            description={`Speed: ${currentLocation.speed ? Math.round(currentLocation.speed) : 0} km/h`}
          >
            <View style={styles.busMarker}>
              <Ionicons name="bus" size={32} color="#fff" />
              <View style={styles.busNumberBadge}>
                <Text style={styles.busNumberText}>{busNumber}</Text>
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>Current Location</Text>
          {currentLocation && (
            <>
              <Text style={styles.locationText}>
                Lat: {currentLocation.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Lng: {currentLocation.longitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Speed: {currentLocation.speed ? Math.round(currentLocation.speed) : 0} km/h
              </Text>
              <Text style={styles.locationText}>
                Status: {isTracking ? 'Active' : 'Inactive'}
              </Text>
            </>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.centerButton]}
            onPress={centerMapOnLocation}
          >
            <Ionicons name="locate" size={24} color="#fff" />
            <Text style={styles.buttonText}>Center</Text>
          </TouchableOpacity>

          {!isTracking ? (
            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              onPress={startTracking}
            >
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.buttonText}>Start Duty</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={stopTracking}
            >
              <Ionicons name="stop" size={24} color="#fff" />
              <Text style={styles.buttonText}>Stop Duty</Text>
            </TouchableOpacity>
          )}
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
    backgroundColor: '#2196F3',
    padding: 15,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  busInfo: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  driverInfo: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  map: {
    flex: 1,
  },
  busMarker: {
    backgroundColor: '#F44336',
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busNumberBadge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  busNumberText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F44336',
  },
  controlPanel: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationInfo: {
    marginBottom: 15,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 120,
  },
  centerButton: {
    backgroundColor: '#FF9800',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default DriverTrackingScreen;
