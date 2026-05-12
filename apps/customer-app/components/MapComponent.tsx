import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';

interface MapProps {
  customerLocation: { latitude: number; longitude: number };
  engineerLocation: { lat: number; lng: number } | null;
}

export default function MapComponent({ customerLocation, engineerLocation }: MapProps) {
  return (
    <MapView 
      style={styles.map}
      initialRegion={{
        ...customerLocation,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <Marker coordinate={customerLocation} title="You are here" pinColor="blue" />
      
      {engineerLocation && (
        <Marker 
          coordinate={{ latitude: engineerLocation.lat, longitude: engineerLocation.lng }} 
          title="Engineer" 
          pinColor="red" 
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: '100%' },
});
