import { useEffect, useState } from 'react'
import SmartAssignment from './SmartAssignment'
import ShopCertificationReview from './ShopCertificationReview'

import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../../components/NotificationBell'
import {
  getApplications,
  getOfficers,
} from '../../services/adminService'
import {
  getAdminOverview,
  getAdminTimeSeries,
  getAttentionItems,
} from '../../services/analyticsService'
import {
  getAdminCertificates,
  getAdminInspections,
  issueCertificate,
  revokeCertificate,
} from '../../services/certificateService'

function AdminDashboard() {
  const { user, token, logout } = useAuth()

  const [showSmartAssignment, setShowSmartAssignment] = useState(false)

  const [overview, setOverview] = useState(null)
  const [timeSeries, setTimeSeries] = useState(null)
  const [attention, setAttention] = useState([])
  const [applications, setApplications] = useState([])
  const [officers, setOfficers] = useState([])
  const [inspections, setInspections] = useState([])
  const [certificates, setCertificates] = useState([])

  const [error, setError] = useState('')
  const [assigningId, setAssigningId] = useState(null)

  useEffect(() => {
    if (!token) return

    async function loadDashboard() {
      setError('')

      const results = await Promise.allSettled([
        getAdminOverview(token),
        getAdminTimeSeries(token),
        getAttentionItems(token),
        getApplications(token),
        getOfficers(token),
        getAdminInspections(token),
        getAdminCertificates(token),
      ])

      const [
        overviewResult,
        timeSeriesResult,
        attentionResult,
        applicationsResult,
        officersResult,
        inspectionsResult,
        certificatesResult,
      ] = results

      if (overviewResult.status === 'fulfilled') {
        setOverview(overviewResult.value)
      }

      if (timeSeriesResult.status === 'fulfilled') {
        setTimeSeries(timeSeriesResult.value)
      }

      if (attentionResult.status === 'fulfilled') {
        setAttention(attentionResult.value || [])
      }

      if (applicationsResult.status === 'fulfilled') {
        setApplications(applicationsResult.value || [])
      }

      if (officersResult.status === 'fulfilled') {
        setOfficers(officersResult.value || [])
      }

      if (inspectionsResult.status === 'fulfilled') {
        setInspections(inspectionsResult.value || [])
      }

      if (certificatesResult.status === 'fulfilled') {
        setCertificates(certificatesResult.value || [])
      }

      /*
       * Individual dashboard widgets are allowed to fail without
       * taking down the entire admin dashboard. Core overview data
       * already loaded successfully, so optional widget failures
       * should be logged rather than shown as a global credential
       * error.
       */
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(
            `Admin dashboard widget ${index + 1} failed:`,
            result.reason,
          )
        }
      })
    }

    loadDashboard()
  }, [token])

  async function handleRevokeCertificate(certificate) {
    const reason = window.prompt(
      `Reason for revoking ${certificate.certificate_number}:`,
    )

    if (!reason?.trim()) return

    setError('')
    setAssigningId(certificate.application_id)

    try {
      const updated = await revokeCertificate(
        certificate.id,
        reason.trim(),
        token,
      )

      setCertificates((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      )

      setApplications((current) =>
        current.map((application) =>
          application.id === updated.application_id
            ? { ...application, status: 'REJECTED' }
            : application,
        ),
      )
    } catch (revokeError) {
      setError(
        revokeError.message ||
          'Unable to revoke certificate.',
      )
    } finally {
      setAssigningId(null)
    }
  }

  async function handleIssueCertificate(applicationId) {
    setError('')
    setAssigningId(applicationId)

    try {
      const issued = await issueCertificate(
        applicationId,
        token,
      )

      setCertificates((current) => [
        issued,
        ...current.filter(
          (certificate) => certificate.id !== issued.id,
        ),
      ])

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                status: 'CERTIFICATE_ISSUED',
              }
            : application,
        ),
      )
    } catch (issueError) {
      setError(
        issueError.message ||
          'Unable to issue certificate.',
      )
    } finally {
      setAssigningId(null)
    }
  }

  const applicationStatusById = new Map(
    applications.map((application) => [
      application.id,
      application.status,
    ]),
  )

  /*
   * Smart Assignment is intentionally rendered as an
   * in-page admin view rather than a separate admin route.
   */
  if (showSmartAssignment) {
    return (
      <SmartAssignment
        onBack={() => setShowSmartAssignment(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-slate-600">
              Manage applications, officers, inspections,
              certificates and operational intelligence.
            </p>

            <p className="mt-3 text-sm text-slate-500">
              Signed in as{' '}
              <span className="font-semibold text-slate-700">
                {user?.name}
              </span>{' '}
              ({user?.role})
            </p>
          </div>

          <NotificationBell />
        </div>

        {error && (
          <div
            className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Smart Assignment Center */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 shadow-sm">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-xl font-bold text-white shadow-sm">
                ✦
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                  Smart Operations
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Smart Assignment Center
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  Find and schedule the best field officer using
                  workload, availability, location and application
                  priority.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSmartAssignment(true)}
              className="shrink-0 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
            >
              Open Assignment Center →
            </button>
          </div>
        </section>

        {/* Analytics */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Analytics overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current platform activity and operational totals.
            </p>
          </div>

          {!overview && (
            <p className="mt-4 text-slate-600">
              Loading analytics...
            </p>
          )}

          {overview && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Metric
                label="Instruments"
                value={overview.instruments.total}
              />
              <Metric
                label="Applications"
                value={overview.applications.total}
              />
              <Metric
                label="Inspections"
                value={overview.inspections.total}
              />
              <Metric
                label="Certificates"
                value={overview.certificates.total}
              />
              <Metric
                label="Users"
                value={overview.users.total}
              />
              <Metric
                label="Officers"
                value={overview.officers.total}
              />
            </div>
          )}
        </section>

        {/* Application pipeline */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Application pipeline
          </h2>

          {overview && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(
                overview.applications.by_status || {},
              ).map(([status, count]) => (
                <div
                  key={status}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {status}
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {count}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Time series */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Last 30 days
          </h2>

          {!timeSeries && (
            <p className="mt-3 text-slate-600">
              Loading time-series data...
            </p>
          )}

          {timeSeries && (
            <div className="mt-5 grid gap-8 md:grid-cols-3">
              {[
                'applications',
                'inspections',
                'certificates',
              ].map((name) => {
                const points = Array.isArray(
                  timeSeries[name],
                )
                  ? timeSeries[name]
                  : []

                return (
                  <div key={name}>
                    <h3 className="font-medium capitalize text-slate-800">
                      {name}
                    </h3>

                    {points.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">
                        No data.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {points.map((point) => (
                          <div
                            key={`${name}-${point.date}`}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span className="w-24 shrink-0 text-slate-500">
                              {point.date}
                            </span>

                            <span
                              className="h-3 rounded-sm bg-blue-700"
                              style={{
                                width: `${Math.max(
                                  4,
                                  point.count * 12,
                                )}px`,
                              }}
                            />

                            <span className="font-medium">
                              {point.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              <div>
                <h3 className="font-medium text-slate-800">
                  Inspection results
                </h3>

                {!timeSeries.inspection_results ||
                (
                  timeSeries.inspection_results.PASS ||
                  []
                ).length === 0 &&
                (
                  timeSeries.inspection_results.FAIL ||
                  []
                ).length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    No inspection result data.
                  </p>
                ) : (
                  <div className="mt-3 space-y-4">
                    {['PASS', 'FAIL'].map((result) => {
                      const points = Array.isArray(
                        timeSeries.inspection_results?.[
                          result
                        ],
                      )
                        ? timeSeries.inspection_results[result]
                        : []

                      return (
                        <div key={result}>
                          <p className="text-xs font-semibold text-slate-700">
                            {result}
                          </p>

                          {points.length === 0 ? (
                            <p className="mt-1 text-xs text-slate-500">
                              No data.
                            </p>
                          ) : (
                            <div className="mt-1 space-y-1">
                              {points.map((point) => (
                                <div
                                  key={`${result}-${point.date}`}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span className="w-24 text-slate-500">
                                    {point.date}
                                  </span>

                                  <span
                                    className="h-3 rounded-sm bg-blue-700"
                                    style={{
                                      width: `${Math.max(
                                        4,
                                        point.count * 12,
                                      )}px`,
                                    }}
                                  />

                                  <span>
                                    {point.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Attention */}
        <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Attention required
          </h2>

          {attention.length === 0 && (
            <p className="mt-3 text-slate-700">
              No applications or compliance issues require
              attention.
            </p>
          )}

          {attention.length > 0 && (
            <ul className="mt-3 space-y-2">
              {attention.map((item, index) => (
                <li
                  key={`${item.type}-${item.related_id}-${index}`}
                  className="text-slate-700"
                >
                  <strong>{item.title}:</strong>{' '}
                  {item.description}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Inspection review */}
        <ShopCertificationReview token={token} />

        {/* Certificates */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Certificates
          </h2>

          {certificates.length === 0 && (
            <p className="mt-4 text-slate-600">
              No certificates issued yet.
            </p>
          )}

          {certificates.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">
                      Certificate
                    </th>
                    <th className="px-3 py-2 font-medium">
                      Status
                    </th>
                    <th className="px-3 py-2 font-medium">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {certificates.map((certificate) => (
                    <tr key={certificate.id}>
                      <td className="px-3 py-2">
                        {certificate.certificate_number}
                      </td>

                      <td className="px-3 py-2">
                        {certificate.status}
                      </td>

                      <td className="px-3 py-2">
                        {certificate.status === 'REVOKED' ? (
                          <span className="text-slate-500">
                            Revoked
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleRevokeCertificate(
                                certificate,
                              )
                            }
                            disabled={
                              assigningId ===
                              certificate.application_id
                            }
                            className="text-red-700 underline disabled:opacity-50"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={logout}
          className="mt-8 rounded-lg bg-slate-900 px-4 py-2 text-white"
        >
          Log out
        </button>
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  )
}

export default AdminDashboard
