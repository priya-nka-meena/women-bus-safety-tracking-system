export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'passenger' | 'driver' | 'admin' | null;
  emergencyContacts: EmergencyContact[];
  licenseNumber?: string | null;
  assignedBusNumber?: string | null;
  createdAt: Date | any;
  updatedAt: Date | any;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface Bus {
  id: string;
  busNumber: string;
  driverId: string;
  driverName: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
  isActive: boolean;
  femalePassengerCount: number;
  capacity: number;
  route: string[];
}

export interface Journey {
  id: string;
  passengerId: string;
  busNumber: string;
  sourceStop: string;
  destinationStop: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'cancelled';
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  busNumber: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  status: 'active' | 'resolved';
  policeNotified: boolean;
  contactsNotified: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface NearbyBus {
  busNumber: string;
  driverName: string;
  distance: number;
  estimatedArrival: number;
  femalePassengerCount: number;
  predictedFemaleCount: number;
  safetyStatus: 'low' | 'medium' | 'high';
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface AadhaarData {
  aadhaarNumber: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
}

export interface DriverLicenseData {
  licenseNumber: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  expiryDate: string;
  vehicleType: string;
}
