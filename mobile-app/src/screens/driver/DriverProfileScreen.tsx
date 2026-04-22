import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../../services/authService';
import { BusService } from '../../services/busService';
import { User, Bus } from '../../types';

interface Props {
  navigation: any;
}

const DriverProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [assignedBus, setAssignedBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);

      if (currentUser?.assignedBusNumber) {
        const bus = await BusService.getBusByNumber(currentUser.assignedBusNumber);
        setAssignedBus(bus);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Info', 'Edit profile feature coming soon!');
  };

  const handleChangePassword = () => {
    Alert.alert('Info', 'Change password feature coming soon!');
  };

  const handleBusDetails = () => {
    if (assignedBus) {
      Alert.alert(
        'Bus Details',
        `Bus Number: ${assignedBus.busNumber}\nCapacity: ${assignedBus.capacity}\nCurrent Female Passengers: ${assignedBus.femalePassengerCount}\nStatus: ${assignedBus.isActive ? 'Active' : 'Inactive'}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('No Bus Assigned', 'You do not have any bus assigned currently.');
    }
  };

  const handleContactAdmin = () => {
    Alert.alert(
      'Contact Admin',
      'For support, please contact:\n\nEmail: admin@womensafety.com\nPhone: 1800-123-4567\n\nAvailable 24/7 for driver support.'
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Driver Help',
      'Driver App Help:\n\n• Start duty before beginning your route\n• Keep location sharing enabled while on duty\n• End duty when your shift is complete\n• Contact admin for any issues\n\nFor emergencies, call: 1800-123-4567'
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About',
      'Women Bus Safety System v1.0.0\n\nDriver Application\n\nA comprehensive safety solution for public transport.\n\n© 2024 Women Safety Initiative'
    );
  };

  const getDutyStatusColor = () => {
    if (!assignedBus) return '#ccc';
    return assignedBus.isActive ? '#4CAF50' : '#FF9800';
  };

  const getDutyStatusText = () => {
    if (!assignedBus) return 'No Bus Assigned';
    return assignedBus.isActive ? 'On Duty' : 'Off Duty';
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="man" size={80} color="#fff" />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.userPhone}>{user.phone}</Text>
        <View style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
          <Text style={styles.verifiedText}>Verified Driver</Text>
        </View>
      </View>

      {/* Driver Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driver Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>License Number:</Text>
            <Text style={styles.infoValue}>{user.licenseNumber || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>Driver</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, { color: getDutyStatusColor() }]}>
              {getDutyStatusText()}
            </Text>
          </View>
        </View>
      </View>

      {/* Bus Assignment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bus Assignment</Text>
        
        {assignedBus ? (
          <View style={styles.busCard}>
            <View style={styles.busHeader}>
              <View>
                <Text style={styles.busNumber}>{assignedBus.busNumber}</Text>
                <Text style={styles.busCapacity}>Capacity: {assignedBus.capacity}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getDutyStatusColor() }]}>
                <Text style={styles.statusText}>{getDutyStatusText()}</Text>
              </View>
            </View>
            
            <View style={styles.busDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="people" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {assignedBus.femalePassengerCount} female passengers
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="map" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {assignedBus.route.length} stops on route
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={handleBusDetails}
            >
              <Text style={styles.viewDetailsText}>View Full Details</Text>
              <Ionicons name="chevron-forward" size={16} color="#2196f3" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noBusCard}>
            <Ionicons name="bus" size={60} color="#ccc" />
            <Text style={styles.noBusText}>No Bus Assigned</Text>
            <Text style={styles.noBusSubtext}>
              Please wait for admin to assign a bus to your account
            </Text>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleContactAdmin}
            >
              <Text style={styles.contactButtonText}>Contact Admin</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        
        <TouchableOpacity style={styles.actionItem} onPress={handleEditProfile}>
          <View style={styles.actionIcon}>
            <Ionicons name="person" size={24} color="#2196f3" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Edit Profile</Text>
            <Text style={styles.actionSubtitle}>Update your personal information</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={handleChangePassword}>
          <View style={styles.actionIcon}>
            <Ionicons name="lock-closed" size={24} color="#FF9800" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Change Password</Text>
            <Text style={styles.actionSubtitle}>Update your account password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={handleContactAdmin}>
          <View style={styles.actionIcon}>
            <Ionicons name="call" size={24} color="#4CAF50" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Contact Admin</Text>
            <Text style={styles.actionSubtitle}>Get help from support team</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <TouchableOpacity style={styles.actionItem} onPress={handleHelp}>
          <View style={styles.actionIcon}>
            <Ionicons name="help-circle" size={24} color="#2196f3" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Help & Support</Text>
            <Text style={styles.actionSubtitle}>Get help and contact support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={handleAbout}>
          <View style={styles.actionIcon}>
            <Ionicons name="information-circle" size={24} color="#666" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>About</Text>
            <Text style={styles.actionSubtitle}>App version and information</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#f44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
        <Text style={styles.copyrightText}>© 2024 Women Safety Initiative</Text>
      </View>
    </ScrollView>
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
  profileHeader: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 3,
  },
  userPhone: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 15,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 5,
  },
  verifiedText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  busCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  busNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  busCapacity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  busDetails: {
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
    gap: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#2196f3',
    fontWeight: 'bold',
  },
  noBusCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noBusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
  },
  noBusSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f44336',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  copyrightText: {
    fontSize: 12,
    color: '#999',
  },
});

export default DriverProfileScreen;
