import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Scale,
  ShieldCheck,
  Store,
  TriangleAlert,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { getShop, createInstrument } from '../../services/shopService'

const instrumentTypes = [
  'Electronic Weighing Scale',
  'Platform Weighing Scale',
  'Counter Weighing Scale',
  'Weighbridge',
  'Spring Balance',
  'Beam Scale',
  'Measuring Instrument',
  'Other',
]

const measurementTypes = [
  'Weight',
  'Volume / Liquid',
  'Temperature',
]

const accuracyClasses = [
  'Class I',
  'Class II',
  'Class III',
  'Class IIII',
  'Other / Not specified',
]

const initialForm = {
  instrument_type: '',
  measurement_type: '',
  manufacturer: '',
  model: '',
  serial_number: '',
  capacity: '',
  accuracy_class: '',
}

function capacityPlaceholder(measurementType) {
  if (measurementType === 'Weight') return 'e.g. 30 kg'
  if (measurementType === 'Volume / Liquid') return 'e.g. 20 L'
  if (measurementType === 'Temperature') return 'e.g. -10 to 120 °C'
  return 'Enter capacity / range'
}

export default function AddInstrument() {
  const { shopId } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [shop, setShop] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [loadingShop, setLoadingShop] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadShop() {
      if (!token || !shopId) return

      setLoadingShop(true)
      setError('')

      try {
        const data = await getShop(shopId, token)
        setShop(data)
      } catch (loadError) {
        setError(
          loadError?.message || 'Unable to load the selected shop.',
        )
      } finally {
        setLoadingShop(false)
      }
    }

    loadShop()
  }, [token, shopId])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.instrument_type) {
      setError('Please select an instrument type.')
      return
    }

    if (!form.measurement_type) {
      setError('Please select what the instrument measures.')
      return
    }

    if (!form.manufacturer.trim()) {
      setError('Please enter the manufacturer.')
      return
    }

    if (!form.serial_number.trim()) {
      setError('Please enter the serial number.')
      return
    }

    setSubmitting(true)

    try {
      await createInstrument(
        {
          ...form,
          shop_id: Number(shopId),
          manufacturer: form.manufacturer.trim(),
          model: form.model.trim() || null,
          serial_number: form.serial_number.trim(),
          capacity: form.capacity.trim() || null,
          accuracy_class: form.accuracy_class || null,
        },
        token,
      )

      navigate(`/user/shops/${shopId}`, {
        replace: true,
        state: {
          success: 'Instrument registered successfully.',
        },
      })
    } catch (submitError) {
      setError(
        submitError?.message || 'Unable to register instrument.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingShop) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingCard}>
            <Loader2 size={22} style={styles.spin} />
            <span>Loading shop details...</span>
          </div>
        </div>
      </main>
    )
  }

  if (!shop) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <Link to="/user/shops" style={styles.backLink}>
            <ArrowLeft size={16} />
            Back to Shops
          </Link>

          <div style={styles.errorCard}>
            <TriangleAlert size={21} />
            <div>
              <h2 style={styles.errorTitle}>Shop unavailable</h2>
              <p style={styles.errorText}>
                {error || 'The selected business location could not be loaded.'}
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <Link
            to={`/user/shops/${shop.id}`}
            style={styles.backLink}
          >
            <ArrowLeft size={16} />
            Back to {shop.name}
          </Link>
        </div>

        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>BUSINESS PORTAL</div>
            <h1 style={styles.title}>Add Measuring Instrument</h1>
            <p style={styles.subtitle}>
              Register an instrument under this business location.
            </p>
          </div>
        </div>

        <section style={styles.shopBanner}>
          <div style={styles.shopIcon}>
            <Store size={21} />
          </div>

          <div style={styles.shopInfo}>
            <div style={styles.shopEyebrow}>REGISTERING INSTRUMENT AT</div>
            <div style={styles.shopName}>{shop.name}</div>
            <div style={styles.shopAddress}>{shop.address}</div>
          </div>

          <div style={styles.inheritedBadge}>
            <ShieldCheck size={15} />
            Shop location inherited
          </div>
        </section>

        {error && (
          <div style={styles.errorBanner} role="alert">
            <TriangleAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderIcon}>
                <Scale size={19} />
              </div>
              <div>
                <h2 style={styles.cardTitle}>Instrument Details</h2>
                <p style={styles.cardDescription}>
                  Enter the technical details of the measuring instrument.
                </p>
              </div>
            </div>

            <div style={styles.formGrid}>
              <Field
                label="Instrument Type"
                required
                hint="Select the instrument category."
              >
                <select
                  name="instrument_type"
                  value={form.instrument_type}
                  onChange={updateField}
                  style={styles.input}
                  required
                >
                  <option value="">Select instrument type</option>
                  {instrumentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Measurement Type"
                required
                hint="Select what the instrument measures."
              >
                <select
                  name="measurement_type"
                  value={form.measurement_type}
                  onChange={updateField}
                  style={styles.input}
                  required
                >
                  <option value="">Select measurement type</option>
                  {measurementTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Manufacturer"
                required
                hint="Brand or manufacturer printed on the instrument."
              >
                <input
                  name="manufacturer"
                  value={form.manufacturer}
                  onChange={updateField}
                  style={styles.input}
                  placeholder="e.g. Essae, Avery, Mettler Toledo"
                  required
                />
              </Field>

              <Field
                label="Model"
                hint="Model number, if available."
              >
                <input
                  name="model"
                  value={form.model}
                  onChange={updateField}
                  style={styles.input}
                  placeholder="e.g. DS-215"
                />
              </Field>

              <Field
                label="Serial Number"
                required
                hint="Unique serial number printed on the instrument."
              >
                <input
                  name="serial_number"
                  value={form.serial_number}
                  onChange={updateField}
                  style={styles.input}
                  placeholder="e.g. ESSAE-TEST-001"
                  required
                />
              </Field>

              <Field
                label="Capacity / Range"
                hint="Capacity or operating range shown on the instrument."
              >
                <input
                  name="capacity"
                  value={form.capacity}
                  onChange={updateField}
                  style={styles.input}
                  placeholder={capacityPlaceholder(form.measurement_type)}
                />
              </Field>

              <Field
                label="Accuracy / Class"
                hint="Verification class, if applicable."
                fullWidth
              >
                <select
                  name="accuracy_class"
                  value={form.accuracy_class}
                  onChange={updateField}
                  style={styles.input}
                >
                  <option value="">Select accuracy/class</option>
                  {accuracyClasses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section style={styles.inheritanceCard}>
            <div style={styles.inheritanceIcon}>
              <CheckCircle2 size={20} />
            </div>

            <div>
              <h3 style={styles.inheritanceTitle}>
                Shop information is already registered
              </h3>
              <p style={styles.inheritanceText}>
                This instrument automatically belongs to{' '}
                <strong>{shop.name}</strong>. Its GST number, business address
                and GPS coordinates are inherited from the shop and do not
                need to be entered again.
              </p>
            </div>
          </section>

          <div style={styles.actions}>
            <Link
              to={`/user/shops/${shop.id}`}
              style={styles.cancelButton}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.submitButton,
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={17} style={styles.spin} />
                  Registering...
                </>
              ) : (
                <>
                  <ClipboardCheck size={17} />
                  Register Instrument
                </>
              )}
            </button>
          </div>
        </form>

        <div style={styles.footerNote}>
          <ShieldCheck size={16} />
          <span>
            Instrument location is managed at the shop level to keep business
            and inspection records consistent.
          </span>
        </div>
      </div>
    </main>
  )
}

function Field({ label, required, hint, children, fullWidth }) {
  return (
    <div style={{ ...styles.field, ...(fullWidth ? styles.fullWidth : {}) }}>
      <label style={styles.label}>
        {label}
        {required && <span style={styles.required}> *</span>}
      </label>
      {children}
      {hint && <div style={styles.hint}>{hint}</div>}
    </div>
  )
}

const styles = {
  page: {
    minHeight: 'calc(100vh - 80px)',
    background: '#f8fafc',
    padding: '32px 24px 55px',
    color: '#0f172a',
  },
  container: {
    width: '100%',
    maxWidth: 1000,
    margin: '0 auto',
  },
  topBar: {
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
  header: {
    marginBottom: 20,
  },
  eyebrow: {
    marginBottom: 8,
    color: '#2563eb',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.13em',
  },
  title: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.15,
    fontWeight: 750,
    letterSpacing: '-0.03em',
  },
  subtitle: {
    margin: '7px 0 0',
    color: '#64748b',
    fontSize: 14,
  },
  shopBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 13,
    padding: '16px 18px',
    marginBottom: 17,
    border: '1px solid #bfdbfe',
    borderRadius: 14,
    background: '#f8fbff',
  },
  shopIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    background: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #dbeafe',
  },
  shopInfo: {
    minWidth: 0,
    flex: 1,
  },
  shopEyebrow: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.08em',
  },
  shopName: {
    marginTop: 2,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: 750,
  },
  shopAddress: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 12,
    lineHeight: 1.4,
  },
  inheritedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 9px',
    borderRadius: 8,
    background: '#f0fdf4',
    color: '#15803d',
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  card: {
    padding: 23,
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 3px 14px rgba(15, 23, 42, 0.04)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    paddingBottom: 18,
    marginBottom: 19,
    borderBottom: '1px solid #f1f5f9',
  },
  cardHeaderIcon: {
    width: 38,
    height: 38,
    display: 'grid',
    placeItems: 'center',
    borderRadius: 10,
    background: '#eff6ff',
    color: '#2563eb',
  },
  cardTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 720,
  },
  cardDescription: {
    margin: '3px 0 0',
    color: '#64748b',
    fontSize: 12.5,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '19px 22px',
  },
  field: {
    minWidth: 0,
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  label: {
    display: 'block',
    marginBottom: 7,
    color: '#334155',
    fontSize: 12.5,
    fontWeight: 700,
  },
  required: {
    color: '#dc2626',
  },
  input: {
    width: '100%',
    height: 44,
    boxSizing: 'border-box',
    padding: '0 12px',
    border: '1px solid #cbd5e1',
    borderRadius: 9,
    background: '#fff',
    color: '#0f172a',
    fontSize: 13,
    outline: 'none',
  },
  hint: {
    marginTop: 5,
    color: '#94a3b8',
    fontSize: 10.5,
    lineHeight: 1.35,
  },
  inheritanceCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 11,
    marginTop: 15,
    padding: '13px 15px',
    border: '1px solid #bbf7d0',
    borderRadius: 12,
    background: '#f0fdf4',
  },
  inheritanceIcon: {
    color: '#16a34a',
    marginTop: 1,
    flexShrink: 0,
  },
  inheritanceTitle: {
    margin: 0,
    color: '#166534',
    fontSize: 13,
    fontWeight: 750,
  },
  inheritanceText: {
    margin: '4px 0 0',
    color: '#4d7c5a',
    fontSize: 11.5,
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 9,
    marginTop: 17,
  },
  cancelButton: {
    height: 41,
    padding: '0 15px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #cbd5e1',
    borderRadius: 9,
    background: '#fff',
    color: '#475569',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 650,
  },
  submitButton: {
    height: 41,
    padding: '0 16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: 0,
    borderRadius: 9,
    background: '#1d4ed8',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  footerNote: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: '10px 12px',
    borderRadius: 9,
    background: '#f1f5f9',
    color: '#64748b',
    fontSize: 11,
    lineHeight: 1.45,
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
    padding: '11px 13px',
    border: '1px solid #fecaca',
    borderRadius: 10,
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
    marginTop: 20,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 11,
    padding: 19,
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
    margin: '4px 0 0',
    color: '#991b1b',
    fontSize: 13,
  },
  spin: {
    animation: 'addInstrumentSpin 1s linear infinite',
  },
}

const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes addInstrumentSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 760px) {
    .add-instrument-form-grid {
      grid-template-columns: 1fr !important;
    }
  }
`
document.head.appendChild(styleSheet)
