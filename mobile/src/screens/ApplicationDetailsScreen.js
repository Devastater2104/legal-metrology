import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { styles } from '../styles';

function value(...values) {
  return values.find((v) => v !== undefined && v !== null && v !== '') || '-';
}

export default function ApplicationDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const app = route.params?.application || {};

  const address = value(app.location, app.shop_address, app.instrument?.location);
  const phone = value(app.user?.phone, app.phone, app.business_phone);

  async function openMaps() {
    const lat = app.latitude ?? app.shop_latitude;
    const lng = app.longitude ?? app.shop_longitude;
    if (lat != null && lng != null) {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      await Linking.openURL(url);
      return;
    }
    Alert.alert('Location unavailable', 'This application does not contain coordinates for navigation.');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Application #{app.id}</Text>
      <Text style={styles.muted}>Inspection assignment details</Text>

      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>Business</Text>
        <Text style={styles.detailValue}>{value(app.business_name, app.user?.organization, app.organization)}</Text>
        <Text style={styles.detailLabel}>Address</Text>
        <Text style={styles.detailValue}>{address}</Text>
        <Text style={styles.detailLabel}>Phone</Text>
        <Text style={styles.detailValue}>{phone}</Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>Instrument</Text>
        <Text style={styles.detailLabel}>Type</Text>
        <Text style={styles.detailValue}>{value(app.instrument?.type, app.instrument_type)}</Text>
        <Text style={styles.detailLabel}>Manufacturer</Text>
        <Text style={styles.detailValue}>{value(app.instrument?.manufacturer, app.manufacturer)}</Text>
        <Text style={styles.detailLabel}>Model</Text>
        <Text style={styles.detailValue}>{value(app.instrument?.model, app.model)}</Text>
        <Text style={styles.detailLabel}>Serial number</Text>
        <Text style={styles.detailValue}>{value(app.instrument?.serial_number, app.serial_number)}</Text>
        <Text style={styles.detailLabel}>Capacity</Text>
        <Text style={styles.detailValue}>{value(app.instrument?.capacity, app.capacity)}</Text>
        <Text style={styles.detailLabel}>Class / accuracy</Text>
        <Text style={styles.detailValue}>{value(app.instrument?.accuracy_class, app.accuracy_class)}</Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>Application</Text>
        <Text style={styles.detailLabel}>Status</Text>
        <Text style={styles.detailValue}>{value(app.status)}</Text>
        <Text style={styles.detailLabel}>Priority</Text>
        <Text style={styles.detailValue}>{value(app.priority)}</Text>
        <Text style={styles.detailLabel}>Scheduled at</Text>
        <Text style={styles.detailValue}>{value(app.scheduled_at)}</Text>
      </View>

      <Pressable onPress={openMaps} style={styles.outlineLargeButton}>
        <Text style={styles.outlineLargeButtonText}>Open Location</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Inspection', { application: app })}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>Start Inspection</Text>
      </Pressable>
    </ScrollView>
  );
}
