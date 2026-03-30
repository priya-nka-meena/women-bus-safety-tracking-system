import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { firestore } from './firebase';
import { SOSAlert, User, LocationData } from '../types';

export class SOSService {
  // Emergency contact numbers
  private static readonly POLICE_HELPLINE = '100';
  private static readonly WOMEN_HELPLINE = '1091';
  private static readonly EMERGENCY_CONTACT_TEMPLATE = `EMERGENCY ALERT! 
User: {userName}
Bus: {busNumber}
Location: {locationLink}
Time: {timestamp}

This is an automated emergency alert from Women Bus Safety System. Please contact immediately.`;

  static async triggerSOS(
    userId: string,
    userName: string,
    userPhone: string,
    busNumber: string,
    location: LocationData
  ): Promise<SOSAlert> {
    try {
      const sosId = `sos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const sosAlert: SOSAlert = {
        id: sosId,
        userId,
        userName,
        userPhone,
        busNumber,
        location,
        timestamp: new Date(),
        status: 'active',
        policeNotified: false,
        contactsNotified: false
      };

      // Save SOS alert to Firestore
      await setDoc(doc(firestore, 'sos_alerts', sosId), sosAlert);

      // Send alerts asynchronously
      this.sendPoliceAlert(sosAlert);
      this.sendEmergencyContactAlerts(userId, sosAlert);

      return sosAlert;
    } catch (error) {
      throw new Error(`Failed to trigger SOS: ${error}`);
    }
  }

  private static async sendPoliceAlert(sosAlert: SOSAlert): Promise<void> {
    try {
      const locationLink = `https://maps.google.com/?q=${sosAlert.location.latitude},${sosAlert.location.longitude}`;
      const message = this.EMERGENCY_CONTACT_TEMPLATE
        .replace('{userName}', sosAlert.userName)
        .replace('{busNumber}', sosAlert.busNumber)
        .replace('{locationLink}', locationLink)
        .replace('{timestamp}', sosAlert.timestamp.toLocaleString());

      // In a real implementation, you would use Twilio API here
      console.log('POLICE ALERT:', message);
      console.log('Sending SMS to:', this.POLICE_HELPLINE);
      console.log('Sending SMS to:', this.WOMEN_HELPLINE);

      // Mark police as notified
      await updateDoc(doc(firestore, 'sos_alerts', sosAlert.id), {
        policeNotified: true
      });
    } catch (error) {
      console.error('Error sending police alert:', error);
    }
  }

  private static async sendEmergencyContactAlerts(userId: string, sosAlert: SOSAlert): Promise<void> {
    try {
      // Get user's emergency contacts
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      const userData = userDoc.data() as User;
      
      if (!userData.emergencyContacts || userData.emergencyContacts.length === 0) {
        console.warn('No emergency contacts found for user:', userId);
        return;
      }

      const locationLink = `https://maps.google.com/?q=${sosAlert.location.latitude},${sosAlert.location.longitude}`;
      const message = this.EMERGENCY_CONTACT_TEMPLATE
        .replace('{userName}', sosAlert.userName)
        .replace('{busNumber}', sosAlert.busNumber)
        .replace('{locationLink}', locationLink)
        .replace('{timestamp}', sosAlert.timestamp.toLocaleString());

      // Send SMS to each emergency contact
      for (const contact of userData.emergencyContacts) {
        console.log('EMERGENCY CONTACT ALERT:', message);
        console.log('Sending SMS to:', contact.phone, `(${contact.name})`);
        
        // In a real implementation, you would use Twilio API here
        // await twilioClient.messages.create({
        //   body: message,
        //   from: YOUR_TWILIO_PHONE_NUMBER,
        //   to: contact.phone
        // });
      }

      // Mark contacts as notified
      await updateDoc(doc(firestore, 'sos_alerts', sosAlert.id), {
        contactsNotified: true
      });
    } catch (error) {
      console.error('Error sending emergency contact alerts:', error);
    }
  }

  static async getAllSOSAlerts(): Promise<SOSAlert[]> {
    try {
      const sosCollection = collection(firestore, 'sos_alerts');
      const querySnapshot = await getDocs(sosCollection);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SOSAlert[];
    } catch (error) {
      console.error('Error getting SOS alerts:', error);
      return [];
    }
  }

  static async getActiveSOSAlerts(): Promise<SOSAlert[]> {
    try {
      const sosCollection = collection(firestore, 'sos_alerts');
      const q = query(sosCollection, where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SOSAlert[];
    } catch (error) {
      console.error('Error getting active SOS alerts:', error);
      return [];
    }
  }

  static async resolveSOSAlert(sosId: string): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'sos_alerts', sosId), {
        status: 'resolved'
      });
    } catch (error) {
      throw new Error(`Failed to resolve SOS alert: ${error}`);
    }
  }

  static async getUserSOSHistory(userId: string): Promise<SOSAlert[]> {
    try {
      const sosCollection = collection(firestore, 'sos_alerts');
      const q = query(sosCollection, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SOSAlert[];
    } catch (error) {
      console.error('Error getting user SOS history:', error);
      return [];
    }
  }

  // Simulate SMS sending for development
  static async sendTestSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      console.log('=== TEST SMS ===');
      console.log('To:', phoneNumber);
      console.log('Message:', message);
      console.log('================');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Error sending test SMS:', error);
      return false;
    }
  }
}
