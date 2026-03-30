import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../../services/authService';
import { EmergencyContact } from '../../types';

interface Props {
  navigation: any;
}

const EmergencyContactsScreen: React.FC<Props> = ({ navigation }) => {
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEmergencyContacts();
  }, []);

  const loadEmergencyContacts = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (user?.emergencyContacts) {
        setEmergencyContacts(user.emergencyContacts);
      }
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
      Alert.alert('Error', 'Failed to load emergency contacts');
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
    } else {
      Alert.alert('Error', 'You must have at least one emergency contact');
    }
  };

  const saveEmergencyContacts = async () => {
    // Validate contacts
    const validContacts = emergencyContacts.filter(contact => 
      contact.name && contact.phone && contact.relationship
    );

    if (validContacts.length === 0) {
      Alert.alert('Error', 'Please add at least one complete emergency contact');
      return;
    }

    // Validate phone numbers
    for (const contact of validContacts) {
      if (!/^\d{10}$/.test(contact.phone.replace(/[^0-9]/g, ''))) {
        Alert.alert('Error', `Please enter a valid 10-digit phone number for ${contact.name}`);
        return;
      }
    }

    setSaving(true);
    try {
      const user = await AuthService.getCurrentUser();
      if (user) {
        await AuthService.updateUserProfile(user.id, {
          emergencyContacts: validContacts
        });
        
        Alert.alert('Success', 'Emergency contacts updated successfully!');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving emergency contacts:', error);
      Alert.alert('Error', 'Failed to save emergency contacts');
    } finally {
      setSaving(false);
    }
  };

  const callEmergencyContact = (phone: string) => {
    Alert.alert(
      'Call Emergency Contact',
      `Do you want to call ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log(`Calling ${phone}`) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Contacts</Text>
        <Text style={styles.subtitle}>Manage your emergency contacts</Text>
      </View>

      <ScrollView style={styles.content}>
        {emergencyContacts.map((contact, index) => (
          <View key={contact.id} style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <Text style={styles.contactNumber}>Contact {index + 1}</Text>
              {emergencyContacts.length > 1 && (
                <TouchableOpacity 
                  onPress={() => removeEmergencyContact(index)}
                  style={styles.removeButton}
                >
                  <Ionicons name="remove-circle" size={24} color="#e74c3c" />
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
                onChangeText={(value) => updateEmergencyContact(index, 'phone', value.replace(/[^0-9]/g, ''))}
                keyboardType="phone-pad"
                maxLength={10}
              />
              {contact.phone && contact.phone.length === 10 && (
                <TouchableOpacity 
                  onPress={() => callEmergencyContact(contact.phone)}
                  style={styles.callButton}
                >
                  <Ionicons name="call" size={20} color="#4CAF50" />
                </TouchableOpacity>
              )}
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
          <Ionicons name="add-circle" size={24} color="#e91e63" />
          <Text style={styles.addButtonText}>Add Emergency Contact</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#2196f3" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Important Information</Text>
            <Text style={styles.infoText}>
              • Emergency contacts will be notified when you trigger SOS
            </Text>
            <Text style={styles.infoText}>
              • Make sure phone numbers are correct and reachable
            </Text>
            <Text style={styles.infoText}>
              • Keep contacts updated with your current information
            </Text>
            <Text style={styles.infoText}>
              • At least one contact is required for safety features
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.buttonDisabled]} 
          onPress={saveEmergencyContacts}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Contacts</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    padding: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },
  callButton: {
    padding: 5,
    marginLeft: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e91e63',
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 20,
    gap: 10,
  },
  addButtonText: {
    color: '#e91e63',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    alignItems: 'flex-start',
    gap: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EmergencyContactsScreen;
