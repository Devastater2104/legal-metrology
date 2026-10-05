import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LogoHeader from '../components/LogoHeader';
import { getAssignedApplications } from '../api';
import { useAuth } from '../context/AuthContext';
import { styles } from '../styles';

function statusTone(status) {
  if (status === 'CERTIFICATE_ISSUED' || status === 'PASSED') return styles.statusGreen;
  if (status === 'FAILED' || status === 'REJECTED') return styles.statusRed;
  return styles.statusBlue;
}

export default function DashboardScreen() {
  const { user, token, signOut } = useAuth();
  const navigation = useNavigation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    setError('');
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await getAssignedApplications(token);
      setApplications(Array.isArray(data) ? data : data?.items || data?.applications || []);
    } catch (e) {
      setError(e.message || 'Unable to load assigned inspections.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pending = applications.filter((a) =>
    !['INSPECTION_COMPLETED', 'PASSED', 'FAILED', 'CERTIFICATE_ISSUED', 'REJECTED'].includes(a.status)
  ).length;
  const completed = applications.filter((a) =>
    ['INSPECTION_COMPLETED', 'PASSED', 'FAILED', 'CERTIFICATE_ISSUED'].includes(a.status)
  ).length;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        <LogoHeader compact />
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>Good day, {user?.name || 'Officer'}</Text>
            <Text style={styles.muted}>Field Inspection Dashboard</Text>
          </View>
          <Pressable onPress={signOut} style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>Logout</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{applications.length}</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Assigned Inspections</Text>

        {loading ? <ActivityIndicator size="large" color="#173f8a" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !applications.length && !error ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No assigned inspections</Text>
            <Text style={styles.muted}>New assignments will appear here.</Text>
          </View>
        ) : null}

        {applications.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => navigation.navigate('ApplicationDetails', { application: item })}
            style={({ pressed }) => [styles.applicationCard, pressed && styles.pressed]}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.applicationTitle}>Application #{item.id}</Text>
              <Text style={[styles.status, statusTone(item.status)]}>{item.status || 'ASSIGNED'}</Text>
            </View>
            <Text style={styles.cardPrimary}>
              {item.instrument?.type || item.instrument_type || item.instrument_name || 'Measuring Instrument'}
            </Text>
            <Text style={styles.cardSecondary}>
              {item.business_name || item.user?.organization || item.organization || 'Business'}
            </Text>
            <Text style={styles.cardSecondary}>
              {item.location || item.shop_address || 'Inspection location not provided'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
