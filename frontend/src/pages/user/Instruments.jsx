import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Plus, RefreshCw } from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { getMyInstruments } from '../../services/instrumentService'

function Instruments() {
  const { token } = useAuth()
  const location = useLocation()
  const [instruments, setInstruments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadInstruments = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      setInstruments(await getMyInstruments(token))
    } catch (loadError) {
      setError(loadError.message || 'Unable to load instruments.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadInstruments()
  }, [loadInstruments])

  return (
    <main className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Instruments</h1>
          <p className="mt-2 text-slate-600">View your registered measuring instruments.</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={loadInstruments}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link
            to="/user/instruments/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-white hover:bg-blue-800"
          >
            <Plus size={16} />
            Register Instrument
          </Link>
        </div>
      </div>

      {location.state?.success && (
        <p className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700" role="status">
          {location.state.success}
        </p>
      )}

      {loading && <p className="mt-8 text-slate-600">Loading instruments...</p>}

      {!loading && error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && instruments.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <p className="text-slate-700">No instruments registered yet.</p>
          <Link to="/user/instruments/new" className="mt-3 inline-block text-blue-900 underline">
            Register your first instrument
          </Link>
        </div>
      )}

      {!loading && !error && instruments.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Manufacturer</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Serial number</th>
                <th className="px-4 py-3 font-medium">Capacity</th>
                <th className="px-4 py-3 font-medium">Accuracy/class</th>
                <th className="px-4 py-3 font-medium">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {instruments.map((instrument) => (
                <tr key={instrument.id}>
                  <td className="px-4 py-3 text-slate-900">{instrument.instrument_type}</td>
                  <td className="px-4 py-3 text-slate-700">{instrument.manufacturer}</td>
                  <td className="px-4 py-3 text-slate-700">{instrument.model || '-'}</td>
                  <td className="px-4 py-3 text-slate-700">{instrument.serial_number}</td>
                  <td className="px-4 py-3 text-slate-700">{instrument.capacity || '-'}</td>
                  <td className="px-4 py-3 text-slate-700">{instrument.accuracy_class || '-'}</td>
                  <td className="px-4 py-3 text-slate-700">{instrument.location || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

export default Instruments
