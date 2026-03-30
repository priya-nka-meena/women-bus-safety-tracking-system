import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../../services/authService';

interface Props {
  navigation: any;
  route: any;
}

const LicenseVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userData, role } = route.params || {};
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [licenseData, setLicenseData] = useState<any>(null);

  const handleVerifyLicense = async () => {
    if (!licenseNumber || licenseNumber.length < 8) {
      Alert.alert('Error', 'Please enter a valid license number');
      return;
    }

    setLoading(true);
    try {
      const data = await AuthService.verifyLicense(licenseNumber);
      if (!data) {
        Alert.alert('Verification Failed', 'License number not found in database');
        return;
      }

      // Check if license is expired
      const expiryDate = new Date(data.expiryDate);
      const today = new Date();
      if (expiryDate < today) {
        Alert.alert('Verification Failed', 'License has expired');
        return;
      }

      setLicenseData(data);
      setVerified(true);
      Alert.alert('Success', 'License verified successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!verified) {
      Alert.alert('Error', 'Please verify your license first');
      return;
    }

    setLoading(true);
    try {
      const user = await AuthService.signUp(userData.email, userData.password, {
        name: userData.name,
        phone: userData.phone,
        role: role,
        licenseNumber: licenseNumber
      });

      Alert.alert('Success', 'Account created successfully! Please wait for admin to assign a bus.', [
        {
          text: 'OK',
          onPress: () => navigation.replace('DriverTabs')
        }
      ]);
    } catch (error) {
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="car" size={60} color="#2196f3" />
            <Text style={styles.title}>License Verification</Text>
            <Text style={styles.subtitle}>Verify your driver license</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="card" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter License Number (e.g., DL2023001)"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                autoCapitalize="characters"
                editable={!verified}
              />
            </View>

            {!verified ? (
              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleVerifyLicense}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify License</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.verifiedContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <View style={styles.licenseDetails}>
                  <Text style={styles.verifiedText}>License Verified</Text>
                  <Text style={styles.licenseName}>{licenseData.name}</Text>
                  <Text style={styles.licenseInfo}>Vehicle Type: {licenseData.vehicleType}</Text>
                  <Text style={styles.licenseInfo}>Expires: {licenseData.expiryDate}</Text>
                </View>
              </View>
            )}

            {verified && (
              <>
                <View style={styles.infoCard}>
                  <Ionicons name="information-circle" size={24} color="#2196f3" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>Next Steps</Text>
                    <Text style={styles.infoText}>
                      After registration, an administrator will assign a bus to your account. 
                      You will receive a notification once your bus is assigned.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.button, styles.completeButton, loading && styles.buttonDisabled]} 
                  onPress={handleCompleteRegistration}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Complete Registration</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.demoInfo}>
            <Text style={styles.demoTitle}>Demo License Numbers:</Text>
            <Text style={styles.demoText}>DL2023001 - Ramesh Singh</Text>
            <Text style={styles.demoText}>DL2023002 - Suresh Kumar</Text>
            <Text style={styles.demoText}>DL2023003 - Mahesh Patel</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2196f3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  licenseDetails: {
    marginLeft: 15,
    flex: 1,
  },
  verifiedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  licenseName: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  licenseInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'flex-start',
  },
  infoContent: {
    marginLeft: 10,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    marginTop: 20,
  },
  demoInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#fff3e0',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});

export default LicenseVerificationScreen;
