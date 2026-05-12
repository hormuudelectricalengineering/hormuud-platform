import React from 'react';
import { View, Text } from 'react-native';

const MapView = ({ children, style }) => (
  <View style={[{ backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }, style]}>
    <Text>Map View Placeholder (Web)</Text>
    {children}
  </View>
);

const Marker = ({ children }) => <View>{children}</View>;
const Callout = ({ children }) => <View>{children}</View>;
const Polyline = () => null;
const Circle = () => null;
const Polygon = () => null;

export { Marker, Callout, Polyline, Circle, Polygon };
export default MapView;
