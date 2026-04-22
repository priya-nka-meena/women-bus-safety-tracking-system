import * as Location from 'expo-location';
import { ref, set, onValue, off } from 'firebase/database';
import { database } from '../../firebaseConfig';

export interface DriverLocation {
  latitude: number;
  longitude: number;
  speed?: number; // km/h
  heading?: number; // degrees
  accuracy?: number;
  timestamp: number;
  isActive: boolean;
}

export interface BusLocation extends DriverLocation {
  busNumber: string;
  driverId: string;
  lastUpdated: number;
}

class DriverService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private busLocationRef: any = null;

  // Request location permissions
  async requestLocationPermissions(): Promise<boolean> {
    console.log("DRIVER: Requesting location permissions...");
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log("DRIVER ERROR: Location permission denied");
        return false;
      }

      // Request background location for tracking
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      console.log("DRIVER: Background permission status:", backgroundStatus.status);
      
      return true;
    } catch (error) {
      console.log("DRIVER ERROR: Permission request failed:", error);
      return false;
    }
  }

  // Start driver GPS tracking
  async startDriverTracking(
    busNumber: string,
    driverId: string,
    callback?: (location: DriverLocation) => void
  ): Promise<void> {
    console.log("DRIVER: Starting GPS tracking for bus:", busNumber);

    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied. Cannot start tracking.');
      }

      // Location services will be enabled automatically when needed

      // Start location updates every 5 seconds
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000, // 5 seconds
          distanceInterval: 10, // 10 meters minimum
        },
        async (location) => {
          console.log("DRIVER: Location update received:", {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            speed: location.coords.speed,
            heading: location.coords.heading,
            accuracy: location.coords.accuracy
          });

          const driverLocation: DriverLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            speed: location.coords.speed ? location.coords.speed * 3.6 : undefined, // Convert m/s to km/h
            heading: location.coords.heading || undefined,
            accuracy: location.coords.accuracy || undefined,
            timestamp: Date.now(),
            isActive: true
          };

          // Update Firebase Realtime Database
          const busLocation: BusLocation = {
            ...driverLocation,
            busNumber,
            driverId,
            lastUpdated: Date.now()
          };

          this.busLocationRef = ref(database, `bus_locations/${busNumber}`);
          await set(this.busLocationRef, busLocation);

          console.log("DRIVER: Location updated in Firebase:", busNumber);

          if (callback) {
            callback(driverLocation);
          }
        }
      );

      console.log("DRIVER: GPS tracking started successfully");
    } catch (error) {
      console.log("DRIVER ERROR: Failed to start tracking:", error);
      throw error;
    }
  }

  // Stop driver GPS tracking
  async stopDriverTracking(busNumber: string): Promise<void> {
    console.log("DRIVER: Stopping GPS tracking for bus:", busNumber);

    try {
      // Stop location subscription
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
        console.log("DRIVER: Location subscription stopped");
      }

      // Mark bus as inactive in Firebase
      const busLocationRef = ref(database, `bus_locations/${busNumber}`);
      await set(busLocationRef, null);
      
      console.log("DRIVER: Bus marked as inactive:", busNumber);
    } catch (error) {
      console.log("DRIVER ERROR: Failed to stop tracking:", error);
      throw error;
    }
  }

  // Subscribe to bus location updates (for passengers)
  subscribeToBusLocation(
    busNumber: string,
    callback: (location: BusLocation | null) => void
  ): () => void {
    console.log("DRIVER: Subscribing to bus location:", busNumber);

    const busLocationRef = ref(database, `bus_locations/${busNumber}`);
    
    const unsubscribe = onValue(busLocationRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        console.log("DRIVER: Bus location received:", busNumber);
        callback(data as BusLocation);
      } else {
        console.log("DRIVER: Bus not active:", busNumber);
        callback(null);
      }
    }, (error) => {
      console.log("DRIVER ERROR: Bus location subscription error:", error);
      callback(null);
    });

    // Return unsubscribe function
    return () => {
      console.log("DRIVER: Unsubscribing from bus location:", busNumber);
      off(busLocationRef);
      unsubscribe();
    };
  }

  // Get current driver location (one-time)
  async getCurrentLocation(): Promise<DriverLocation | null> {
    console.log("DRIVER: Getting current location...");

    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const driverLocation: DriverLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        speed: location.coords.speed ? location.coords.speed * 3.6 : undefined,
        heading: location.coords.heading || undefined,
        accuracy: location.coords.accuracy || undefined,
        timestamp: Date.now(),
        isActive: false // One-time location, not active tracking
      };

      console.log("DRIVER: Current location retrieved");
      return driverLocation;
    } catch (error) {
      console.log("DRIVER ERROR: Failed to get current location:", error);
      return null;
    }
  }

  // Check if GPS tracking is active
  isTrackingActive(): boolean {
    return this.locationSubscription !== null;
  }

  // Get tracking status
  getTrackingStatus(): {
    isActive: boolean;
    busNumber?: string;
    lastUpdate?: number;
  } {
    return {
      isActive: this.locationSubscription !== null,
      // Add more status info as needed
    };
  }
}

export default new DriverService();
