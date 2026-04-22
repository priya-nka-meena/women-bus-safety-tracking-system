import { LocationService } from './locationService';
import { BusService } from './busService';
import AuthService from './authService';
import { LocationData, Bus } from '../types';

export class BusTrackingService {
  private static isDriverTracking = false;
  private static trackingCallback: ((location: LocationData) => void) | null = null;

  // Driver: Start duty and location sharing
  static async startDriverDuty(busNumber: string): Promise<void> {
    try {
      // Get current user to verify they're a driver
      const user = await AuthService.getCurrentUser();
      if (!user || user.role !== 'driver') {
        throw new Error('Only drivers can start duty');
      }

      if (!user.assignedBusNumber || user.assignedBusNumber !== busNumber) {
        throw new Error('Bus not assigned to this driver');
      }

      // Check if location services are enabled
      const locationEnabled = await LocationService.isLocationServicesEnabled();
      if (!locationEnabled) {
        throw new Error('Location services are not enabled');
      }

      // Start location tracking
      this.trackingCallback = async (location: LocationData) => {
        try {
          // Update bus location in Firebase Realtime Database
          await LocationService.updateBusLocation(busNumber, location);
          
          // Update bus status in Firestore
          await BusService.updateBusStatus(busNumber, true);
          
          console.log(`Bus ${busNumber} location updated:`, location);
        } catch (error) {
          console.error('Error updating bus location:', error);
        }
      };

      await LocationService.startLocationTracking(this.trackingCallback);
      this.isDriverTracking = true;

      console.log(`Driver duty started for bus ${busNumber}`);
    } catch (error) {
      console.error('Error starting driver duty:', error);
      throw error;
    }
  }

  // Driver: Stop duty and location sharing
  static async stopDriverDuty(busNumber: string): Promise<void> {
    try {
      if (!this.isDriverTracking) {
        console.log('No active tracking to stop');
        return;
      }

      // Stop location tracking
      LocationService.stopLocationTracking();
      this.isDriverTracking = false;
      this.trackingCallback = null;

      // Clear bus location from Firebase
      await LocationService.clearBusLocation(busNumber);

      // Update bus status in Firestore
      await BusService.updateBusStatus(busNumber, false);

      console.log(`Driver duty stopped for bus ${busNumber}`);
    } catch (error) {
      console.error('Error stopping driver duty:', error);
      throw error;
    }
  }

  // Get driver tracking status
  static isTracking(): boolean {
    return this.isDriverTracking;
  }

  // Passenger: Get nearby buses with distances
  static async getNearbyBuses(userLocation?: LocationData): Promise<Array<{
    bus: Bus;
    location: LocationData & { busNumber: string; lastUpdated: number; isActive: boolean };
    distance: number;
    estimatedArrival: number;
  }>> {
    try {
      // Get user location if not provided
      if (!userLocation) {
        userLocation = await LocationService.getCurrentLocation();
      }

      // Get all active bus locations
      const busLocations = await LocationService.getAllBusLocations();
      
      // Get bus details for each location
      const nearbyBuses = [];
      
      for (const busLocation of busLocations) {
        if (!busLocation.isActive) continue;

        try {
          // Get bus details from Firestore
          const bus = await BusService.getBusByNumber(busLocation.busNumber);
          if (!bus) continue;

          // Calculate distance from user to bus
          const distance = LocationService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            busLocation.latitude,
            busLocation.longitude
          );

          // Only include buses within 10km
          if (distance <= 10) {
            // Calculate estimated arrival time
            const estimatedArrival = LocationService.estimateArrivalTime(
              busLocation.latitude,
              busLocation.longitude,
              userLocation.latitude,
              userLocation.longitude
            );

            nearbyBuses.push({
              bus,
              location: busLocation,
              distance,
              estimatedArrival
            });
          }
        } catch (error) {
          console.error(`Error getting details for bus ${busLocation.busNumber}:`, error);
        }
      }

      // Sort by distance
      nearbyBuses.sort((a, b) => a.distance - b.distance);

      return nearbyBuses;
    } catch (error) {
      console.error('Error getting nearby buses:', error);
      throw error;
    }
  }

  // Passenger: Subscribe to live bus location updates
  static subscribeToBusLocation(
    busNumber: string,
    callback: (location: LocationData & { busNumber?: string; lastUpdated?: number; isActive?: boolean }) => void
  ): void {
    LocationService.subscribeToBusLocation(busNumber, callback);
  }

  // Passenger: Unsubscribe from bus location updates
  static unsubscribeFromBusLocation(busNumber: string): void {
    LocationService.unsubscribeFromBusLocation(busNumber);
  }

  // Get bus tracking statistics
  static async getBusTrackingStats(busNumber: string): Promise<{
    totalDistance: number;
    averageSpeed: number;
    trackingDuration: number;
    lastLocation: LocationData | null;
  }> {
    try {
      // This would typically involve tracking data over time
      // For now, return basic info
      const busLocation = await new Promise<any>((resolve) => {
        LocationService.subscribeToBusLocation(busNumber, (location) => {
          resolve(location);
        });
        
        // Unsubscribe after first update
        setTimeout(() => {
          LocationService.unsubscribeFromBusLocation(busNumber);
        }, 1000);
      });

      return {
        totalDistance: 0, // Would calculate from tracking history
        averageSpeed: 0, // Would calculate from tracking history
        trackingDuration: 0, // Would calculate from tracking start time
        lastLocation: busLocation || null
      };
    } catch (error) {
      console.error('Error getting bus tracking stats:', error);
      return {
        totalDistance: 0,
        averageSpeed: 0,
        trackingDuration: 0,
        lastLocation: null
      };
    }
  }

  // Validate bus assignment for driver
  static async validateBusAssignment(driverId: string, busNumber: string): Promise<boolean> {
    try {
      const bus = await BusService.getBusByNumber(busNumber);
      if (!bus) return false;

      // Check if bus is assigned to this driver
      // This would typically involve checking the user document
      const user = await AuthService.getCurrentUser();
      return user?.assignedBusNumber === busNumber;
    } catch (error) {
      console.error('Error validating bus assignment:', error);
      return false;
    }
  }

  // Get all active buses for admin monitoring
  static async getAllActiveBuses(): Promise<Array<{
    bus: Bus;
    location: LocationData & { busNumber: string; lastUpdated: number; isActive: boolean };
    driverInfo: any;
  }>> {
    try {
      const busLocations = await LocationService.getAllBusLocations();
      const activeBuses = [];

      for (const busLocation of busLocations) {
        if (!busLocation.isActive) continue;

        try {
          const bus = await BusService.getBusByNumber(busLocation.busNumber);
          if (!bus) continue;

          // Get driver info (would need to be implemented)
          const driverInfo = null; // Would fetch from users collection

          activeBuses.push({
            bus,
            location: busLocation,
            driverInfo
          });
        } catch (error) {
          console.error(`Error getting details for bus ${busLocation.busNumber}:`, error);
        }
      }

      return activeBuses;
    } catch (error) {
      console.error('Error getting all active buses:', error);
      throw error;
    }
  }
}
