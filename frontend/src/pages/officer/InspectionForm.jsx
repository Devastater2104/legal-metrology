import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { useAuth } from '../../context/AuthContext'
import { getAssignedApplications } from '../../services/officerService'
import { extractInspectionInfo, submitInspection } from '../../services/inspectionService'

function InspectionForm() {
  const { token } = useAuth()
  const { applicationId } = useParams()
  const navigate = useNavigate()

  const [application, setApplication] = useState(null)

  const [manufacturer, setManufacturer] = useState('')
  const [model, setModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [capacity, setCapacity] = useState('')

  const [measurement, setMeasurement] = useState('')
  const [observations, setObservations] = useState('')
  const [result, setResult] = useState('PASS')

  const [coordinates, setCoordinates] = useState(null)
  const [locationStatus, setLocationStatus] = useState('Requesting location...')

  const [photo, setPhoto] = useState(null)
  const [ocrResult, setOcrResult] = useState(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrError, setOcrError] = useState('')
  const [ocrConfirmed, setOcrConfirmed] = useState(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getAssignedApplications(token)
      .then((applications) => {
        const assigned = applications.find(
          (item) => item.id === Number(applicationId),
        )

        if (!assigned) {
          setError('Assigned application not found.')
        }

        setApplication(assigned || null)
      })
      .catch((loadError) => {
        setError(loadError.message || 'Unable to load application.')
      })
      .finally(() => setLoading(false))
  }, [applicationId, token])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('Location is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,

          // Use the actual current browser time rather than relying
          // on the timestamp supplied by the geolocation provider.
          capturedAt: new Date().toISOString(),
        })

        setLocationStatus('Location captured')
      },
      (locationError) => {
        const messages = {
          1: 'Location permission was denied.',
          2: 'Location is currently unavailable.',
          3: 'Location request timed out.',
        }

        setLocationStatus(
          messages[locationError.code] || 'Unable to capture location.',
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (!coordinates) {
        setError('Capture the inspection location before submitting.')
        setSubmitting(false)
        return
      }

      await submitInspection(
        application.id,
        {
          measurement,
          observations: observations || null,
          result,

          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          captured_at: coordinates.capturedAt,

          // Manual entry and OCR both use the same inspection data structure.
          // OCR is optional; manual values are always allowed.
          ocr_data: {
            manufacturer: manufacturer || null,
            model: model || null,
            serial_number: serialNumber || null,
            capacity: capacity || null,

            raw_text: ocrResult?.raw_text || null,
            confidence: ocrResult?.confidence ?? null,
            confirmed: ocrResult ? ocrConfirmed : false,
          },

          photo_ids: ocrResult?.photo_id ? [ocrResult.photo_id] : [],
        },
        token,
      )

      navigate('/officer', { replace: true })
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit inspection.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOcr() {
    if (!photo) return

    setOcrLoading(true)
    setOcrError('')
    setOcrConfirmed(false)

    try {
      const extracted = await extractInspectionInfo(
        application.id,
        photo,
        token,
      )

      setOcrResult(extracted)

      // OCR provides suggestions.
      // The officer can still edit them manually afterwards.
      setManufacturer(extracted.manufacturer || '')
      setModel(extracted.model || '')
      setSerialNumber(extracted.serial_number || '')
      setCapacity(extracted.capacity || '')
    } catch (ocrRequestError) {
      setOcrError(
        ocrRequestError.message ||
          'Unable to extract information automatically.',
      )
    } finally {
      setOcrLoading(false)
    }
  }

  function updateOcrField(field, value) {
    setOcrResult((current) => ({
      ...current,
      [field]: value,
    }))

    setOcrConfirmed(false)

    if (field === 'manufacturer') {
      setManufacturer(value)
    }

    if (field === 'model') {
      setModel(value)
    }

    if (field === 'serial_number') {
      setSerialNumber(value)
    }

    if (field === 'capacity') {
      setCapacity(value)
    }
  }

  return (
    <main className="p-8">
      <Link
        to="/officer"
        className="text-sm text-blue-900 underline"
      >
        Back to officer dashboard
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-slate-900">
        Record Inspection
      </h1>

      <p className="mt-2 text-slate-600">
        Application #{applicationId}
      </p>

      {/* Location */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <p
          className={`font-medium ${
            coordinates ? 'text-green-700' : 'text-amber-700'
          }`}
        >
          {locationStatus}
        </p>

        {coordinates && (
          <p className="mt-2 text-sm text-slate-600">
            Latitude: {coordinates.latitude.toFixed(6)} | Longitude:{' '}
            {coordinates.longitude.toFixed(6)}
          </p>
        )}

        <p className="mt-2 text-xs text-slate-500">
          This records the browser/device-reported location at inspection
          time; it does not prove physical presence at the registered
          location.
        </p>
      </section>

      {/* Instrument details */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Instrument Details
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter the instrument details manually, or use optional OCR
            assistance below.
          </p>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Manufacturer
            <input
              value={manufacturer}
              onChange={(event) => {
                setManufacturer(event.target.value)
                setOcrConfirmed(false)
              }}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600"
              placeholder="Enter manufacturer"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Model
            <input
              value={model}
              onChange={(event) => {
                setModel(event.target.value)
                setOcrConfirmed(false)
              }}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600"
              placeholder="Enter model"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Serial number
            <input
              value={serialNumber}
              onChange={(event) => {
                setSerialNumber(event.target.value)
                setOcrConfirmed(false)
              }}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600"
              placeholder="Enter serial number"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Capacity
            <input
              value={capacity}
              onChange={(event) => {
                setCapacity(event.target.value)
                setOcrConfirmed(false)
              }}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600"
              placeholder="e.g. 30 kg"
            />
          </label>
        </div>
      </section>

      {/* Optional OCR */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Optional OCR Assistance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            OCR is optional. You can enter all instrument details manually.
            Upload a clear instrument photo only if you want OCR to suggest
            the details.
          </p>
        </div>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={(event) => {
            setPhoto(event.target.files?.[0] || null)
            setOcrResult(null)
            setOcrError('')
            setOcrConfirmed(false)
          }}
          className="mt-4 block w-full text-sm text-slate-600"
        />

        <button
          type="button"
          onClick={handleOcr}
          disabled={!photo || ocrLoading || loading || !application}
          className="mt-4 rounded-lg border border-blue-900 px-4 py-2 text-blue-900 disabled:opacity-50"
        >
          {ocrLoading
            ? 'Analyzing instrument image...'
            : 'Use OCR to Suggest Details'}
        </button>

        {!photo && (
          <p className="mt-2 text-xs text-slate-500">
            No photo is required if you prefer manual entry.
          </p>
        )}

        {ocrError && (
          <p
            className="mt-3 text-amber-700"
            role="alert"
          >
            {ocrError} Manual entry is still available.
          </p>
        )}

        {ocrResult && (
          <div className="mt-6 space-y-4">
            <p className="font-medium text-blue-900">
              OCR Suggestions
            </p>

            {[
              'manufacturer',
              'model',
              'serial_number',
              'capacity',
            ].map((field) => (
              <label
                key={field}
                className="block text-sm font-medium text-slate-700"
              >
                {field.replace('_', ' ')}

                <input
                  value={ocrResult[field] || ''}
                  onChange={(event) =>
                    updateOcrField(field, event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                />
              </label>
            ))}

            {ocrResult.registered_instrument && (
              <p className="text-sm text-slate-600">
                Registered serial:{' '}
                {ocrResult.registered_instrument.serial_number || '-'}{' '}
                | OCR serial: {ocrResult.serial_number || '-'}
                {ocrResult.serial_number &&
                ocrResult.serial_number ===
                  ocrResult.registered_instrument.serial_number
                  ? ' - Match'
                  : ' - Mismatch — Officer Review Required'}
              </p>
            )}

            <button
              type="button"
              onClick={() => setOcrConfirmed(true)}
              className={`rounded-lg px-4 py-2 ${
                ocrConfirmed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-900 text-white'
              }`}
            >
              {ocrConfirmed
                ? 'Details confirmed'
                : 'Use / Confirm Details'}
            </button>
          </div>
        )}
      </section>

      {loading && (
        <p className="mt-8 text-slate-600">
          Loading application...
        </p>
      )}

      {!loading && error && (
        <p
          className="mt-8 text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}

      {!loading && application && (
        <form
          onSubmit={handleSubmit}
          className="mt-8 max-w-2xl space-y-5 rounded-lg border border-slate-200 bg-white p-6"
        >
          {/* Measurement */}
          <label className="block text-sm font-medium text-slate-700">
            Measurement *

            <input
              value={measurement}
              onChange={(event) =>
                setMeasurement(event.target.value)
              }
              required
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600"
              placeholder="Enter measured value and unit"
            />
          </label>

          {/* Observations */}
          <label className="block text-sm font-medium text-slate-700">
            Observations

            <textarea
              value={observations}
              onChange={(event) =>
                setObservations(event.target.value)
              }
              rows="4"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600"
              placeholder="Enter inspection observations"
            />
          </label>

          {/* Result */}
          <label className="block text-sm font-medium text-slate-700">
            Result *

            <select
              value={result}
              onChange={(event) =>
                setResult(event.target.value)
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600"
            >
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={submitting || !coordinates}
            className="rounded-lg bg-blue-900 px-5 py-3 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {submitting
              ? 'Submitting...'
              : 'Submit Inspection'}
          </button>
        </form>
      )}
    </main>
  )
}

export default InspectionForm