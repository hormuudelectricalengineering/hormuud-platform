import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useJobStore } from '../../store/jobStore';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { LoadingSpinner } from '../../components/ui';
import { createClient } from '@supabase/supabase-js';
import * as Location from 'expo-location';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  base_price: number | null;
  icon_url: string | null;
}

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  snowflake: 'snow',
  thermometer: 'thermometer',
  tool: 'construct',
  zap: 'flash',
  grid: 'grid',
  sun: 'sunny',
  'sun-dim': 'sunny',
  loader: 'timer',
  fuel: 'flame',
  shield: 'shield-checkmark',
};

const TIME_OPTIONS = [
  { id: 'asap', label: 'ASAP', description: 'Within 30 minutes' },
  { id: '1hour', label: 'In 1 Hour', description: 'Schedule for later' },
  { id: '3hours', label: 'In 3 Hours', description: 'Schedule for later' },
  { id: 'schedule', label: 'Schedule', description: 'Pick a date & time' },
];

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const setActiveJob = useJobStore((state) => state.setActiveJob);

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState('asap');
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchingServices, setFetchingServices] = useState(true);

  useEffect(() => {
    fetchServices();
    getCurrentLocation();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    setServices(data || []);
    setFetchingServices(false);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is needed');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        address: address.street ? `${address.street}, ${address.subregion}` : 'Mogadishu, Somalia',
      });
    } catch {
      setLocation({ lat: 2.0469, lng: 45.3182, address: 'Mogadishu, Somalia' });
    }
  };

  const handleOrderService = async () => {
    if (!selectedService) {
      Alert.alert('Error', 'Please select a service');
      return;
    }
    if (!location) {
      Alert.alert('Error', 'Please enable location services');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('jobs').insert({
        customer_id: user?.id,
        service_id: selectedService,
        service_category: services.find((s) => s.id === selectedService)?.name || 'unknown',
        status: 'pending',
        address: location.address,
        latitude: location.lat,
        longitude: location.lng,
        lat: location.lat,
        lng: location.lng,
        time_preference: selectedTime,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setActiveJob(selectedService, 'pending');
        Alert.alert('Order Placed', 'Your service request has been submitted. An admin will assign an engineer shortly.', [
          { text: 'OK', onPress: () => router.push('/(tabs)/orders') },
        ]);
        setSelectedService(null);
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceData = services.find((s) => s.id === selectedService);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.full_name || 'Customer'}</Text>
          <Text style={styles.subGreeting}>Order an electrical service</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchServices(); setRefreshing(false); }} />}
      >
        <View style={styles.locationCard}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.locationText}>{location?.address || 'Getting location...'}</Text>
            <TouchableOpacity onPress={getCurrentLocation}>
              <Ionicons name="refresh" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Available Services</Text>
        {fetchingServices ? (
          <LoadingSpinner />
        ) : (
          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceCard, selectedService === service.id && styles.serviceCardSelected]}
                onPress={() => setSelectedService(service.id)}
              >
                <View style={[styles.serviceIcon, selectedService === service.id && styles.serviceIconSelected]}>
                  <Ionicons
                    name={ICON_MAP[service.icon_url || ''] || 'flash'}
                    size={24}
                    color={selectedService === service.id ? colors.background : colors.primary}
                  />
                </View>
                <Text style={[styles.serviceName, selectedService === service.id && styles.serviceNameSelected]}>
                  {service.name}
                </Text>
                {service.base_price && (
                  <Text style={styles.servicePrice}>${service.base_price.toFixed(2)}</Text>
                )}
                {service.description && (
                  <Text style={styles.serviceDesc} numberOfLines={1}>{service.description}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Time Preference</Text>
        <View style={styles.timeOptions}>
          {TIME_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.timeOption, selectedTime === option.id && styles.timeOptionSelected]}
              onPress={() => setSelectedTime(option.id)}
            >
              <View style={styles.radioOuter}>
                {selectedTime === option.id && <View style={styles.radioInner} />}
              </View>
              <View style={styles.timeOptionContent}>
                <Text style={[styles.timeOptionLabel, selectedTime === option.id && styles.timeOptionLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={styles.timeOptionDesc}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {selectedServiceData && selectedServiceData.base_price && (
          <View style={styles.estimateCard}>
            <Text style={styles.estimateTitle}>Estimated Price</Text>
            <Text style={styles.estimatePrice}>${selectedServiceData.base_price.toFixed(2)}</Text>
            <Text style={styles.estimateNote}>Final price may vary</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.orderButton, (!selectedService || loading) && styles.orderButtonDisabled]}
          onPress={handleOrderService}
          disabled={!selectedService || loading}
        >
          {loading ? (
            <LoadingSpinner size="small" />
          ) : (
            <>
              <Ionicons name="flash" size={20} color={colors.background} />
              <Text style={styles.orderButtonText}>Place Order</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: spacing.md, backgroundColor: colors.background },
  greeting: { ...typography.heading2, color: colors.text },
  subGreeting: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  content: { flex: 1, paddingHorizontal: spacing.md },
  locationCard: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, marginBottom: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { flex: 1, marginLeft: spacing.sm, ...typography.bodySmall, color: colors.text },
  sectionTitle: { ...typography.body, fontWeight: '600', color: colors.text, marginBottom: spacing.sm + 4, marginTop: spacing.sm },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: 20 },
  serviceCard: { width: '47%', backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, borderWidth: 2, borderColor: 'transparent' },
  serviceCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '20' },
  serviceIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  serviceIconSelected: { backgroundColor: colors.primary },
  serviceName: { ...typography.caption, fontWeight: '500', color: colors.text, marginBottom: 2 },
  serviceNameSelected: { color: colors.primary },
  servicePrice: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  serviceDesc: { fontSize: 10, color: colors.textTertiary },
  timeOptions: { backgroundColor: colors.background, borderRadius: 12, padding: 4, marginBottom: 20 },
  timeOption: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm + 4, borderRadius: 8 },
  timeOptionSelected: { backgroundColor: colors.primaryLight + '20' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm + 4 },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  timeOptionContent: { flex: 1 },
  timeOptionLabel: { ...typography.bodySmall, fontWeight: '500', color: colors.text },
  timeOptionLabelSelected: { color: colors.primary },
  timeOptionDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  estimateCard: { backgroundColor: colors.primary, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20 },
  estimateTitle: { ...typography.bodySmall, color: colors.background, opacity: 0.8 },
  estimatePrice: { fontSize: 32, fontWeight: 'bold', color: colors.background, marginVertical: spacing.sm },
  estimateNote: { ...typography.caption, color: colors.background, opacity: 0.6 },
  orderButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 100 },
  orderButtonDisabled: { opacity: 0.5 },
  orderButtonText: { color: colors.background, ...typography.body, fontWeight: '600', marginLeft: spacing.sm },
});
