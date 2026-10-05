import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7fb' },
  scroll: { padding: 20, paddingBottom: 40 },
  loginContainer: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f7fb' },

  header: { alignItems: 'center', marginBottom: 24 },
  headerCompact: { alignItems: 'center', marginBottom: 10 },
  logo: { width: 280, height: 150 },
  logoSmall: { width: 180, height: 90 },
  headerText: { alignItems: 'center', marginTop: -8 },
  brand: { fontSize: 25, fontWeight: '800', color: '#0b2a5b' },
  tagline: { marginTop: 2, color: '#64748b', fontSize: 13, fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  muted: { color: '#64748b', fontSize: 14, lineHeight: 20 },
  greeting: { fontSize: 21, fontWeight: '800', color: '#0f172a' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },

  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 16, marginBottom: 7, textTransform: 'capitalize' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
    color: '#0f172a',
    fontSize: 15,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },

  primaryButton: {
    backgroundColor: '#173f8a',
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 16,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  outlineButton: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  outlineButtonText: { color: '#173f8a', fontWeight: '700' },
  outlineLargeButton: { borderWidth: 1, borderColor: '#173f8a', borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  outlineLargeButtonText: { color: '#173f8a', fontWeight: '800' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.75 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#173f8a' },
  statLabel: { marginTop: 3, color: '#64748b', fontSize: 12, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
  applicationCard: { backgroundColor: '#fff', borderRadius: 16, padding: 17, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  applicationTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', flex: 1 },
  cardPrimary: { marginTop: 12, fontSize: 15, fontWeight: '700', color: '#1e293b' },
  cardSecondary: { marginTop: 5, fontSize: 13, color: '#64748b' },

  status: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: '800', overflow: 'hidden' },
  statusGreen: { backgroundColor: '#dcfce7', color: '#166534' },
  statusRed: { backgroundColor: '#fee2e2', color: '#991b1b' },
  statusBlue: { backgroundColor: '#dbeafe', color: '#1e40af' },

  detailCard: { backgroundColor: '#fff', borderRadius: 16, padding: 17, marginTop: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  detailLabel: { marginTop: 12, color: '#64748b', fontSize: 12, fontWeight: '700' },
  detailValue: { marginTop: 4, color: '#0f172a', fontSize: 15, fontWeight: '600' },
  back: { color: '#173f8a', fontWeight: '800', fontSize: 16, marginBottom: 16 },

  success: { color: '#15803d', fontWeight: '800' },
  warning: { color: '#b45309', fontWeight: '800' },
  small: { marginTop: 6, color: '#64748b', fontSize: 12 },

  photo: { width: '100%', height: 220, borderRadius: 14, marginTop: 12, backgroundColor: '#e2e8f0' },
  ocrBox: { marginTop: 14, backgroundColor: '#f8fafc', borderRadius: 12, padding: 12 },
  ocrTitle: { color: '#173f8a', fontWeight: '800', marginBottom: 4 },

  choiceRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  choice: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  choiceSelectedGreen: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  choiceSelectedRed: { backgroundColor: '#fee2e2', borderColor: '#dc2626' },
  choiceText: { fontWeight: '800', color: '#0f172a' },

  empty: { backgroundColor: '#fff', borderRadius: 16, padding: 25, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 5 },
  error: { marginTop: 12, color: '#b91c1c', backgroundColor: '#fee2e2', padding: 12, borderRadius: 10, fontWeight: '600' },
});
