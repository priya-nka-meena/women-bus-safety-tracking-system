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
import { EmergencyContact } from '../../types';

interface Props {
  navigation: any;
  route: any;
}

const AadhaarVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userData, role } = route.params || {};
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [aadhaarData, setAadhaarData] = useState<any>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: '1', name: '', phone: '', relationship: '' }
  ]);

  const handleVerifyAadhaar = async () => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      Alert.alert('Error', 'Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setLoading(true);
    try {
      const data = await AuthService.verifyAadhaar(aadhaarNumber);
      if (!data) {
        Alert.alert('Verification Failed', 'Aadhaar number not found in database');
        return;
      }

      if (data.gender !== 'Female') {
        Alert.alert('Verification Failed', 'Only female passengers can register for safety features');
        return;
      }

      setAadhaarData(data);
      setVerified(true);
      Alert.alert('Success', 'Aadhaar verified successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const addEmergencyContact = () => {
    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      name: '',
      phone: '',
      relationship: ''
    };
    setEmergencyContacts([...emergencyContacts, newContact]);
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const updatedContacts = [...emergencyContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setEmergencyContacts(updatedContacts);
  };

  const removeEmergencyContact = (index: number) => {
    if (emergencyContacts.length > 1) {
      const updatedContacts = emergencyContacts.filter((_, i) => i !== index);
      setEmergencyContacts(updatedContacts);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!verified) {
      Alert.alert('Error', 'Please verify your Aadhaar first');
      return;
    }

    // Validate emergency contacts
    const validContacts = emergencyContacts.filter(contact => 
      contact.name && contact.phone && contact.relationship
    );

    if (validContacts.length === 0) {
      Alert.alert('Error', 'Please add at least one emergency contact');
      return;
    }

    setLoading(true);
    try {
      const user = await AuthService.signUp(userData.email, userData.password, {
        name: userData.name,
        phone: userData.phone,
        role: role,
        aadhaarNumber: aadhaarNumber,
        emergencyContacts: validContacts
      });

      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.replace('PassengerTabs')
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
            <Ionicons name="shield-checkmark" size={60} color="#e91e63" />
            <Text style={styles.title}>Aadhaar Verification</Text>
            <Text style={styles.subtitle}>Verify your identity for safety features</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="card" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter 12-digit Aadhaar Number"
                value={aadhaarNumber}
                onChangeText={(text) => setAadhaarNumber(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={12}
                editable={!verified}
              />
            </View>

            {!verified ? (
              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleVerifyAadhaar}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify Aadhaar</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.verifiedContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.verifiedText}>Verified</Text>
                <Text style={styles.verifiedName}>{aadhaarData.name}</Text>
              </View>
            )}

            {verified && (
              <>
                <Text style={styles.sectionTitle}>Emergency Contacts</Text>
                {emergencyContacts.map((contact, index) => (
                  <View key={contact.id} style={styles.contactCard}>
                    <View style={styles.contactHeader}>
                      <Text style={styles.contactNumber}>Contact {index + 1}</Text>
                      {emergencyContacts.length > 1 && (
                        <TouchableOpacity 
                          onPress={() => removeEmergencyContact(index)}
                          style={styles.removeButton}
                        >
                          <Ionicons name="remove-circle" size={20} color="#e74c3c" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Contact Name"
                        value={contact.name}
                        onChangeText={(value) => updateEmergencyContact(index, 'name', value)}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Ionicons name="call" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        value={contact.phone}
                        onChangeText={(value) => updateEmergencyContact(index, 'phone', value)}
                        keyboardType="phone-pad"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Ionicons name="people" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Relationship (e.g., Mother, Husband)"
                        value={contact.relationship}
                        onChangeText={(value) => updateEmergencyContact(index, 'relationship', value)}
                      />
                    </View>
                  </View>
                ))}

                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={addEmergencyContact}
                >
                  <Ionicons name="add-circle" size={20} color="#e91e63" />
                  <Text style={styles.addButtonText}>Add Emergency Contact</Text>
                </TouchableOpacity>

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
    backgroundColor: '#e91e63',
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
  verifiedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 10,
  },
  verifiedName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 30,
    marginBottom: 15,
  },
  contactCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    padding: 5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e91e63',
    marginTop: 10,
  },
  addButtonText: {
    color: '#e91e63',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    marginTop: 20,
  },
});

export default AadhaarVerificationScreen;
