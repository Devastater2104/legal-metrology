import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Store,
  TriangleAlert,
  XCircle,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import {
  getApplications,
  getShop,
  submitApplication,
} from '../../services/shopService'

const STATUS_META = {
  DRAFT: {
    label: 'Draft',
    tone: 'slate',
  },
  SUBMITTED: {
    label: 'Submitted',
    tone: 'blue',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    tone: 'amber',
  },
  ASSIGNED: {
    label: 'Officer Assigned',
    tone: 'violet',
  },
  SCHEDULED: {
    label: 'Inspection Scheduled',
    tone: 'indigo',
  },
  INSPECTION_PENDING: {
    label: 'Inspection Pending',
    tone: 'amber',
  },
  INSPECTION_COMPLETED: {
    label: 'Inspection Completed',
    tone: 'blue',
  },
  PASSED: {
    label: 'Passed',
    tone: 'green',
  },
  FAILED: {
    label: 'Failed',
    tone: 'red',
  },
  CERTIFICATE_ISSUED: {
    label: 'Certificate Issued',
    tone: 'green',
  },
  EXPIRED: {
    label: 'Expired',
    tone: 'red',
  },
  REVERIFICATION_REQUIRED: {
    label: 'Reverification Required',
    tone: 'amber',
  },
}

function statusMeta(status) {
  return (
    STATUS_META[status] || {
      label: String(status || 'Unknown').replaceAll('_', ' '),
      tone: 'slate',
    }
  )
}

function applicationForInstrument(applications, instrumentId) {
  return (
    applications
      .filter((application) => application.instrument_id === instrumentId)
      .sort((a, b) => Number(b.id) - Number(a.id))[0] || null
  )
}

export default function ShopDetails() {
  const { shopId } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [shop, setShop] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [submittingId, setSubmittingId] = useState(null)
  const [success, setSuccess] = useState('')

  async function loadData(showRefresh = false) {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    setError('')

    try {
      const [shopData, applicationData] = await Promise.all([
        getShop(shopId, token),
        getApplications(token),
      ])

      setShop(shopData)
      setApplications(Array.isArray(applicationData) ? applicationData : [])
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load shop.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (token && shopId) {
      loadData()
    }
  }, [token, shopId])

  const instruments = shop?.instruments || []

  const pendingCount = useMemo(
    () =>
      instruments.filter((instrument) => {
        const application = applicationForInstrument(
          applications,
          instrument.id,
        )

        return application && ![
          'PASSED',
          'FAILED',
          'CERTIFICATE_ISSUED',
          'EXPIRED',
        ].includes(application.status)
      }).length,
    [applications, instruments],
  )

  async function handleApplication(instrument) {
    setSubmittingId(instrument.id)
    setActionError('')
    setSuccess('')

    try {
      await submitApplication(
        instrument.id,
        token,
        'Verification application submitted from the instrument record.',
      )

      setSuccess(
        `Verification application submitted for ${instrument.serial_number}.`,
      )

      await loadData(true)
    } catch (submitError) {
      setActionError(
        submitError?.message ||
          'Unable to submit verification application.',
      )
    } finally {
      setSubmittingId(null)
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingCard}>
            <Loader2 size={22} style={styles.spin} />
            <span>Loading shop...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !shop) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <Link to="/user/shops" style={styles.backLink}>
            <ArrowLeft size={16} />
            Back to Shops
          </Link>

          <div style={styles.errorCard}>
            <TriangleAlert size={22} />
            <div>
              <h2 style={styles.errorTitle}>Unable to load this shop</h2>
              <p style={styles.errorText}>
                {error || 'The requested shop could not be found.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <Link to="/user/shops" style={styles.backLink}>
            <ArrowLeft size={16} />
            Back to Shops
          </Link>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={styles.refreshButton}
          >
            <RefreshCw
              size={16}
              style={refreshing ? styles.spin : undefined}
            />
            Refresh
          </button>
        </div>

        <div style={styles.hero}>
          <div>
            <div style={styles.eyebrow}>BUSINESS LOCATION</div>

            <div style={styles.titleRow}>
              <div style={styles.heroIcon}>
                <Store size={25} />
              </div>

              <div>
                <h1 style={styles.title}>{shop.name}</h1>
                <p style={styles.subtitle}>
                  Manage instruments and verification activity for this shop.
                </p>
              </div>
            </div>
          </div>

          <Link
            to={`/user/shops/${shop.id}/instruments/new`}
            style={styles.primaryButton}
          >
            <Plus size={17} />
            Add Instrument
          </Link>
        </div>

        {(success || actionError) && (
          <div
            style={
              success
                ? styles.successBanner
                : styles.errorBanner
            }
          >
            {success ? (
              <CheckCircle2 size={19} />
            ) : (
              <TriangleAlert size={19} />
            )}
            <span>{success || actionError}</span>
          </div>
        )}

        <section style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryIconBlue}>
              <Building2 size={19} />
            </div>
            <div>
              <div style={styles.summaryLabel}>Business</div>
              <div style={styles.summaryValue}>{shop.name}</div>
              <div style={styles.summaryMeta}>
                GST: {shop.gst_number || 'Not provided'}
              </div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryIconGreen}>
              <MapPin size={19} />
            </div>
            <div>
              <div style={styles.summaryLabel}>Registered Location</div>
              <div style={styles.address}>{shop.address}</div>
              <div style={styles.coordinates}>
                {Number(shop.latitude).toFixed(6)},&nbsp;
                {Number(shop.longitude).toFixed(6)}
              </div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryIconViolet}>
              <ShieldCheck size={19} />
            </div>
            <div>
              <div style={styles.summaryLabel}>Registered Instruments</div>
              <div style={styles.bigNumber}>{instruments.length}</div>
              <div style={styles.summaryMeta}>
                {pendingCount} pending verification
                {pendingCount === 1 ? '' : 's'}
              </div>
            </div>
          </div>
        </section>

        <section style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Measuring Instruments</h2>
              <p style={styles.sectionDescription}>
                Instruments registered at this business location.
              </p>
            </div>

            <Link
              to={`/user/shops/${shop.id}/instruments/new`}
              style={styles.outlineButton}
            >
              <Plus size={16} />
              Add Instrument
            </Link>
          </div>

          {instruments.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <ClipboardCheck size={25} />
              </div>
              <h3 style={styles.emptyTitle}>
                No instruments registered
              </h3>
              <p style={styles.emptyText}>
                Add the first measuring instrument for this shop.
              </p>
              <Link
                to={`/user/shops/${shop.id}/instruments/new`}
                style={styles.primaryButton}
              >
                <Plus size={17} />
                Add Instrument
              </Link>
            </div>
          ) : (
            <div style={styles.instrumentList}>
              {instruments.map((instrument) => {
                const application = applicationForInstrument(
                  applications,
                  instrument.id,
                )

                const meta = application
                  ? statusMeta(application.status)
                  : null

                const canApply =
                  !application ||
                  [
                    'FAILED',
                    'EXPIRED',
                    'REVERIFICATION_REQUIRED',
                  ].includes(application.status)

                return (
                  <article
                    key={instrument.id}
                    style={styles.instrumentCard}
                  >
                    <div style={styles.instrumentMain}>
                      <div style={styles.instrumentIcon}>
                        <ScaleIcon />
                      </div>

                      <div style={styles.instrumentInfo}>
                        <div style={styles.instrumentTitleRow}>
                          <h3 style={styles.instrumentTitle}>
                            {instrument.instrument_type}
                          </h3>

                          {meta && (
                            <StatusBadge
                              label={meta.label}
                              tone={meta.tone}
                            />
                          )}
                        </div>

                        <p style={styles.instrumentSub}>
                          {instrument.manufacturer}
                          {instrument.model
                            ? ` · ${instrument.model}`
                            : ''}
                        </p>

                        <div style={styles.instrumentDetails}>
                          <Detail label="Serial" value={instrument.serial_number} />
                          <Detail
                            label="Measurement"
                            value={instrument.measurement_type || '—'}
                          />
                          <Detail
                            label="Capacity"
                            value={instrument.capacity || '—'}
                          />
                          <Detail
                            label="Class"
                            value={instrument.accuracy_class || '—'}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={styles.instrumentActions}>
                      {application && (
                        <Link
                          to="/user/applications"
                          style={styles.secondaryAction}
                        >
                          <FileCheck2 size={16} />
                          View Application
                        </Link>
                      )}

                      {canApply ? (
                        <button
                          type="button"
                          onClick={() => handleApplication(instrument)}
                          disabled={submittingId === instrument.id}
                          style={{
                            ...styles.primaryAction,
                            opacity:
                              submittingId === instrument.id ? 0.65 : 1,
                          }}
                        >
                          {submittingId === instrument.id ? (
                            <Loader2 size={16} style={styles.spin} />
                          ) : (
                            <ArrowRight size={16} />
                          )}
                          {application?.status === 'FAILED' ||
                          application?.status === 'EXPIRED' ||
                          application?.status ===
                            'REVERIFICATION_REQUIRED'
                            ? 'Apply for Reverification'
                            : 'Apply for Verification'}
                        </button>
                      ) : (
                        <div style={styles.applicationState}>
                          <CheckCircle2 size={16} />
                          Application in progress
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <div style={styles.footerNote}>
          <ShieldCheck size={16} />
          <span>
            Shop location is the authoritative inspection location. Individual
            instruments inherit this business location.
          </span>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{value}</span>
    </div>
  )
}

function StatusBadge({ label, tone }) {
  const palette = {
    slate: ['#f1f5f9', '#475569'],
    blue: ['#eff6ff', '#1d4ed8'],
    amber: ['#fffbeb', '#b45309'],
    violet: ['#f5f3ff', '#6d28d9'],
    indigo: ['#eef2ff', '#4338ca'],
    green: ['#f0fdf4', '#15803d'],
    red: ['#fef2f2', '#b91c1c'],
  }

  const [background, color] = palette[tone] || palette.slate

  return (
    <span
      style={{
        ...styles.statusBadge,
        background,
        color,
      }}
    >
      {label}
    </span>
  )
}

function ScaleIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v4" />
      <path d="M5 7h14" />
      <path d="M7 7 4 14h6L7 7Z" />
      <path d="m17 7-3 7h6l-3-7Z" />
      <path d="M8 18h8" />
      <path d="M12 14v4" />
    </svg>
  )
}

const styles = {
  page: {
    minHeight: 'calc(100vh - 80px)',
    background: '#f8fafc',
    padding: '32px 24px 56px',
    color: '#0f172a',
  },
  container: {
    width: '100%',
    maxWidth: 1120,
    margin: '0 auto',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    color: '#475569',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
  },
  refreshButton: {
    height: 38,
    padding: '0 12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    border: '1px solid #cbd5e1',
    borderRadius: 9,
    background: '#fff',
    color: '#475569',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  hero: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 24,
    marginBottom: 24,
  },
  eyebrow: {
    marginBottom: 9,
    color: '#2563eb',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.13em',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 13,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    display: 'grid',
    placeItems: 'center',
    background: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #dbeafe',
  },
  title: {
    margin: 0,
    fontSize: 29,
    lineHeight: 1.15,
    fontWeight: 750,
    letterSpacing: '-0.03em',
  },
  subtitle: {
    margin: '6px 0 0',
    color: '#64748b',
    fontSize: 14,
  },
  primaryButton: {
    height: 42,
    padding: '0 16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: 0,
    borderRadius: 10,
    background: '#1d4ed8',
    color: '#fff',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 650,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.35fr 0.75fr',
    gap: 14,
    marginBottom: 20,
  },
  summaryCard: {
    minHeight: 112,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 13,
    padding: 18,
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    background: '#fff',
    boxShadow: '0 3px 12px rgba(15, 23, 42, 0.04)',
  },
  summaryIconBlue: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: 'grid',
    placeItems: 'center',
    background: '#eff6ff',
    color: '#2563eb',
    flexShrink: 0,
  },
  summaryIconGreen: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: 'grid',
    placeItems: 'center',
    background: '#f0fdf4',
    color: '#16a34a',
    flexShrink: 0,
  },
  summaryIconViolet: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: 'grid',
    placeItems: 'center',
    background: '#f5f3ff',
    color: '#7c3aed',
    flexShrink: 0,
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 750,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 5,
  },
  summaryValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  summaryMeta: {
    marginTop: 5,
    color: '#64748b',
    fontSize: 12,
  },
  address: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 1.45,
  },
  coordinates: {
    marginTop: 5,
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  bigNumber: {
    color: '#0f172a',
    fontSize: 27,
    lineHeight: 1,
    fontWeight: 750,
  },
  sectionCard: {
    padding: 22,
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 3px 14px rgba(15, 23, 42, 0.04)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    marginBottom: 20,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 720,
    letterSpacing: '-0.015em',
  },
  sectionDescription: {
    margin: '4px 0 0',
    color: '#64748b',
    fontSize: 13,
  },
  outlineButton: {
    height: 38,
    padding: '0 12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    border: '1px solid #bfdbfe',
    borderRadius: 9,
    background: '#eff6ff',
    color: '#1d4ed8',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 650,
    whiteSpace: 'nowrap',
  },
  emptyState: {
    minHeight: 270,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    border: '1px dashed #cbd5e1',
    borderRadius: 13,
    background: '#fbfdff',
    padding: 30,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: 'grid',
    placeItems: 'center',
    background: '#eff6ff',
    color: '#93c5fd',
  },
  emptyTitle: {
    margin: '14px 0 0',
    fontSize: 16,
    fontWeight: 700,
    color: '#334155',
  },
  emptyText: {
    margin: '5px 0 17px',
    color: '#64748b',
    fontSize: 13,
  },
  instrumentList: {
    display: 'grid',
    gap: 12,
  },
  instrumentCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    padding: 17,
    border: '1px solid #e2e8f0',
    borderRadius: 13,
    background: '#fff',
  },
  instrumentMain: {
    minWidth: 0,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 13,
  },
  instrumentIcon: {
    width: 43,
    height: 43,
    borderRadius: 11,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#475569',
  },
  instrumentInfo: {
    minWidth: 0,
  },
  instrumentTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    flexWrap: 'wrap',
  },
  instrumentTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: 700,
  },
  instrumentSub: {
    margin: '4px 0 0',
    color: '#64748b',
    fontSize: 13,
  },
  instrumentDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '7px 20px',
    marginTop: 11,
  },
  detailLabel: {
    display: 'block',
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 750,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  detailValue: {
    display: 'block',
    marginTop: 2,
    color: '#334155',
    fontSize: 12,
    fontWeight: 600,
  },
  instrumentActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  primaryAction: {
    height: 38,
    padding: '0 12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    border: 0,
    borderRadius: 9,
    background: '#1d4ed8',
    color: '#fff',
    fontSize: 12,
    fontWeight: 650,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  secondaryAction: {
    height: 38,
    padding: '0 11px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    border: '1px solid #cbd5e1',
    borderRadius: 9,
    background: '#fff',
    color: '#475569',
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  applicationState: {
    height: 38,
    padding: '0 11px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    borderRadius: 9,
    background: '#f0fdf4',
    color: '#15803d',
    fontSize: 12,
    fontWeight: 650,
    whiteSpace: 'nowrap',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 24,
    padding: '0 8px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 750,
    whiteSpace: 'nowrap',
  },
  footerNote: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: '11px 13px',
    borderRadius: 10,
    background: '#f8fafc',
    color: '#64748b',
    fontSize: 12,
    lineHeight: 1.5,
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    marginBottom: 16,
    padding: '11px 13px',
    borderRadius: 10,
    border: '1px solid #bbf7d0',
    background: '#f0fdf4',
    color: '#166534',
    fontSize: 13,
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    marginBottom: 16,
    padding: '11px 13px',
    borderRadius: 10,
    border: '1px solid #fecaca',
    background: '#fef2f2',
    color: '#991b1b',
    fontSize: 13,
  },
  loadingCard: {
    minHeight: 260,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    background: '#fff',
    color: '#64748b',
  },
  errorCard: {
    marginTop: 22,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 20,
    border: '1px solid #fecaca',
    borderRadius: 14,
    background: '#fff',
    color: '#b91c1c',
  },
  errorTitle: {
    margin: 0,
    color: '#7f1d1d',
    fontSize: 16,
  },
  errorText: {
    margin: '5px 0 0',
    color: '#991b1b',
    fontSize: 13,
  },
  spin: {
    animation: 'shopDetailsSpin 1s linear infinite',
  },
}

const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes shopDetailsSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 900px) {
    .shop-summary-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 760px) {
    .shop-instrument-card {
      flex-direction: column !important;
      align-items: stretch !important;
    }
  }
`
document.head.appendChild(styleSheet)
