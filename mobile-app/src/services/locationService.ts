import { ref, set, onValue, off, DataSnapshot } from 'firebase/database';
import { realtimeDB } from './firebase';
import { LocationData, Bus } from '../types';

export class LocationService {
  private static locationWatchId: number | null = null;
  private static busLocationListener: ((snapshot: DataSnapshot) => void) | null = null;

  static async startLocationTracking(callback: (location: LocationData) => void): Promise<void> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this device');
    }

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now()
        };
        callback(locationData);
      },
      (error) => {
        console.error('Location tracking error:', error);
        throw new Error(`Location tracking failed: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }

  static stopLocationTracking(): void {
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
  }

  static async updateBusLocation(busNumber: string, location: LocationData): Promise<void> {
    try {
      const busLocationRef = ref(realtimeDB, `bus_locations/${busNumber}`);
      await set(busLocationRef, location);
    } catch (error) {
      throw new Error(`Failed to update bus location: ${error}`);
    }
  }

  static subscribeToBusLocation(
    busNumber: string, 
    callback: (location: LocationData) => void
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

  static unsubscribeFromBusLocation(busNumber: string): void {
    if (this.busLocationListener) {
      const busLocationRef = ref(realtimeDB, `bus_locations/${busNumber}`);
      off(busLocationRef, 'value', this.busLocationListener);
      this.busLocationListener = null;
    }
  }

  static async clearBusLocation(busNumber: string): Promise<void> {
    try {
      const busLocationRef = ref(realtimeDB, `bus_locations/${busNumber}`);
      await set(busLocationRef, null);
    } catch (error) {
      throw new Error(`Failed to clear bus location: ${error}`);
    }
  }

  static async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this device'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now()
          });
        },
        (error) => {
          reject(new Error(`Failed to get current location: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

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

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

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
}
