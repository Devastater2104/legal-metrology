import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../../components/NotificationBell'
import { getAssignedApplications } from '../../services/officerService'
import {
  getMyInspections,
  loadInspectionPhoto,
} from '../../services/inspectionService'
import { getOfficerWorkload } from '../../services/analyticsService'

function OfficerDashboard() {
  const { user, token, logout } = useAuth()

  const [applications, setApplications] = useState([])
  const [error, setError] = useState('')
  const [inspections, setInspections] = useState([])
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [loadingPhotoId, setLoadingPhotoId] = useState(null)
  const [workload, setWorkload] = useState(null)

  useEffect(() => {
    Promise.all([
      getAssignedApplications(token),
      getMyInspections(token),
      getOfficerWorkload(token),
    ])
      .then(([applicationData, inspectionData, workloadData]) => {
        setApplications(applicationData)
        setInspections(inspectionData)
        setWorkload(workloadData)
      })
      .catch((loadError) =>
        setError(
          loadError.message || 'Unable to load officer data.',
        ),
      )
  }, [token])

  async function handleViewPhoto(inspection) {
    const photoPath = inspection.photo_urls?.[0]

    if (!photoPath) return

    setPhotoError('')
    setLoadingPhotoId(inspection.id)

    try {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl)
      }

      setPhotoUrl(await loadInspectionPhoto(photoPath, token))
    } catch (photoLoadError) {
      setPhotoError(
        photoLoadError.message || 'Unable to load inspection photo.',
      )
    } finally {
      setLoadingPhotoId(null)
    }
  }

  function hasInspection(applicationId) {
    return inspections.some(
      (inspection) =>
        inspection.application_id === applicationId,
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Officer Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Manage assigned inspections and verification activities.
          </p>

          <p className="mt-4 text-slate-600">
            Signed in as {user.name} ({user.role})
          </p>
        </div>

        <NotificationBell />
      </div>

      {/* Workload */}
      {workload && (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Workload summary
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Active assignments
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {workload.assigned_applications}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Completed inspections
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {workload.completed_inspections}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-700">
                PASS
              </p>
              <p className="mt-1 text-2xl font-bold text-green-800">
                {workload.passed_inspections}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-700">
                FAIL
              </p>
              <p className="mt-1 text-2xl font-bold text-red-800">
                {workload.failed_inspections}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Assigned applications */}
      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Assigned applications
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Applications assigned to you for inspection.
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
            {applications.length}{' '}
            {applications.length === 1
              ? 'application'
              : 'applications'}
          </span>
        </div>

        {error && (
          <p
            className="mt-4 text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && applications.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-8 text-center">
            <p className="text-slate-700">
              No applications assigned yet.
            </p>
          </div>
        )}

        {!error && applications.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-3 py-3 font-medium">
                    Application
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Instrument
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {applications.map((application) => {
                  const inspectionCompleted = hasInspection(
                    application.id,
                  )

                  return (
                    <tr key={application.id}>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        #{application.id}
                      </td>

                      <td className="px-3 py-3 text-slate-700">
                        #{application.instrument_id}
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            inspectionCompleted
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {application.status}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        {inspectionCompleted ? (
                          <span className="font-medium text-green-700">
                            ✓ Inspection completed
                          </span>
                        ) : (
                          <Link
                            to={`/officer/applications/${application.id}/inspection`}
                            className="inline-flex rounded-lg bg-blue-900 px-3 py-2 font-medium text-white hover:bg-blue-800"
                          >
                            Record inspection
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Inspection details */}
      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Inspection details
        </h2>

        {inspections.length === 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-8 text-center">
            <p className="text-slate-600">
              No inspections recorded yet.
            </p>
          </div>
        )}

        {inspections.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-3 py-3 font-medium">
                    Application
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Result
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Latitude
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Longitude
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Captured at
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Photo
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {inspections.map((inspection) => (
                  <tr key={inspection.id}>
                    <td className="px-3 py-3">
                      #{inspection.application_id}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`font-medium ${
                          inspection.result === 'PASS'
                            ? 'text-green-700'
                            : 'text-red-700'
                        }`}
                      >
                        {inspection.result}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      {inspection.latitude ?? '-'}
                    </td>

                    <td className="px-3 py-3">
                      {inspection.longitude ?? '-'}
                    </td>

                    <td className="px-3 py-3">
                      {inspection.captured_at
                        ? new Date(
                            inspection.captured_at,
                          ).toLocaleString()
                        : '-'}
                    </td>

                    <td className="px-3 py-3">
                      {inspection.photo_urls?.length ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleViewPhoto(inspection)
                          }
                          disabled={
                            loadingPhotoId === inspection.id
                          }
                          className="text-blue-900 underline disabled:opacity-50"
                        >
                          {loadingPhotoId === inspection.id
                            ? 'Loading...'
                            : 'View photo'}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {photoError && (
          <p
            className="mt-4 text-red-600"
            role="alert"
          >
            {photoError}
          </p>
        )}

        {photoUrl && (
          <div className="mt-6">
            <p className="text-sm font-medium text-slate-700">
              Inspection photo
            </p>

            <img
              src={photoUrl}
              alt="Uploaded instrument inspection"
              className="mt-2 max-h-80 rounded border border-slate-200"
            />
          </div>
        )}
      </section>

      {/* Logout */}
      <button
        type="button"
        onClick={logout}
        className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
      >
        Log out
      </button>
    </div>
  )
}

export default OfficerDashboard