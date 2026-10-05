import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Plus,
  Search,
  Store,
  TriangleAlert,
} from 'lucide-react'

import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import { useAuth } from '../../context/AuthContext'
import { createShop } from '../../services/shopService'

const DEFAULT_CENTER = {
  latitude: 23.7957,
  longitude: 86.4304,
}

function MapController({ position }) {
  const map = useMap()

  if (position) {
    map.setView(
      [position.latitude, position.longitude],
      Math.max(map.getZoom(), 15),
      { animate: true },
    )
  }

  return null
}

function LocationPicker({ position, onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      })
    },
  })

  if (!position) return null

  return (
    <Marker
      position={[position.latitude, position.longitude]}
      draggable
      eventHandlers={{
        dragend(event) {
          const point = event.target.getLatLng()

          onSelect({
            latitude: Number(point.lat.toFixed(6)),
            longitude: Number(point.lng.toFixed(6)),
          })
        },
      }}
    />
  )
}

export default function AddShop() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    gst_number: '',
    address: '',
    latitude: DEFAULT_CENTER.latitude,
    longitude: DEFAULT_CENTER.longitude,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const [error, setError] = useState('')
  const [searchError, setSearchError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function selectLocation(location) {
    setForm((current) => ({
      ...current,
      latitude: location.latitude,
      longitude: location.longitude,
      ...(location.address ? { address: location.address } : {}),
    }))
  }

  async function searchLocation() {
    const query = searchQuery.trim()

    if (!query) {
      setSearchError('Enter a shop, market, street or address.')
      return
    }

    setSearching(true)
    setSearchError('')
    setSearchResults([])

    try {
      const url =
        'https://nominatim.openstreetmap.org/search?' +
        new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '5',
          countrycodes: 'in',
        }).toString()

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Location search is temporarily unavailable.')
      }

      const results = await response.json()

      if (!Array.isArray(results) || results.length === 0) {
        setSearchError('No matching location found. Try a more specific address.')
        return
      }

      setSearchResults(results)
    } catch (searchException) {
      setSearchError(
        searchException?.message ||
          'Unable to search this location. You can still place the marker manually.',
      )
    } finally {
      setSearching(false)
    }
  }

  function selectSearchResult(result) {
    const latitude = Number(result.lat)
    const longitude = Number(result.lon)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setSearchError('The selected location has invalid coordinates.')
      return
    }

    setForm((current) => ({
      ...current,
      address: result.display_name || current.address,
      latitude,
      longitude,
    }))

    setSearchQuery(result.display_name || '')
    setSearchResults([])
    setSearchError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')

    if (!form.name.trim()) {
      setError('Shop / Business Name is required.')
      return
    }

    if (!form.address.trim()) {
      setError('Business Address is required.')
      return
    }

    if (!Number.isFinite(form.latitude) || !Number.isFinite(form.longitude)) {
      setError('Please select a valid shop location on the map.')
      return
    }

    setSubmitting(true)

    try {
      await createShop(
        {
          name: form.name.trim(),
          gst_number: form.gst_number.trim() || null,
          address: form.address.trim(),
          latitude: form.latitude,
          longitude: form.longitude,
        },
        token,
      )

      navigate('/user/shops', { replace: true })
    } catch (submitError) {
      setError(
        submitError?.message ||
          'Unable to create the shop. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topRow}>
          <div>
            <div style={styles.eyebrow}>BUSINESS PORTAL</div>
            <h1 style={styles.title}>Add Shop</h1>
            <p style={styles.subtitle}>
              Register a business location before adding measuring instruments.
            </p>
          </div>

          <Link to="/user/shops" style={styles.backButton}>
            <ArrowLeft size={16} />
            Back to Shops
          </Link>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <TriangleAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section style={styles.card}>
            <div style={styles.sectionHeading}>
              <div style={styles.sectionIcon}>
                <Building2 size={19} />
              </div>
              <div>
                <h2 style={styles.sectionTitle}>Business Details</h2>
                <p style={styles.sectionDescription}>
                  Enter the identity and registration details of your shop.
                </p>
              </div>
            </div>

            <div style={styles.formGrid}>
              <Field
                label="Shop / Business Name"
                required
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="e.g. Sharma General Store"
              />

              <Field
                label="GST Number"
                name="gst_number"
                value={form.gst_number}
                onChange={updateField}
                placeholder="e.g. 20ABCDE1234F1Z5"
                maxLength={15}
              />

              <div style={styles.fullWidth}>
                <label style={styles.label}>
                  Business Address <span style={styles.required}>*</span>
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={updateField}
                  placeholder="Complete shop address"
                  rows={3}
                  style={styles.textarea}
                />
              </div>
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.sectionHeading}>
              <div style={styles.sectionIcon}>
                <MapPin size={19} />
              </div>
              <div>
                <h2 style={styles.sectionTitle}>Shop Location</h2>
                <p style={styles.sectionDescription}>
                  Search for the business location and select the exact position
                  on the map.
                </p>
              </div>
            </div>

            <div style={styles.searchRow}>
              <div style={styles.searchInputWrap}>
                <Search size={17} style={styles.searchIcon} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      searchLocation()
                    }
                  }}
                  placeholder="Search shop, market, street or address"
                  style={styles.searchInput}
                />
              </div>

              <button
                type="button"
                onClick={searchLocation}
                disabled={searching}
                style={styles.searchButton}
              >
                {searching ? (
                  <Loader2 size={16} style={styles.spin} />
                ) : (
                  <Search size={16} />
                )}
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searchError && (
              <div style={styles.searchError}>
                <TriangleAlert size={15} />
                {searchError}
              </div>
            )}

            {searchResults.length > 0 && (
              <div style={styles.results}>
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.place_id}-${index}`}
                    type="button"
                    onClick={() => selectSearchResult(result)}
                    style={styles.result}
                  >
                    <MapPin size={16} />
                    <span>{result.display_name}</span>
                  </button>
                ))}
              </div>
            )}

            <div style={styles.mapWrap}>
              <MapContainer
                center={[form.latitude, form.longitude]}
                zoom={14}
                scrollWheelZoom
                style={styles.map}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController
                  position={{
                    latitude: form.latitude,
                    longitude: form.longitude,
                  }}
                />
                <LocationPicker
                  position={{
                    latitude: form.latitude,
                    longitude: form.longitude,
                  }}
                  onSelect={selectLocation}
                />
              </MapContainer>
            </div>

            <div style={styles.locationInfo}>
              <div>
                <span style={styles.locationLabel}>Selected coordinates</span>
                <strong style={styles.coordinates}>
                  {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                </strong>
              </div>

              <div style={styles.locationHint}>
                <CheckCircle2 size={16} />
                Click the map or drag the marker to adjust the exact shop
                location.
              </div>
            </div>
          </section>

          <section style={styles.infoCard}>
            <Store size={18} />
            <div>
              <strong>Shop information becomes the business master record</strong>
              <p>
                Your registered instruments will inherit this shop's address,
                GST details and GPS coordinates automatically.
              </p>
            </div>
          </section>

          <div style={styles.footer}>
            <Link to="/user/shops" style={styles.cancelButton}>
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              style={styles.submitButton}
            >
              {submitting ? (
                <Loader2 size={17} style={styles.spin} />
              ) : (
                <Plus size={17} />
              )}
              {submitting ? 'Creating Shop...' : 'Add Shop'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

function Field({
  label,
  required,
  name,
  value,
  onChange,
  placeholder,
  maxLength,
}) {
  return (
    <div>
      <label style={styles.label}>
        {label} {required && <span style={styles.required}>*</span>}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        style={styles.input}
      />
    </div>
  )
}

const styles = {
  page: {
    minHeight: 'calc(100vh - 80px)',
    background: '#f8fafc',
    padding: '32px 24px 60px',
    color: '#0f172a',
  },
  container: {
    maxWidth: 1040,
    margin: '0 auto',
  },
  topRow: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 24,
    marginBottom: 22,
  },
  eyebrow: {
    marginBottom: 7,
    color: '#2563eb',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.14em',
  },
  title: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.1,
    fontWeight: 750,
    letterSpacing: '-0.035em',
  },
  subtitle: {
    margin: '7px 0 0',
    color: '#64748b',
    fontSize: 14,
  },
  backButton: {
    height: 40,
    padding: '0 13px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    border: '1px solid #cbd5e1',
    borderRadius: 9,
    background: '#fff',
    color: '#475569',
    textDecoration: 'none',
    fontSize: 12.5,
    fontWeight: 700,
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    marginBottom: 16,
    padding: '11px 13px',
    border: '1px solid #fecaca',
    borderRadius: 10,
    background: '#fef2f2',
    color: '#991b1b',
    fontSize: 13,
  },
  card: {
    marginBottom: 16,
    padding: 22,
    border: '1px solid #e2e8f0',
    borderRadius: 15,
    background: '#fff',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
  },
  sectionHeading: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    borderRadius: 11,
    background: '#eff6ff',
    color: '#2563eb',
  },
  sectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 750,
  },
  sectionDescription: {
    margin: '3px 0 0',
    color: '#64748b',
    fontSize: 12.5,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 18,
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  label: {
    display: 'block',
    marginBottom: 7,
    color: '#334155',
    fontSize: 12,
    fontWeight: 700,
  },
  required: {
    color: '#dc2626',
  },
  input: {
    width: '100%',
    height: 43,
    boxSizing: 'border-box',
    padding: '0 12px',
    border: '1px solid #cbd5e1',
    borderRadius: 9,
    outline: 'none',
    background: '#fff',
    color: '#0f172a',
    fontSize: 13,
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: 9,
    outline: 'none',
    resize: 'vertical',
    background: '#fff',
    color: '#0f172a',
    fontSize: 13,
    lineHeight: 1.5,
  },
  searchRow: {
    display: 'flex',
    gap: 9,
    marginBottom: 8,
  },
  searchInputWrap: {
    position: 'relative',
    flex: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
  },
  searchInput: {
    width: '100%',
    height: 43,
    boxSizing: 'border-box',
    padding: '0 12px 0 38px',
    border: '1px solid #cbd5e1',
    borderRadius: 9,
    outline: 'none',
    fontSize: 13,
  },
  searchButton: {
    height: 43,
    padding: '0 17px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    border: 0,
    borderRadius: 9,
    background: '#2563eb',
    color: '#fff',
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
  },
  searchError: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    margin: '8px 0',
    color: '#b45309',
    fontSize: 12,
  },
  results: {
    margin: '7px 0 10px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    borderRadius: 9,
    background: '#fff',
  },
  result: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 9,
    padding: '10px 12px',
    border: 0,
    borderBottom: '1px solid #f1f5f9',
    background: '#fff',
    color: '#334155',
    textAlign: 'left',
    fontSize: 12,
    lineHeight: 1.45,
    cursor: 'pointer',
  },
  mapWrap: {
    overflow: 'hidden',
    marginTop: 12,
    border: '1px solid #cbd5e1',
    borderRadius: 12,
  },
  map: {
    width: '100%',
    height: 380,
  },
  locationInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    marginTop: 12,
    padding: '11px 13px',
    borderRadius: 9,
    background: '#f8fafc',
  },
  locationLabel: {
    display: 'block',
    marginBottom: 3,
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  coordinates: {
    color: '#334155',
    fontSize: 12,
    fontWeight: 700,
  },
  locationHint: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    color: '#64748b',
    fontSize: 11.5,
  },
  infoCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
    padding: '13px 15px',
    border: '1px solid #dbeafe',
    borderRadius: 11,
    background: '#eff6ff',
    color: '#2563eb',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 9,
  },
  cancelButton: {
    height: 42,
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
    fontWeight: 700,
  },
  submitButton: {
    height: 42,
    padding: '0 17px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    border: 0,
    borderRadius: 9,
    background: '#1d4ed8',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  spin: {
    animation: 'addShopSpin 1s linear infinite',
  },
}

const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes addShopSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 700px) {
    .add-shop-form-grid {
      grid-template-columns: 1fr !important;
    }
  }
`
document.head.appendChild(styleSheet)
