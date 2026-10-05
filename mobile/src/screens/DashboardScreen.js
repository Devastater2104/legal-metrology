import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LogoHeader from '../components/LogoHeader';
import { getAssignedApplications } from '../api';
import { useAuth } from '../context/AuthContext';
import { styles } from '../styles';

function statusTone(status) {
  if (status === 'CERTIFICATE_ISSUED' || status === 'PASSED') {
    return styles.statusGreen;
  }

  if (status === 'FAILED' || status === 'REJECTED') {
    return styles.statusRed;
  }

  return styles.statusBlue;
}

function getShop(application) {
  return application?.shop || {};
}

function getShopName(application) {
  const shop = getShop(application);

  return (
    shop.name ||
    application?.business_name ||
    application?.user?.organization ||
    application?.organization ||
    'Business / Shop'
  );
}

function getShopAddress(application) {
  const shop = getShop(application);

  return (
    shop.address ||
    application?.shop_address ||
    application?.location ||
    'Inspection location not provided'
  );
}

function getShopGst(application) {
  const shop = getShop(application);

  return shop.gst_number || application?.shop_gst_number || '';
}

function getShopLatitude(application) {
  const shop = getShop(application);

  return (
    shop.latitude ??
    application?.shop_latitude ??
    application?.latitude ??
    null
  );
}

function getShopLongitude(application) {
  const shop = getShop(application);

  return (
    shop.longitude ??
    application?.shop_longitude ??
    application?.longitude ??
    null
  );
}

function getInstrument(application) {
  return application?.instrument || {};
}

function getInstrumentName(application) {
  const instrument = getInstrument(application);

  return (
    instrument.instrument_type ||
    instrument.type ||
    application?.instrument_type ||
    application?.instrument_name ||
    'Measuring Instrument'
  );
}

function getSerialNumber(application) {
  const instrument = getInstrument(application);

  return instrument.serial_number || application?.serial_number || '-';
}

function getModel(application) {
  const instrument = getInstrument(application);

  return instrument.model || application?.model || '';
}

export default function DashboardScreen() {
  const { user, token, signOut } = useAuth();
  const navigation = useNavigation();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);

  const load = useCallback(
    async (refresh = false) => {
      setError('');

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const data = await getAssignedApplications(token);

        setApplications(
          Array.isArray(data)
            ? data
            : data?.items || data?.applications || [],
        );
      } catch (e) {
        setError(e.message || 'Unable to load assigned inspections.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const pending = applications.filter(
    (application) =>
      ![
        'INSPECTION_COMPLETED',
        'PASSED',
        'FAILED',
        'CERTIFICATE_ISSUED',
        'REJECTED',
      ].includes(application.status),
  ).length;

  const completed = applications.filter((application) =>
    [
      'INSPECTION_COMPLETED',
      'PASSED',
      'FAILED',
      'CERTIFICATE_ISSUED',
    ].includes(application.status),
  ).length;

  /*
   * Group applications by physical shop.
   *
   * Assignment remains application/instrument based in the backend,
   * but the field officer sees one visit location containing all
   * assigned instruments from that shop.
   */
  const shopGroups = useMemo(() => {
    const groups = new Map();

    applications.forEach((application) => {
      const shop = getShop(application);

      const key =
        shop.id ??
        `${getShopName(application)}|${getShopAddress(application)}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          name: getShopName(application),
          address: getShopAddress(application),
          gst: getShopGst(application),
          latitude: getShopLatitude(application),
          longitude: getShopLongitude(application),
          applications: [],
        });
      }

      groups.get(key).applications.push(application);
    });

    return Array.from(groups.values());
  }, [applications]);

  async function openShopLocation(shop) {
    if (shop.latitude == null || shop.longitude == null) {
      return;
    }

    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${Number(shop.latitude)},${Number(shop.longitude)}`;

    try {
      await Linking.openURL(url);
    } catch {
      // Keep the dashboard usable even if Maps is unavailable.
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
          />
        }
      >
        <LogoHeader compact />

        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>
              Good day, {user?.name || 'Officer'}
            </Text>
            <Text style={styles.muted}>Field Inspection Dashboard</Text>
          </View>

          <Pressable onPress={signOut} style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>Logout</Text>
          </Pressable>
        </View>

        {/* Connectivity mode — presentation/demo control only.
            Backend sync behavior is intentionally unchanged. */}
        <View
          style={{
            marginTop: 14,
            marginBottom: 4,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: offlineMode ? '#fff7ed' : '#f0fdf4',
            borderWidth: 1,
            borderColor: offlineMode ? '#fed7aa' : '#bbf7d0',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: '#475569',
                letterSpacing: 0.5,
              }}
            >
              CONNECTIVITY MODE
            </Text>

            <Text
              style={{
                marginTop: 3,
                fontSize: 13,
                fontWeight: '700',
                color: offlineMode ? '#c2410c' : '#15803d',
              }}
            >
              {offlineMode
                ? 'Offline Mode'
                : 'Online Mode'}
            </Text>
          </View>

          <Pressable
            onPress={() => setOfflineMode((current) => !current)}
            accessibilityRole="switch"
            accessibilityState={{ checked: !offlineMode }}
            style={{
              width: 92,
              height: 38,
              borderRadius: 20,
              padding: 4,
              backgroundColor: offlineMode ? '#f59e0b' : '#16a34a',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: offlineMode ? 'flex-start' : 'flex-end',
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: '#ffffff',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.12,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1 },
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '900',
                  color: offlineMode ? '#c2410c' : '#15803d',
                }}
              >
                {offlineMode ? 'OFF' : 'ON'}
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{applications.length}</Text>
            <Text style={styles.statLabel}>Assigned Instruments</Text>
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

        <View
          style={{
            marginBottom: 16,
            padding: 14,
            backgroundColor: '#eef5ff',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#d7e6ff',
          }}
        >
          <Text
            style={{
              color: '#173f8a',
              fontSize: 14,
              fontWeight: '800',
            }}
          >
            {shopGroups.length} inspection location
            {shopGroups.length === 1 ? '' : 's'}
          </Text>

          <Text
            style={{
              marginTop: 4,
              color: '#64748b',
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            Instruments from the same shop are grouped together for a single
            field visit.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Assigned Shops</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#173f8a" />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !applications.length && !error ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No assigned inspections</Text>
            <Text style={styles.muted}>
              New assignments will appear here.
            </Text>
          </View>
        ) : null}

        {!loading &&
          shopGroups.map((shop) => {
            const shopPending = shop.applications.filter(
              (application) =>
                ![
                  'INSPECTION_COMPLETED',
                  'PASSED',
                  'FAILED',
                  'CERTIFICATE_ISSUED',
                  'REJECTED',
                ].includes(application.status),
            ).length;

            const shopCompleted =
              shop.applications.length - shopPending;

            return (
              <View
                key={shop.key}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 18,
                  padding: 17,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: '#dbe4ef',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: '800',
                        color: '#0f172a',
                      }}
                    >
                      {shop.name}
                    </Text>

                    <Text
                      style={{
                        marginTop: 6,
                        fontSize: 13,
                        lineHeight: 19,
                        color: '#64748b',
                      }}
                    >
                      {shop.address}
                    </Text>
                  </View>

                  <View
                    style={{
                      backgroundColor: '#dbeafe',
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                    }}
                  >
                    <Text
                      style={{
                        color: '#1e40af',
                        fontSize: 11,
                        fontWeight: '800',
                      }}
                    >
                      {shop.applications.length} INSTRUMENT
                      {shop.applications.length === 1 ? '' : 'S'}
                    </Text>
                  </View>
                </View>

                {shop.gst ? (
                  <Text
                    style={{
                      marginTop: 10,
                      color: '#475569',
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    GST: {shop.gst}
                  </Text>
                ) : null}

                <View
                  style={{
                    marginTop: 14,
                    paddingVertical: 10,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: '#eef2f7',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      color: '#64748b',
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {shopPending} pending
                  </Text>

                  <Text
                    style={{
                      color: '#15803d',
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {shopCompleted} completed
                  </Text>
                </View>

                <Text
                  style={{
                    marginTop: 15,
                    marginBottom: 8,
                    color: '#0f172a',
                    fontSize: 14,
                    fontWeight: '800',
                  }}
                >
                  Instruments at this location
                </Text>

                {shop.applications.map((application) => {
                  const instrument = getInstrument(application);
                  const serial = getSerialNumber(application);
                  const model = getModel(application);

                  return (
                    <Pressable
                      key={application.id}
                      onPress={() =>
                        navigation.navigate('ApplicationDetails', {
                          application,
                        })
                      }
                      style={({ pressed }) => [
                        {
                          padding: 13,
                          marginTop: 8,
                          borderRadius: 12,
                          backgroundColor: '#f8fafc',
                          borderWidth: 1,
                          borderColor: '#e2e8f0',
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Text
                          style={{
                            flex: 1,
                            color: '#0f172a',
                            fontSize: 14,
                            fontWeight: '800',
                          }}
                        >
                          Application #{application.id}
                        </Text>

                        <Text
                          style={[
                            styles.status,
                            statusTone(application.status),
                          ]}
                        >
                          {application.status || 'ASSIGNED'}
                        </Text>
                      </View>

                      <Text
                        style={{
                          marginTop: 9,
                          color: '#1e293b',
                          fontSize: 14,
                          fontWeight: '700',
                        }}
                      >
                        {getInstrumentName(application)}
                      </Text>

                      <Text
                        style={{
                          marginTop: 4,
                          color: '#475569',
                          fontSize: 13,
                        }}
                      >
                        Serial: {serial}
                        {model ? `  •  Model: ${model}` : ''}
                      </Text>

                      <Text
                        style={{
                          marginTop: 7,
                          color: '#173f8a',
                          fontSize: 12,
                          fontWeight: '800',
                        }}
                      >
                        Open inspection →
                      </Text>
                    </Pressable>
                  );
                })}

                {shop.latitude != null && shop.longitude != null ? (
                  <Pressable
                    onPress={() => openShopLocation(shop)}
                    style={styles.outlineLargeButton}
                  >
                    <Text style={styles.outlineLargeButtonText}>
                      📍 Navigate to Shop
                    </Text>
                  </Pressable>
                ) : null}

                <Text
                  style={{
                    marginTop: 10,
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: 11,
                  }}
                >
                  One field visit • {shop.applications.length} instrument
                  {shop.applications.length === 1 ? '' : 's'}
                </Text>
              </View>
            );
          })}
      </ScrollView>
    </View>
  );
}
