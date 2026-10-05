import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { useAuth } from '../../context/AuthContext'
import { createApplication } from '../../services/applicationService'
import { getMyInstruments } from '../../services/instrumentService'

function RegisterApplication() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [instruments, setInstruments] = useState([])
  const [instrumentId, setInstrumentId] = useState('')
  const [notes, setNotes] = useState('')
  const [loadingInstruments, setLoadingInstruments] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyInstruments(token)
      .then(setInstruments)
      .catch((loadError) => setError(loadError.message || 'Unable to load instruments.'))
      .finally(() => setLoadingInstruments(false))
  }, [token])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await createApplication({ instrument_id: Number(instrumentId), notes: notes || null }, token)
      navigate('/user/applications', { replace: true, state: { success: 'Application submitted successfully.' } })
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit application.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="p-8">
      <div className="mb-8">
        <Link to="/user/applications" className="text-sm text-blue-900 underline">
          Back to applications
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">New Verification Application</h1>
        <p className="mt-2 text-slate-600">Select one of your registered instruments.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
          {error}
        </div>
      )}

      {!loadingInstruments && instruments.length === 0 && !error && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8">
          <p className="text-slate-700">Register an instrument before submitting an application.</p>
          <Link to="/user/instruments/new" className="mt-3 inline-block text-blue-900 underline">
            Register an instrument
          </Link>
        </div>
      )}

      {(loadingInstruments || instruments.length > 0) && (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 rounded-lg border border-slate-200 bg-white p-6">
          <label className="block text-sm font-medium text-slate-700">
            Instrument *
            <select
              value={instrumentId}
              onChange={(event) => setInstrumentId(event.target.value)}
              required
              disabled={loadingInstruments}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            >
              <option value="">Select an instrument</option>
              {instruments.map((instrument) => (
                <option key={instrument.id} value={instrument.id}>
                  {instrument.instrument_type} - {instrument.serial_number}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows="4"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
              placeholder="Add any relevant details for the application"
            />
          </label>

          <button
            type="submit"
            disabled={submitting || loadingInstruments || instruments.length === 0}
            className="rounded-lg bg-blue-900 px-5 py-3 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      )}
    </main>
  )
}

export default RegisterApplication