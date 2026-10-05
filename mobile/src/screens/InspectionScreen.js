import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { extractInspectionInfo, submitInspection } from '../api';
import { useAuth } from '../context/AuthContext';
import { styles } from '../styles';

export default function InspectionScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useAuth();
  const application = route.params?.application || {};

  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Capturing location…');
  const [photoUri, setPhotoUri] = useState(null);
  const [ocr, setOcr] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [observations, setObservations] = useState('');
  const [result, setResult] = useState('PASS');
  const [voiceListening, setVoiceListening] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [verifierState, setVerifierState] = useState('disconnected');
  const [verifierResult, setVerifierResult] = useState(null);
  const [verifierMessage, setVerifierMessage] = useState('');

  useEffect(() => {
    captureLocation();
  }, []);

  async function captureLocation() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationStatus('Location permission denied');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        capturedAt: new Date().toISOString(),
      });
      setLocationStatus('Location captured');
    } catch (e) {
      setLocationStatus('Unable to capture location');
    }
  }

  function randomVerifierResult() {
    const maximum = 0.008 + Math.random() * 0.040;
    const average = Math.max(0.003, maximum * (0.48 + Math.random() * 0.22));

    return {
      instrumentType:
        application?.instrument?.instrument_type ||
        application?.instrument_type ||
        'Electronic Weighing Scale',
      verifierName: 'E-MānakSetu Smart Verifier',
      maximumDeviation: `${maximum.toFixed(3)} kg`,
      averageDeviation: `${average.toFixed(3)} kg`,
    };
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function connectVerifier() {
    if (verifierState !== 'disconnected') return;

    setVerifierState('connecting');
    setVerifierResult(null);
    setVerifierMessage('Connecting to E-MānakSetu Smart Verifier…');

    await wait(1500);

    setVerifierState('verifying');
    setVerifierMessage('Taking readings…');
    await wait(3500);

    setVerifierMessage('Calculating error…');
    await wait(3500);

    setVerifierMessage('Finalizing verification result…');
    await wait(1500);

    setVerifierResult(randomVerifierResult());
    setVerifierState('connected');
    setVerifierMessage('Verification reading complete.');
  }

  function disconnectVerifier() {
    setVerifierState('disconnected');
    setVerifierResult(null);
    setVerifierMessage('');
  }

  function startVoiceInput() {
    if (voiceListening) return;

    if (typeof window === 'undefined') {
      Alert.alert('Voice input', 'Voice speech recognition is available in the web app.');
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      Alert.alert(
        'Voice input unavailable',
        'This browser does not support speech recognition. Please use Chrome or another supported browser.',
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setVoiceListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
      if (transcript) {
        setObservations((current) =>
          current ? `${current} ${transcript}` : transcript,
        );
      }
    };

    recognition.onerror = () => {
      setError('Voice input could not be captured. You can type the remarks instead.');
    };

    recognition.onend = () => setVoiceListening(false);

    try {
      recognition.start();
    } catch (e) {
      setVoiceListening(false);
      setError('Unable to start voice input. Please try again.');
    }
  }

  async function capturePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(
        'Camera permission',
        'Camera access is required to capture the instrument photo.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
      setOcr(null);
    }
  }

  async function runOcr() {
    if (!photoUri) return;
    setOcrLoading(true);
    setError('');

    try {
      const data = await extractInspectionInfo(application.id, photoUri, token);
      setOcr(data);
    } catch (e) {
      setError(`${e.message || 'OCR failed.'} You can continue without OCR.`);
    } finally {
      setOcrLoading(false);
    }
  }

  function updateOcr(field, text) {
    setOcr((current) => ({ ...(current || {}), [field]: text }));
  }

  async function submit() {
    if (!location) {
      setError('Capture the inspection location before submitting.');
      return;
    }

    if (!gstNumber.trim()) {
      setError('Enter the shop GST number before submitting the inspection.');
      return;
    }

    if (!verifierResult) {
      setError('Connect the Smart e-MānakSetu Verifier and complete the reading.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await submitInspection(
        application.id,
        {
          measurement: verifierResult.maximumDeviation,
          gst_number: gstNumber.trim().toUpperCase(),
          observations: observations.trim() || null,
          result,
          latitude: location.latitude,
          longitude: location.longitude,
          captured_at: location.capturedAt,
          ocr_data: ocr
            ? {
                manufacturer: ocr.manufacturer || null,
                model: ocr.model || null,
                serial_number: ocr.serial_number || null,
                capacity: ocr.capacity || null,
                raw_text: ocr.raw_text,
                confidence: ocr.confidence,
                confirmed: false,
              }
            : null,
          photo_ids: ocr?.photo_id ? [ocr.photo_id] : [],
        },
        token,
      );

      Alert.alert(
        'Inspection submitted',
        'The inspection was successfully submitted.',
        [{ text: 'OK', onPress: () => navigation.popToTop() }],
      );
    } catch (e) {
      setError(e.message || 'Unable to submit inspection.');
    } finally {
      setSubmitting(false);
    }
  }

  const verifierConnected =
    verifierState === 'connected' || verifierState === 'verifying';
  const verifierConnecting = verifierState === 'connecting';
  const verifierVerifying = verifierState === 'verifying';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Field Inspection</Text>
      <Text style={styles.muted}>Application #{application.id}</Text>

      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>1. Shop Details</Text>
        <Text style={styles.label}>Shop GST Number *</Text>
        <TextInput
          value={gstNumber}
          onChangeText={(text) => setGstNumber(text.toUpperCase())}
          style={styles.input}
          placeholder="Enter 15-character GSTIN"
          placeholderTextColor="#94a3b8"
          autoCapitalize="characters"
          maxLength={15}
        />
        <Text style={styles.small}>
          Enter the GSTIN of the shop/business being inspected.
        </Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>2. Location</Text>
        <Text style={location ? styles.success : styles.warning}>{locationStatus}</Text>
        {location ? (
          <Text style={styles.small}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
        ) : null}
        <Pressable onPress={captureLocation} style={styles.outlineLargeButton}>
          <Text style={styles.outlineLargeButtonText}>Refresh GPS</Text>
        </Pressable>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>3. Smart e-MānakSetu Verifier</Text>
        <Text style={styles.muted}>
          Connect the verifier to receive the instrument error reading.
        </Text>

        <View
          style={{
            marginTop: 14,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: verifierConnected ? '#86efac' : '#bfdbfe',
            backgroundColor: verifierConnected ? '#f0fdf4' : '#eff6ff',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#173f8a' }}>
            E-MānakSetu Smart Verifier
          </Text>

          {verifierState === 'disconnected' ? (
            <>
              <Text style={{ marginTop: 8, color: '#64748b' }}>
                Bluetooth verifier not connected
              </Text>
              <Pressable
                onPress={connectVerifier}
                style={[styles.primaryButton, { marginTop: 14 }]}
              >
                <Text style={styles.primaryButtonText}>Connect Verifier</Text>
              </Pressable>
            </>
          ) : null}

          {verifierConnecting || verifierVerifying ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <ActivityIndicator size="large" color="#173f8a" />
              <Text
                style={{
                  marginTop: 12,
                  fontWeight: '800',
                  color: '#173f8a',
                  textAlign: 'center',
                }}
              >
                {verifierMessage || 'Reading verifier data…'}
              </Text>
              <Text style={{ marginTop: 6, color: '#64748b', textAlign: 'center' }}>
                Please keep the instrument and verifier ready.
              </Text>
            </View>
          ) : null}

          {verifierState === 'connected' ? (
            <>
              <View
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: '#dcfce7',
                }}
              >
                <Text style={{ color: '#166534', fontWeight: '800' }}>
                  ● Connected
                </Text>
              </View>

              {!verifierResult ? (
                <View style={{ alignItems: 'center', paddingVertical: 18 }}>
                  <ActivityIndicator color="#173f8a" />
                  <Text style={{ marginTop: 8, color: '#64748b' }}>
                    Receiving verification result…
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    marginTop: 14,
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: '#ffffff',
                  }}
                >
                  <Text style={{ fontSize: 14, color: '#64748b' }}>
                    Verification Result
                  </Text>
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 20,
                      fontWeight: '900',
                      color: '#173f8a',
                    }}
                  >
                    {verifierResult.instrumentType}
                  </Text>

                  <View style={{ marginTop: 14 }}>
                    <Text style={{ color: '#64748b' }}>Maximum deviation</Text>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: '900',
                        color: '#0f172a',
                      }}
                    >
                      {verifierResult.maximumDeviation}
                    </Text>
                  </View>

                  <View style={{ marginTop: 10 }}>
                    <Text style={{ color: '#64748b' }}>Average deviation</Text>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: '800',
                        color: '#0f172a',
                      }}
                    >
                      {verifierResult.averageDeviation}
                    </Text>
                  </View>


                  <Text
                    style={{
                      marginTop: 10,
                      textAlign: 'center',
                      fontSize: 11,
                      color: '#64748b',
                    }}
                  >
                    Prototype result — generated for demonstration until the
                    physical verifier is connected.
                  </Text>
                </View>
              )}

              <Pressable
                onPress={disconnectVerifier}
                style={[styles.outlineLargeButton, { marginTop: 12 }]}
              >
                <Text style={styles.outlineLargeButtonText}>Disconnect</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>4. Instrument Photo & OCR</Text>

        <Pressable onPress={capturePhoto} style={styles.outlineLargeButton}>
          <Text style={styles.outlineLargeButtonText}>Take Instrument Photo (Optional)</Text>
        </Pressable>

        {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} /> : null}

        <Pressable
          onPress={runOcr}
          disabled={!photoUri || ocrLoading}
          style={[styles.primaryButton, (!photoUri || ocrLoading) && styles.disabled]}
        >
          {ocrLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Run OCR</Text>
          )}
        </Pressable>

        {ocr ? (
          <View style={styles.ocrBox}>
            <Text style={styles.ocrTitle}>OCR Suggestions — editable</Text>
            {['manufacturer', 'model', 'serial_number', 'capacity'].map((field) => (
              <View key={field}>
                <Text style={styles.label}>{field.replace('_', ' ')}</Text>
                <TextInput
                  value={ocr[field] || ''}
                  onChangeText={(text) => updateOcr(field, text)}
                  style={styles.input}
                  placeholder={`Enter ${field.replace('_', ' ')}`}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>5. Officer Decision</Text>

        <Text style={styles.label}>Remarks (optional)</Text>
        <TextInput
          value={observations}
          onChangeText={setObservations}
          multiline
          numberOfLines={4}
          style={[styles.input, styles.textArea]}
          placeholder="Add remarks or use voice input"
          placeholderTextColor="#94a3b8"
        />

        <Pressable
          onPress={startVoiceInput}
          disabled={voiceListening}
          style={[styles.outlineLargeButton, voiceListening && styles.disabled]}
        >
          {voiceListening ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#173f8a" />
              <Text style={styles.outlineLargeButtonText}>Listening…</Text>
            </View>
          ) : (
            <Text style={styles.outlineLargeButtonText}>🎙 Speak Remarks</Text>
          )}
        </Pressable>

        <Text style={styles.label}>Inspection Decision *</Text>
        <View style={styles.choiceRow}>
          <Pressable
            onPress={() => setResult('PASS')}
            style={[styles.choice, result === 'PASS' && styles.choiceSelectedGreen]}
          >
            <Text style={styles.choiceText}>PASS ✓</Text>
          </Pressable>
          <Pressable
            onPress={() => setResult('FAIL')}
            style={[styles.choice, result === 'FAIL' && styles.choiceSelectedRed]}
          >
            <Text style={styles.choiceText}>FAIL ✕</Text>
          </Pressable>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={submit}
        disabled={submitting}
        style={[styles.primaryButton, submitting && styles.disabled]}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Submit Inspection</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
