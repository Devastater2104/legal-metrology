import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Plus, RefreshCw } from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { getMyApplications } from '../../services/applicationService'
import { getMyInstruments } from '../../services/instrumentService'

function Applications() {
  const { token } = useAuth()
  const location = useLocation()
  const [applications, setApplications] = useState([])
  const [instruments, setInstruments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadApplications = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [applicationData, instrumentData] = await Promise.all([
        getMyApplications(token),
        getMyInstruments(token),
      ])
      setApplications(applicationData)
      setInstruments(instrumentData)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load applications.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  const instrumentNames = new Map(
    instruments.map((instrument) => [instrument.id, `${instrument.instrument_type} (${instrument.serial_number})`]),
  )

  return (
    <main className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Applications</h1>
          <p className="mt-2 text-slate-600">Track your verification applications.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={loadApplications}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link
            to="/user/applications/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-white hover:bg-blue-800"
          >
            <Plus size={16} />
            New Application
          </Link>
        </div>
      </div>

      {location.state?.success && (
        <p className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700" role="status">
          {location.state.success}
        </p>
      )}

      {loading && <p className="mt-8 text-slate-600">Loading applications...</p>}

      {!loading && error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <p className="text-slate-700">No verification applications yet.</p>
          <Link to="/user/applications/new" className="mt-3 inline-block text-blue-900 underline">
            Submit your first application
          </Link>
        </div>
      )}

      {!loading && !error && applications.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Instrument</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {applications.map((application) => (
                <tr key={application.id}>
                  <td className="px-4 py-3 text-slate-900">
                    {instrumentNames.get(application.instrument_id) || `Instrument #${application.instrument_id}`}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{application.status}</td>
                  <td className="px-4 py-3 text-slate-700">{application.notes || '-'}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {new Date(application.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

export default Applications