import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { firestore } from './firebase';
import { Bus, Journey, NearbyBus, LocationData } from '../types';
import { LocationService } from './locationService';

export class BusService {
  // Sample bus data for demonstration
  private static sampleBuses: Bus[] = [
    {
      id: 'bus_101',
      busNumber: 'BUS-101',
      driverId: 'driver_1',
      driverName: 'Ramesh Singh',
      isActive: true,
      femalePassengerCount: 5,
      capacity: 50,
      route: ['Stop A', 'Stop B', 'Stop C', 'Stop D', 'Stop E']
    },
    {
      id: 'bus_102',
      busNumber: 'BUS-102',
      driverId: 'driver_2',
      driverName: 'Suresh Kumar',
      isActive: true,
      femalePassengerCount: 8,
      capacity: 45,
      route: ['Stop F', 'Stop G', 'Stop H', 'Stop I']
    },
    {
      id: 'bus_103',
      busNumber: 'BUS-103',
      driverId: 'driver_3',
      driverName: 'Mahesh Patel',
      isActive: false,
      femalePassengerCount: 0,
      capacity: 40,
      route: ['Stop J', 'Stop K', 'Stop L', 'Stop M', 'Stop N']
    }
  ];

  static async initializeSampleBuses(): Promise<void> {
    try {
      for (const bus of this.sampleBuses) {
        await setDoc(doc(firestore, 'buses', bus.id), bus);
      }
    } catch (error) {
      console.error('Error initializing sample buses:', error);
    }
  }

  static async getAllBuses(): Promise<Bus[]> {
    try {
      const busesCollection = collection(firestore, 'buses');
      const querySnapshot = await getDocs(busesCollection);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bus[];
    } catch (error) {
      console.error('Error getting all buses:', error);
      return [];
    }
  }

  static async getActiveBuses(): Promise<Bus[]> {
    try {
      const busesCollection = collection(firestore, 'buses');
      const q = query(busesCollection, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bus[];
    } catch (error) {
      console.error('Error getting active buses:', error);
      return [];
    }
  }

  static async getBusByNumber(busNumber: string): Promise<Bus | null> {
    try {
      const busesCollection = collection(firestore, 'buses');
      const q = query(busesCollection, where('busNumber', '==', busNumber));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const busDoc = querySnapshot.docs[0];
      return {
        id: busDoc.id,
        ...busDoc.data()
      } as Bus;
    } catch (error) {
      console.error('Error getting bus by number:', error);
      return null;
    }
  }

  static async getNearbyBuses(
    userLocation: LocationData,
    maxDistance: number = 5 // 5km radius
  ): Promise<NearbyBus[]> {
    try {
      const activeBuses = await this.getActiveBuses();
      const nearbyBuses: NearbyBus[] = [];

      for (const bus of activeBuses) {
        if (bus.currentLocation) {
          const distance = LocationService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            bus.currentLocation.latitude,
            bus.currentLocation.longitude
          );

          if (distance <= maxDistance) {
            const estimatedArrival = LocationService.estimateArrivalTime(
              bus.currentLocation.latitude,
              bus.currentLocation.longitude,
              userLocation.latitude,
              userLocation.longitude
            );

            const safetyStatus = this.calculateSafetyStatus(bus.femalePassengerCount, bus.capacity);
            const predictedCount = await this.predictFemalePassengerCount(bus.id);

            nearbyBuses.push({
              busNumber: bus.busNumber,
              driverName: bus.driverName,
              distance,
              estimatedArrival,
              femalePassengerCount: bus.femalePassengerCount,
              predictedFemaleCount: predictedCount,
              safetyStatus,
              location: bus.currentLocation
            });
          }
        }
      }

      return nearbyBuses.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error getting nearby buses:', error);
      return [];
    }
  }

  static async updateBusPassengerCount(
    busNumber: string, 
    countChange: number
  ): Promise<void> {
    try {
      const bus = await this.getBusByNumber(busNumber);
      if (!bus) {
        throw new Error('Bus not found');
      }

      const busRef = doc(firestore, 'buses', busNumber);
      await updateDoc(busRef, {
        femalePassengerCount: Math.max(0, bus.femalePassengerCount + countChange),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating passenger count:', error);
      throw error;
    }
  }

  static async updateBusStatus(busNumber: string, isActive: boolean): Promise<void> {
    try {
      const busRef = doc(firestore, 'buses', busNumber);
      await updateDoc(busRef, {
        isActive,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating bus status:', error);
      throw error;
    }
  }

  static async assignBusToDriver(driverId: string, busNumber: string): Promise<void> {
    try {
      const bus = await this.getBusByNumber(busNumber);
      if (!bus) {
        throw new Error('Bus not found');
      }

      await updateDoc(doc(firestore, 'buses', bus.id), {
        driverId,
        isActive: true
      });
    } catch (error) {
      throw new Error(`Failed to assign bus to driver: ${error}`);
    }
  }

  private static calculateSafetyStatus(femaleCount: number, capacity: number): 'low' | 'medium' | 'high' {
    const ratio = femaleCount / capacity;
    
    if (ratio >= 0.3) return 'high';
    if (ratio >= 0.15) return 'medium';
    return 'low';
  }

  private static async predictFemalePassengerCount(busId: string): Promise<number> {
    try {
      // This is a simplified prediction
      // In a real app, you would analyze journey patterns and upcoming stops
      const bus = await getDoc(doc(firestore, 'buses', busId));
      const busData = bus.data() as Bus;
      
      // For now, return current count with some random variation
      const variation = Math.floor(Math.random() * 5) - 2; // -2 to +2
      return Math.max(0, busData.femalePassengerCount + variation);
    } catch (error) {
      console.error('Error predicting passenger count:', error);
      return 0;
    }
  }

  static async createJourney(journeyData: Omit<Journey, 'id'>): Promise<Journey> {
    try {
      const journeyId = `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const journey: Journey = {
        id: journeyId,
        ...journeyData
      };

      await setDoc(doc(firestore, 'journeys', journeyId), journey);
      return journey;
    } catch (error) {
      throw new Error(`Failed to create journey: ${error}`);
    }
  }

  static async completeJourney(journeyId: string, busNumber: string): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'journeys', journeyId), {
        endTime: new Date(),
        status: 'completed'
      });

      await this.updateBusPassengerCount(busNumber, -1);
    } catch (error) {
      throw new Error(`Failed to complete journey: ${error}`);
    }
  }
}
