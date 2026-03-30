import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BusService } from '../../services/busService';
import { LocationService } from '../../services/locationService';
import { NearbyBus, LocationData } from '../../types';

interface Props {
  navigation: any;
}

const sampleStops = [
  'Stop A - Main Street',
  'Stop B - Park Avenue',
  'Stop C - City Center',
  'Stop D - Market Square',
  'Stop E - Railway Station',
  'Stop F - Hospital',
  'Stop G - University',
  'Stop H - Shopping Mall',
  'Stop I - Airport',
  'Stop J - Bus Terminal'
];

const JourneyInputScreen: React.FC<Props> = ({ navigation }) => {
  const [sourceStop, setSourceStop] = useState('');
  const [destinationStop, setDestinationStop] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [nearbyBuses, setNearbyBuses] = useState<NearbyBus[]>([]);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [filteredSourceStops, setFilteredSourceStops] = useState<string[]>([]);
  const [filteredDestinationStops, setFilteredDestinationStops] = useState<string[]>([]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    setFilteredSourceStops(
      sampleStops.filter(stop => stop.toLowerCase().includes(sourceStop.toLowerCase()))
    );
  }, [sourceStop]);

  useEffect(() => {
    setFilteredDestinationStops(
      sampleStops.filter(stop => stop.toLowerCase().includes(destinationStop.toLowerCase()))
    );
  }, [destinationStop]);

  const getCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location. Please enable location services.');
    }
  };

  const handleSearchBuses = async () => {
    if (!sourceStop || !destinationStop) {
      Alert.alert('Error', 'Please enter both source and destination stops');
      return;
    }

    if (sourceStop === destinationStop) {
      Alert.alert('Error', 'Source and destination cannot be the same');
      return;
    }

    setLoading(true);
    try {
      if (!userLocation) {
        await getCurrentLocation();
      }

      const buses = await BusService.getNearbyBuses(userLocation!);
      setNearbyBuses(buses);

      if (buses.length === 0) {
        Alert.alert('No Buses', 'No buses found near your location. Please try again later.');
      } else {
        navigation.navigate('NearbyBuses', {
          userLocation,
          sourceStop,
          destinationStop,
          buses
        });
      }
    } catch (error) {
      console.error('Error searching buses:', error);
      Alert.alert('Error', 'Failed to search for buses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStop = (stop: string, type: 'source' | 'destination') => {
    if (type === 'source') {
      setSourceStop(stop);
      setShowSourceModal(false);
    } else {
      setDestinationStop(stop);
      setShowDestinationModal(false);
    }
  };

  const swapStops = () => {
    const temp = sourceStop;
    setSourceStop(destinationStop);
    setDestinationStop(temp);
  };

  const getSafetyStatusColor = (status: string) => {
    switch (status) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#f44336';
      default: return '#666';
    }
  };

  const getSafetyStatusText = (status: string) => {
    switch (status) {
      case 'high': return 'Safe';
      case 'medium': return 'Moderate';
      case 'low': return 'Caution';
      default: return 'Unknown';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="bus" size={40} color="#e91e63" />
          <Text style={styles.title}>Plan Your Journey</Text>
          <Text style={styles.subtitle}>Enter your source and destination</Text>
        </View>

        {/* Journey Input */}
        <View style={styles.journeyCard}>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color="#4CAF50" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter Source Stop"
              value={sourceStop}
              onChangeText={setSourceStop}
              onFocus={() => setShowSourceModal(true)}
            />
            <TouchableOpacity onPress={() => setShowSourceModal(true)}>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.swapButton} onPress={swapStops}>
            <Ionicons name="swap-vertical" size={24} color="#e91e63" />
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Ionicons name="flag" size={20} color="#f44336" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter Destination Stop"
              value={destinationStop}
              onChangeText={setDestinationStop}
              onFocus={() => setShowDestinationModal(true)}
            />
            <TouchableOpacity onPress={() => setShowDestinationModal(true)}>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.searchButton, loading && styles.buttonDisabled]} 
            onPress={handleSearchBuses}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.searchButtonText}>Search Buses</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Popular Routes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Routes</Text>
          <View style={styles.routesContainer}>
            {[
              { from: 'Stop A - Main Street', to: 'Stop E - Railway Station' },
              { from: 'Stop C - City Center', to: 'Stop I - Airport' },
              { from: 'Stop G - University', to: 'Stop D - Market Square' }
            ].map((route, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.routeCard}
                onPress={() => {
                  setSourceStop(route.from);
                  setDestinationStop(route.to);
                }}
              >
                <View style={styles.routeInfo}>
                  <Text style={styles.routeText}>{route.from}</Text>
                  <Ionicons name="arrow-down" size={16} color="#666" />
                  <Text style={styles.routeText}>{route.to}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#e91e63" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Information</Text>
          <View style={styles.safetyInfo}>
            <View style={styles.safetyItem}>
              <View style={[styles.safetyIndicator, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.safetyLabel}>High Safety</Text>
              <Text style={styles.safetyDescription}>30%+ female passengers</Text>
            </View>
            <View style={styles.safetyItem}>
              <View style={[styles.safetyIndicator, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.safetyLabel}>Moderate Safety</Text>
              <Text style={styles.safetyDescription}>15-30% female passengers</Text>
            </View>
            <View style={styles.safetyItem}>
              <View style={[styles.safetyIndicator, { backgroundColor: '#f44336' }]} />
              <Text style={styles.safetyLabel}>Low Safety</Text>
              <Text style={styles.safetyDescription}>&lt;15% female passengers</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Source Stop Modal */}
      <Modal
        visible={showSourceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSourceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Source Stop</Text>
              <TouchableOpacity onPress={() => setShowSourceModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {filteredSourceStops.map((stop, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => handleSelectStop(stop, 'source')}
                >
                  <Ionicons name="location" size={20} color="#4CAF50" />
                  <Text style={styles.modalItemText}>{stop}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Destination Stop Modal */}
      <Modal
        visible={showDestinationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDestinationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Destination Stop</Text>
              <TouchableOpacity onPress={() => setShowDestinationModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {filteredDestinationStops.map((stop, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => handleSelectStop(stop, 'destination')}
                >
                  <Ionicons name="flag" size={20} color="#f44336" />
                  <Text style={styles.modalItemText}>{stop}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
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
  },
  journeyCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },
  swapButton: {
    alignSelf: 'center',
    padding: 10,
    marginVertical: 5,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e91e63',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 10,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  routesContainer: {
    gap: 10,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeInfo: {
    flex: 1,
    gap: 5,
  },
  routeText: {
    fontSize: 14,
    color: '#333',
  },
  safetyInfo: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    gap: 15,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  safetyIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  safetyLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  safetyDescription: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 15,
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});

export default JourneyInputScreen;
