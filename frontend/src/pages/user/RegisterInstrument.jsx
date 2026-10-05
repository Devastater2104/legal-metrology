import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import { useAuth } from '../../context/AuthContext'
import { createInstrument } from '../../services/instrumentService'

const DEFAULT_CENTER = [23.7957, 86.4304]

const initialForm = {
  instrument_type: '',
  measurement_type: '',
  manufacturer: '',
  model: '',
  serial_number: '',
  capacity: '',
  accuracy_class: '',
  location: '',
  latitude: null,
  longitude: null,
}

/* ---------------------------------------------------------
   MAP CONTROLLER
--------------------------------------------------------- */

function MapController({ position }) {
  const map = useMap()

  useEffect(() => {
    if (!position) return

    map.flyTo(
      [position.latitude, position.longitude],
      16,
      {
        duration: 0.8,
      },
    )
  }, [map, position])

  return null
}

/* ---------------------------------------------------------
   LOCATION MARKER
--------------------------------------------------------- */

function LocationMarker({ position, onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
        fromMap: true,
      })
    },
  })

  if (!position) {
    return null
  }

  return (
    <Marker
      position={[
        position.latitude,
        position.longitude,
      ]}
      draggable
      eventHandlers={{
        dragend(event) {
          const coordinates =
            event.target.getLatLng()

          onSelect({
            latitude: Number(
              coordinates.lat.toFixed(6),
            ),
            longitude: Number(
              coordinates.lng.toFixed(6),
            ),
            fromMap: true,
          })
        },
      }}
    />
  )
}

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */

function RegisterInstrument() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(initialForm)

  const [error, setError] = useState('')
  const [submitting, setSubmitting] =
    useState(false)

  const [searchQuery, setSearchQuery] =
    useState('')
  const [searchResults, setSearchResults] =
    useState([])
  const [searching, setSearching] =
    useState(false)
  const [searchError, setSearchError] =
    useState('')

  /* -------------------------------------------------------
     FIELD UPDATE
  ------------------------------------------------------- */

  function updateField(event) {
    const {
      name,
      value,
    } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  /* -------------------------------------------------------
     MAP LOCATION SELECTION
  ------------------------------------------------------- */

  function selectLocation({
    latitude,
    longitude,
    address = '',
    fromMap = false,
  }) {
    setForm((current) => ({
      ...current,
      latitude,
      longitude,
      ...(address
        ? {
            location: address,
          }
        : fromMap &&
            !current.location
          ? {
              location: `Map location (${latitude}, ${longitude})`,
            }
          : {}),
    }))

    setSearchResults([])
  }

  /* -------------------------------------------------------
     SEARCH RESULT SELECTION
  ------------------------------------------------------- */

  function selectSearchResult(result) {
    const latitude = Number(
      result.lat,
    )

    const longitude = Number(
      result.lon,
    )

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return
    }

    setForm((current) => ({
      ...current,
      location:
        result.display_name,
      latitude: Number(
        latitude.toFixed(6),
      ),
      longitude: Number(
        longitude.toFixed(6),
      ),
    }))

    setSearchQuery(
      result.display_name,
    )

    setSearchResults([])
    setSearchError('')
  }

  /* -------------------------------------------------------
     LOCATION SEARCH
  ------------------------------------------------------- */

  async function searchLocation() {
    const query =
      searchQuery.trim()

    if (!query) {
      setSearchError(
        'Enter a shop, market, street or address to search.',
      )
      return
    }

    setSearching(true)
    setSearchError('')
    setSearchResults([])

    try {
      const response =
        await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`,
          {
            headers: {
              Accept:
                'application/json',
            },
          },
        )

      if (!response.ok) {
        throw new Error(
          'Unable to search this location.',
        )
      }

      const results =
        await response.json()

      if (
        !Array.isArray(
          results,
        ) ||
        results.length === 0
      ) {
        setSearchError(
          'No locations found. Try a more specific address.',
        )
        return
      }

      setSearchResults(
        results,
      )
    } catch (searchException) {
      setSearchError(
        searchException.message ||
          'Unable to search this location.',
      )
    } finally {
      setSearching(false)
    }
  }

  /* -------------------------------------------------------
     SUBMIT
  ------------------------------------------------------- */

  async function handleSubmit(
    event,
  ) {
    event.preventDefault()

    setError('')

    if (
      form.latitude === null ||
      form.longitude === null
    ) {
      setError(
        'Please select the shop location on the map before registering.',
      )
      return
    }

    if (
      !form.location.trim()
    ) {
      setError(
        'Please select or enter the shop address.',
      )
      return
    }

    setSubmitting(true)

    try {
      await createInstrument(
        form,
        token,
      )

      navigate(
        '/user/instruments',
        {
          replace: true,
          state: {
            success:
              'Instrument registered successfully.',
          },
        },
      )
    } catch (submitError) {
      setError(
        submitError.message ||
          'Unable to register instrument.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPosition =
    form.latitude !== null &&
    form.longitude !== null
      ? {
          latitude:
            form.latitude,
          longitude:
            form.longitude,
        }
      : null

  /* -------------------------------------------------------
     SHARED STYLES
  ------------------------------------------------------- */

  const pageStyle = {
    maxWidth: '1180px',
    margin: '0 auto',
    padding:
      '34px 28px 60px',
  }

  const cardStyle = {
    background: '#ffffff',
    border:
      '1px solid #e2e8f0',
    borderRadius: '16px',
    marginBottom: '20px',
    overflow: 'hidden',
    boxShadow:
      '0 1px 3px rgba(15, 23, 42, 0.04)',
  }

  const cardHeaderStyle = {
    padding:
      '22px 26px 18px',
    borderBottom:
      '1px solid #eef2f7',
  }

  const cardBodyStyle = {
    padding: '24px 26px 28px',
  }

  const fieldStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  }

  const labelStyle = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
  }

  const inputStyle = {
    width: '100%',
    height: '44px',
    padding:
      '0 13px',
    border:
      '1px solid #cbd5e1',
    borderRadius: '9px',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: '14px',
    outline: 'none',
    boxSizing:
      'border-box',
  }

  const textareaStyle = {
    width: '100%',
    minHeight: '108px',
    padding:
      '11px 13px',
    border:
      '1px solid #cbd5e1',
    borderRadius: '9px',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: '14px',
    lineHeight: 1.5,
    resize: 'vertical',
    outline: 'none',
    boxSizing:
      'border-box',
    fontFamily:
      'inherit',
  }

  return (
    <main
      style={{
        minHeight:
          '100vh',
        background:
          '#f8fafc',
      }}
    >
      <div style={pageStyle}>

        {/* =================================================
            PAGE HEADER
        ================================================== */}

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems:
              'flex-start',
            gap: '20px',
            marginBottom:
              '26px',
          }}
        >
          <div>
            <div
              style={{
                fontSize:
                  '12px',
                fontWeight: 700,
                letterSpacing:
                  '0.08em',
                textTransform:
                  'uppercase',
                color:
                  '#2563eb',
                marginBottom:
                  '7px',
              }}
            >
              Business Portal
            </div>

            <h1
              style={{
                margin: 0,
                fontSize:
                  '28px',
                lineHeight: 1.2,
                fontWeight: 700,
                color:
                  '#0f172a',
              }}
            >
              Register Instrument
            </h1>

            <p
              style={{
                margin:
                  '8px 0 0',
                fontSize:
                  '14px',
                color:
                  '#64748b',
              }}
            >
              Add a measuring instrument
              to your business profile.
            </p>
          </div>

          <Link
            to="/user/instruments"
            style={{
              display: 'inline-flex',
              alignItems:
                'center',
              gap: '7px',
              height: '40px',
              padding:
                '0 15px',
              border:
                '1px solid #cbd5e1',
              borderRadius:
                '9px',
              background:
                '#ffffff',
              color:
                '#334155',
              textDecoration:
                'none',
              fontSize:
                '13px',
              fontWeight: 600,
              whiteSpace:
                'nowrap',
            }}
          >
            ← Back to Instruments
          </Link>
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              padding:
                '12px 15px',
              marginBottom:
                '20px',
              borderRadius:
                '9px',
              border:
                '1px solid #fecaca',
              background:
                '#fef2f2',
              color:
                '#b91c1c',
              fontSize:
                '14px',
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
        >

          {/* =================================================
              INSTRUMENT DETAILS
          ================================================== */}

          <section
            style={cardStyle}
          >
            <div
              style={cardHeaderStyle}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize:
                    '17px',
                  fontWeight: 700,
                  color:
                    '#0f172a',
                }}
              >
                Instrument Details
              </h2>

              <p
                style={{
                  margin:
                    '5px 0 0',
                  fontSize:
                    '13px',
                  color:
                    '#64748b',
                }}
              >
                Enter the basic information
                about the measuring instrument.
              </p>
            </div>

            <div
              style={cardBodyStyle}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2, minmax(0, 1fr))',
                  columnGap:
                    '22px',
                  rowGap:
                    '20px',
                }}
              >

                {/* Instrument Type */}

                <div
                  style={
                    fieldStyle
                  }
                >
                  <label
                    htmlFor="instrument_type"
                    style={
                      labelStyle
                    }
                  >
                    Instrument Type
                    <span
                      style={{
                        color:
                          '#dc2626',
                        marginLeft:
                          '3px',
                      }}
                    >
                      *
                    </span>
                  </label>

                  <select
                    id="instrument_type"
                    name="instrument_type"
                    value={
                      form.instrument_type
                    }
                    onChange={
                      updateField
                    }
                    required
                    style={
                      inputStyle
                    }
                  >
                    <option value="">
                      Select instrument type
                    </option>

                    <option value="Electronic Weighing Scale">
                      Electronic Weighing Scale
                    </option>

                    <option value="Platform Weighing Scale">
                      Platform Weighing Scale
                    </option>

                    <option value="Counter Weighing Scale">
                      Counter Weighing Scale
                    </option>

                    <option value="Weighbridge">
                      Weighbridge
                    </option>

                    <option value="Spring Balance">
                      Spring Balance
                    </option>

                    <option value="Beam Scale">
                      Beam Scale
                    </option>

                    <option value="Measuring Instrument">
                      Measuring Instrument
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
                </div>

                {/* Measurement Type */}

                <div
                  style={
                    fieldStyle
                  }
                >
                  <label
                    htmlFor="measurement_type"
                    style={
                      labelStyle
                    }
                  >
                    Measurement Type
                    <span
                      style={{
                        color:
                          '#dc2626',
                        marginLeft:
                          '3px',
                      }}
                    >
                      *
                    </span>
                  </label>

                  <select
                    id="measurement_type"
                    name="measurement_type"
                    value={
                      form.measurement_type
                    }
                    onChange={
                      updateField
                    }
                    required
                    style={
                      inputStyle
                    }
                  >
                    <option value="">
                      Select what the instrument measures
                    </option>

                    <option value="Weight">
                      Weight
                    </option>

                    <option value="Volume">
                      Volume / Liquid
                    </option>

                    <option value="Temperature">
                      Temperature
                    </option>
                  </select>

                  <span
                    style={{
                      fontSize:
                        '11px',
                      color:
                        '#64748b',
                    }}
                  >
                    Used to select the
                    appropriate Smart
                    e-MānakSetu Verifier
                    module.
                  </span>
                </div>

                {/* Manufacturer */}

                <div
                  style={
                    fieldStyle
                  }
                >
                  <label
                    htmlFor="manufacturer"
                    style={
                      labelStyle
                    }
                  >
                    Manufacturer
                    <span
                      style={{
                        color:
                          '#dc2626',
                        marginLeft:
                          '3px',
                      }}
                    >
                      *
                    </span>
                  </label>

                  <input
                    id="manufacturer"
                    name="manufacturer"
                    value={
                      form.manufacturer
                    }
                    onChange={
                      updateField
                    }
                    placeholder="e.g. Avery"
                    required
                    style={
                      inputStyle
                    }
                  />
                </div>

                {/* Model */}

                <div
                  style={
                    fieldStyle
                  }
                >
                  <label
                    htmlFor="model"
                    style={
                      labelStyle
                    }
                  >
                    Model
                  </label>

                  <input
                    id="model"
                    name="model"
                    value={
                      form.model
                    }
                    onChange={
                      updateField
                    }
                    placeholder="Enter model number"
                    style={
                      inputStyle
                    }
                  />
                </div>

                {/* Serial */}

                <div
                  style={
                    fieldStyle
                  }
                >
                  <label
                    htmlFor="serial_number"
                    style={
                      labelStyle
                    }
                  >
                    Serial Number
                    <span
                      style={{
                        color:
                          '#dc2626',
                        marginLeft:
                          '3px',
                      }}
                    >
                      *
                    </span>
                  </label>

                  <input
                    id="serial_number"
                    name="serial_number"
                    value={
                      form.serial_number
                    }
                    onChange={
                      updateField
                    }
                    placeholder="Enter serial number"
                    required
                    style={
                      inputStyle
                    }
                  />
                </div>

                {/* Capacity */}

                <div
                  style={
                    fieldStyle
                  }
                >
                  <label
                    htmlFor="capacity"
                    style={
                      labelStyle
                    }
                  >
                    Capacity
                  </label>

                  <input
                    id="capacity"
                    name="capacity"
                    value={
                      form.capacity
                    }
                    onChange={
                      updateField
                    }
                    placeholder={
                      form.measurement_type ===
                      'Weight'
                        ? 'e.g. 30 kg'
                        : form.measurement_type ===
                            'Volume'
                          ? 'e.g. 2 L'
                          : form.measurement_type ===
                              'Temperature'
                            ? 'e.g. 100 °C'
                            : 'Enter capacity'
                    }
                    style={
                      inputStyle
                    }
                  />
                </div>

                {/* Accuracy */}

                <div
                  style={
                    fieldStyle
                  }
                >
                  <label
                    htmlFor="accuracy_class"
                    style={
                      labelStyle
                    }
                  >
                    Accuracy / Class
                  </label>

                  <select
                    id="accuracy_class"
                    name="accuracy_class"
                    value={
                      form.accuracy_class
                    }
                    onChange={
                      updateField
                    }
                    style={
                      inputStyle
                    }
                  >
                    <option value="">
                      Select accuracy/class
                    </option>

                    <option value="Class I">
                      Class I
                    </option>

                    <option value="Class II">
                      Class II
                    </option>

                    <option value="Class III">
                      Class III
                    </option>

                    <option value="Class IIII">
                      Class IIII
                    </option>

                    <option value="Other / Not specified">
                      Other / Not specified
                    </option>
                  </select>
                </div>

              </div>
            </div>
          </section>

          {/* =================================================
              SHOP LOCATION
          ================================================== */}

          <section
            style={cardStyle}
          >
            <div
              style={cardHeaderStyle}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize:
                    '17px',
                  fontWeight: 700,
                  color:
                    '#0f172a',
                }}
              >
                Shop Location
              </h2>

              <p
                style={{
                  margin:
                    '5px 0 0',
                  fontSize:
                    '13px',
                  color:
                    '#64748b',
                }}
              >
                Search for the business
                location and select the exact
                position on the map.
              </p>
            </div>

            <div
              style={cardBodyStyle}
            >

              {/* SEARCH */}

              <div
                style={
                  fieldStyle
                }
              >
                <label
                  htmlFor="location-search"
                  style={
                    labelStyle
                  }
                >
                  Search Shop / Address
                </label>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr auto',
                    gap:
                      '10px',
                  }}
                >
                  <input
                    id="location-search"
                    value={
                      searchQuery
                    }
                    onChange={(
                      event,
                    ) =>
                      setSearchQuery(
                        event.target
                          .value,
                      )
                    }
                    onKeyDown={(
                      event,
                    ) => {
                      if (
                        event.key ===
                        'Enter'
                      ) {
                        event.preventDefault()
                        searchLocation()
                      }
                    }}
                    placeholder="Search shop, market, street or address"
                    style={
                      inputStyle
                    }
                  />

                  <button
                    type="button"
                    onClick={
                      searchLocation
                    }
                    disabled={
                      searching
                    }
                    style={{
                      height:
                        '44px',
                      minWidth:
                        '105px',
                      padding:
                        '0 18px',
                      border:
                        'none',
                      borderRadius:
                        '9px',
                      background:
                        '#16345f',
                      color:
                        '#ffffff',
                      fontSize:
                        '13px',
                      fontWeight: 600,
                      cursor:
                        searching
                          ? 'not-allowed'
                          : 'pointer',
                      opacity:
                        searching
                          ? 0.7
                          : 1,
                    }}
                  >
                    {searching
                      ? 'Searching...'
                      : 'Search'}
                  </button>
                </div>
              </div>

              {/* SEARCH RESULTS */}

              {searchResults.length >
                0 && (
                <div
                  style={{
                    marginTop:
                      '16px',
                  }}
                >
                  <div
                    style={{
                      marginBottom:
                        '8px',
                      fontSize:
                        '12px',
                      fontWeight: 700,
                      color:
                        '#475569',
                      textTransform:
                        'uppercase',
                      letterSpacing:
                        '0.04em',
                    }}
                  >
                    Search Results
                  </div>

                  <div
                    style={{
                      display:
                        'grid',
                      gap:
                        '7px',
                    }}
                  >
                    {searchResults.map(
                      (
                        result,
                        index,
                      ) => (
                        <button
                          key={`${result.place_id || result.osm_id || 'location'}-${index}`}
                          type="button"
                          onClick={() =>
                            selectSearchResult(
                              result,
                            )
                          }
                          style={{
                            width:
                              '100%',
                            textAlign:
                              'left',
                            padding:
                              '12px 14px',
                            border:
                              '1px solid #dbe3ef',
                            borderRadius:
                              '9px',
                            background:
                              '#ffffff',
                            cursor:
                              'pointer',
                          }}
                        >
                          <div
                            style={{
                              fontSize:
                                '13px',
                              fontWeight:
                                600,
                              color:
                                '#0f172a',
                              lineHeight:
                                1.45,
                            }}
                          >
                            {
                              result.display_name
                            }
                          </div>

                          <div
                            style={{
                              marginTop:
                                '3px',
                              fontSize:
                                '11px',
                              color:
                                '#64748b',
                            }}
                          >
                            Select this
                            location
                          </div>
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}

              {searchError && (
                <div
                  style={{
                    marginTop:
                      '12px',
                    padding:
                      '10px 12px',
                    border:
                      '1px solid #fecaca',
                    borderRadius:
                      '8px',
                    background:
                      '#fef2f2',
                    color:
                      '#b91c1c',
                    fontSize:
                      '13px',
                  }}
                >
                  {searchError}
                </div>
              )}

              {/* MAP */}

              <div
                style={{
                  marginTop:
                    '18px',
                  border:
                    '1px solid #dbe3ef',
                  borderRadius:
                    '12px',
                  overflow:
                    'hidden',
                  boxShadow:
                    '0 2px 8px rgba(15, 23, 42, 0.05)',
                }}
              >
                <MapContainer
                  center={
                    DEFAULT_CENTER
                  }
                  zoom={5}
                  scrollWheelZoom
                  style={{
                    height:
                      '370px',
                    width:
                      '100%',
                  }}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapController
                    position={
                      selectedPosition
                    }
                  />

                  <LocationMarker
                    position={
                      selectedPosition
                    }
                    onSelect={
                      selectLocation
                    }
                  />
                </MapContainer>
              </div>

              {/* MAP INSTRUCTIONS */}

              <div
                style={{
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap:
                    '9px',
                  marginTop:
                    '12px',
                  padding:
                    '11px 13px',
                  border:
                    '1px solid #e2e8f0',
                  borderRadius:
                    '9px',
                  background:
                    '#f8fafc',
                  color:
                    '#64748b',
                  fontSize:
                    '12px',
                }}
              >
                <span
                  style={{
                    display:
                      'inline-flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    width:
                      '22px',
                    height:
                      '22px',
                    borderRadius:
                      '50%',
                    background:
                      '#e0ecff',
                    color:
                      '#2563eb',
                    fontWeight:
                      700,
                    flexShrink: 0,
                  }}
                >
                  i
                </span>

                <span>
                  Search for the shop,
                  select a result, or
                  click directly on the
                  map. Drag the marker to
                  fine-tune the exact
                  position.
                </span>
              </div>

              {/* SELECTED LOCATION */}

              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    'minmax(0, 1.6fr) minmax(280px, 0.8fr)',
                  gap:
                    '18px',
                  marginTop:
                    '20px',
                }}
              >

                {/* ADDRESS */}

                <div
                  style={
                    fieldStyle
                  }
                >
                  <label
                    htmlFor="location"
                    style={
                      labelStyle
                    }
                  >
                    Selected Shop Address
                    <span
                      style={{
                        color:
                          '#dc2626',
                        marginLeft:
                          '3px',
                      }}
                    >
                      *
                    </span>
                  </label>

                  <textarea
                    id="location"
                    name="location"
                    value={
                      form.location
                    }
                    onChange={
                      updateField
                    }
                    rows={4}
                    placeholder="Select a location on the map"
                    required
                    style={
                      textareaStyle
                    }
                  />
                </div>

                {/* GPS */}

                <div
                  style={{
                    padding:
                      '17px',
                    border:
                      '1px solid #dbe3ef',
                    borderRadius:
                      '11px',
                    background:
                      '#f8fafc',
                    minHeight:
                      '108px',
                  }}
                >
                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'center',
                      marginBottom:
                        '14px',
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          '13px',
                        fontWeight:
                          700,
                        color:
                          '#334155',
                      }}
                    >
                      GPS Coordinates
                    </span>

                    {selectedPosition && (
                      <span
                        style={{
                          padding:
                            '4px 8px',
                          borderRadius:
                            '999px',
                          background:
                            '#ecfdf5',
                          color:
                            '#047857',
                          fontSize:
                            '10px',
                          fontWeight:
                            700,
                        }}
                      >
                        SELECTED
                      </span>
                    )}
                  </div>

                  {selectedPosition ? (
                    <div
                      style={{
                        display:
                          'grid',
                        gridTemplateColumns:
                          '1fr 1fr',
                        gap:
                          '14px',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize:
                              '11px',
                            color:
                              '#64748b',
                            marginBottom:
                              '4px',
                          }}
                        >
                          Latitude
                        </div>

                        <strong
                          style={{
                            fontSize:
                              '14px',
                            color:
                              '#0f172a',
                          }}
                        >
                          {selectedPosition.latitude.toFixed(
                            6,
                          )}
                        </strong>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize:
                              '11px',
                            color:
                              '#64748b',
                            marginBottom:
                              '4px',
                          }}
                        >
                          Longitude
                        </div>

                        <strong
                          style={{
                            fontSize:
                              '14px',
                            color:
                              '#0f172a',
                          }}
                        >
                          {selectedPosition.longitude.toFixed(
                            6,
                          )}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        color:
                          '#94a3b8',
                        fontSize:
                          '13px',
                        lineHeight:
                          1.5,
                      }}
                    >
                      No location selected.
                      Search for the shop
                      or click on the map.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              ACTIONS
          ================================================== */}

          <div
            style={{
              display:
                'flex',
              justifyContent:
                'flex-end',
              alignItems:
                'center',
              gap:
                '10px',
              marginTop:
                '4px',
            }}
          >
            <Link
              to="/user/instruments"
              style={{
                display:
                  'inline-flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                height:
                  '42px',
                padding:
                  '0 18px',
                border:
                  '1px solid #cbd5e1',
                borderRadius:
                  '9px',
                background:
                  '#ffffff',
                color:
                  '#334155',
                textDecoration:
                  'none',
                fontSize:
                  '13px',
                fontWeight:
                  600,
              }}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                submitting
              }
              style={{
                display:
                  'inline-flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                height:
                  '42px',
                minWidth:
                  '160px',
                padding:
                  '0 20px',
                border:
                  'none',
                borderRadius:
                  '9px',
                background:
                  '#16345f',
                color:
                  '#ffffff',
                fontSize:
                  '13px',
                fontWeight:
                  600,
                cursor:
                  submitting
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  submitting
                    ? 0.7
                    : 1,
              }}
            >
              {submitting
                ? 'Registering...'
                : 'Register Instrument'}
            </button>
          </div>
        </form>
      </div>

      {/* =====================================================
          RESPONSIVE
      ====================================================== */}

      <style>
        {`
          @media (max-width: 800px) {
            .register-instrument-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 650px) {
            .register-page-header {
              flex-direction: column !important;
            }

            .register-search-row {
              grid-template-columns: 1fr !important;
            }

            .register-search-row button {
              width: 100%;
            }

            .register-location-grid {
              grid-template-columns: 1fr !important;
            }

            .register-gps-values {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </main>
  )
}

export default RegisterInstrument