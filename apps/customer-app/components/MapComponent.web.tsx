import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MapProps {
  customerLocation: { latitude: number; longitude: number };
  engineerLocation: { lat: number; lng: number } | null;
}

export default function MapComponent({ engineerLocation }: MapProps) {
  return (
    <View style={styles.placeholder}>
      <Text style={{ fontWeight: 'bold' }}>Map Tracking (Mogadishu)</Text>
      <Text style={{ textAlign: 'center', marginTop: 10 }}>
        Map markers are only visible on Android/iOS in this pilot.
      </Text>
      {engineerLocation && (
        <Text style={{ color: 'green', marginTop: 10 }}>
          Engineer is LIVE at {engineerLocation.lat.toFixed(4)}, {engineerLocation.lng.toFixed(4)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
