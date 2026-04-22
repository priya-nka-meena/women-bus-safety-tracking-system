import { ref, set, onValue, off, DataSnapshot } from 'firebase/database';
import * as Location from 'expo-location';
import { realtimeDB } from './firebase';
import { LocationData, Bus } from '../types';

export class LocationService {
  private static locationSubscription: Location.LocationSubscription | null = null;
  private static busLocationListener: ((snapshot: DataSnapshot) => void) | null = null;
  private static trackingInterval: NodeJS.Timeout | null = null;

  // Request location permissions
  static async requestLocationPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  // Start tracking location every 5 seconds
  static async startLocationTracking(callback: (location: LocationData) => void): Promise<void> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      // Start background location tracking
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Minimum distance change in meters
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: Date.now()
          };
          callback(locationData);
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw new Error(`Failed to start location tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Stop location tracking
  static stopLocationTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  // Update bus location in Firebase Realtime Database
  static async updateBusLocation(busNumber: string, location: LocationData): Promise<void> {
    try {
      const busLocationRef = ref(realtimeDB, `bus_locations/${busNumber}`);
      const busData = {
        ...location,
        busNumber,
        lastUpdated: Date.now(),
        isActive: true
      };
      await set(busLocationRef, busData);
    } catch (error) {
      console.error('Error updating bus location:', error);
      throw new Error(`Failed to update bus location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Driver-specific location tracking with enhanced data
  static async startDriverLocationTracking(
    busNumber: string, 
    callback?: (location: LocationData & { speed?: number; heading?: number }) => void
  ): Promise<void> {
    try {
      console.log("DRIVER LOCATION TRACKING START:", busNumber);
      
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      // Start background location tracking with enhanced accuracy
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Minimum distance change in meters
        },
        async (location) => {
          console.log("DRIVER LOCATION UPDATE:", {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            speed: location.coords.speed,
            heading: location.coords.heading,
            accuracy: location.coords.accuracy
          });

          const locationData: LocationData & { speed?: number; heading?: number } = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: Date.now(),
            speed: location.coords.speed ? location.coords.speed * 3.6 : undefined, // Convert m/s to km/h
            heading: location.coords.heading || undefined
          };

          // Update Firebase Realtime Database with enhanced data
          const busLocationRef = ref(realtimeDB, `bus_locations/${busNumber}`);
          const busData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: Date.now(),
            lastUpdated: Date.now(),
            busNumber,
            speed: locationData.speed,
            heading: locationData.heading,
            isActive: true,
            accuracy: location.coords.accuracy
          };
          
          await set(busLocationRef, busData);
          console.log("BUS LOCATION UPDATED IN FIREBASE:", busNumber);

          // Call callback if provided
          if (callback) {
            callback(locationData);
          }
        }
      );
    } catch (error) {
      console.error('Error starting driver location tracking:', error);
      throw new Error(`Failed to start driver location tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Stop driver location tracking and mark as inactive
  static async stopDriverLocationTracking(busNumber: string): Promise<void> {
    console.log("STOPPING DRIVER LOCATION TRACKING:", busNumber);
    
    // Stop location subscription
    this.stopLocationTracking();
    
    // Mark bus as inactive in Firebase
    try {
      const busLocationRef = ref(realtimeDB, `bus_locations/${busNumber}`);
      await set(busLocationRef, null);
      console.log("BUS MARKED AS INACTIVE:", busNumber);
    } catch (error) {
      console.error('Error marking bus as inactive:', error);
    }
  }

  // Subscribe to real-time bus location updates
  static subscribeToBusLocation(
    busNumber: string, 
    callback: (location: LocationData & { busNumber?: string; lastUpdated?: number; isActive?: boolean }) => void
  ): void {
    const busLocationRef = ref(realtimeDB, `bus_locations/${busNumber}`);
    
    this.busLocationListener = (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    };

    onValue(busLocationRef, this.busLocationListener);
  }

  // Unsubscribe from bus location updates
  static unsubscribeFromBusLocation(busNumber: string): void {
    if (this.busLocationListener) {
      const busLocationRef = ref(realtimeDB, `bus_locations/${busNumber}`);
      off(busLocationRef, 'value', this.busLocationListener);
      this.busLocationListener = null;
    }
  }

  // Clear bus location (when driver stops duty)
  static async clearBusLocation(busNumber: string): Promise<void> {
    try {
      const busLocationRef = ref(realtimeDB, `bus_locations/${busNumber}`);
      await set(busLocationRef, null);
    } catch (error) {
      console.error('Error clearing bus location:', error);
      throw new Error(`Failed to clear bus location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get current location once
  static async getCurrentLocation(): Promise<LocationData> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw new Error(`Failed to get current location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all active bus locations
  static async getAllBusLocations(): Promise<Array<LocationData & { busNumber: string; lastUpdated: number; isActive: boolean }>> {
    try {
      const busLocationsRef = ref(realtimeDB, 'bus_locations');
      return new Promise((resolve, reject) => {
        onValue(busLocationsRef, (snapshot: DataSnapshot) => {
          const data = snapshot.val();
          if (data) {
            const locations = Object.entries(data).map(([busNumber, locationData]) => ({
              busNumber,
              ...(locationData as any)
            }));
            resolve(locations);
          } else {
            resolve([]);
          }
        }, {
          onlyOnce: true
        });
      });
    } catch (error) {
      console.error('Error getting all bus locations:', error);
      throw new Error(`Failed to get bus locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Subscribe to all bus locations for real-time updates
  static subscribeToAllBusLocations(callback: (busLocations: Map<string, any>) => void): () => void {
    try {
      const busLocationsRef = ref(realtimeDB, 'bus_locations');
      
      const listener = onValue(busLocationsRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        const busLocationsMap = new Map<string, any>();
        
        if (data) {
          Object.entries(data).forEach(([busNumber, locationData]) => {
            const location = locationData as any;
            if (location && location.latitude && location.longitude) {
              busLocationsMap.set(busNumber, {
                busNumber,
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: location.timestamp || Date.now(),
                lastUpdated: location.lastUpdated || Date.now(),
                speed: location.speed,
                heading: location.heading,
                isActive: location.isActive !== false
              });
            }
          });
        }
        
        callback(busLocationsMap);
      });
      
      // Return unsubscribe function
      return () => {
        off(busLocationsRef, 'value', listener);
      };
    } catch (error) {
      console.error('Error subscribing to all bus locations:', error);
      throw new Error(`Failed to subscribe to bus locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Calculate distance between two points using Haversine formula
  static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  // Estimate arrival time based on distance and average speed
  static estimateArrivalTime(
    currentLat: number,
    currentLon: number,
    destinationLat: number,
    destinationLon: number,
    averageSpeed: number = 40 // km/h for city bus
  ): number {
    const distance = this.calculateDistance(currentLat, currentLon, destinationLat, destinationLon);
    return (distance / averageSpeed) * 60 * 60 * 1000; // Return time in milliseconds
  }

  // Check if location services are enabled
  static async isLocationServicesEnabled(): Promise<boolean> {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  // Get location accuracy info
  static async getLocationAccuracy(): Promise<Location.LocationObject | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      return location;
    } catch (error) {
      console.error('Error getting location accuracy:', error);
      return null;
    }
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
