import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { User, AadhaarData, DriverLicenseData } from '../types';

// Simulated databases
const aadhaarDatabase: AadhaarData[] = [
  {
    aadhaarNumber: "123456789012",
    name: "Priya meena",
    gender: "Female",
    dateOfBirth: "1995-06-15"
  },
  {
    aadhaarNumber: "987654321098",
    name: "Anita Patel",
    gender: "Female",
    dateOfBirth: "1998-03-22"
  },
  {
    aadhaarNumber: "456789012345",
    name: "Rahul Kumar",
    gender: "Male",
    dateOfBirth: "1992-11-08"
  }
];

const licenseDatabase: DriverLicenseData[] = [
  {
    licenseNumber: "DL2023001",
    name: "Ramesh Singh",
    gender: "Male",
    expiryDate: "2028-12-31",
    vehicleType: "Bus"
  },
  {
    licenseNumber: "DL2023002",
    name: "Suresh Kumar",
    gender: "Male",
    expiryDate: "2029-06-30",
    vehicleType: "Bus"
  },
  {
    licenseNumber: "DL2023003",
    name: "Mahesh Patel",
    gender: "Male",
    expiryDate: "2027-09-15",
    vehicleType: "Bus"
  }
];

export class AuthService {
  static async signUp(email: string, password: string, userData: Partial<User>): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: userData.name || '',
        phone: userData.phone || '',
        role: userData.role as 'passenger' | 'driver' | 'admin',
        aadhaarNumber: userData.aadhaarNumber,
        licenseNumber: userData.licenseNumber,
        emergencyContacts: userData.emergencyContacts || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(firestore, 'users', firebaseUser.uid), newUser);
      return newUser;
    } catch (error) {
      throw new Error(`Sign up failed: ${error}`);
    }
  }

  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      return userDoc.data() as User;
    } catch (error) {
      throw new Error(`Sign in failed: ${error}`);
    }
  }

  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error(`Sign out failed: ${error}`);
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    try {
      const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
      if (!userDoc.exists()) return null;

      return userDoc.data() as User;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async verifyAadhaar(aadhaarNumber: string): Promise<AadhaarData | null> {
    return aadhaarDatabase.find(data => data.aadhaarNumber === aadhaarNumber) || null;
  }

  static async verifyLicense(licenseNumber: string): Promise<DriverLicenseData | null> {
    return licenseDatabase.find(data => data.licenseNumber === licenseNumber) || null;
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'users', userId), {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Profile update failed: ${error}`);
    }
  }
}
