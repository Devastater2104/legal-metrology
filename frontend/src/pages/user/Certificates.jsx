import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { useAuth } from '../../context/AuthContext'
import {
  downloadCertificatePdf,
  getCertificateQrUrl,
  getMyCertificates,
} from '../../services/certificateService'

function Certificates() {
  const { token } = useAuth()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    getMyCertificates(token)
      .then(setCertificates)
      .catch((loadError) => setError(loadError.message || 'Unable to load certificates.'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleDownload(certificate) {
    setDownloadingId(certificate.id)
    setError('')
    try {
      await downloadCertificatePdf(certificate.id, certificate.certificate_number, token)
    } catch (downloadError) {
      setError(downloadError.message || 'Unable to download certificate PDF.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-slate-900">My Certificates</h1>
      <p className="mt-2 text-slate-600">View certificates issued for your instruments.</p>

      {loading && <p className="mt-8 text-slate-600">Loading certificates...</p>}
      {!loading && error && <p className="mt-8 text-red-600" role="alert">{error}</p>}
      {!loading && !error && certificates.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <p className="text-slate-700">No certificates issued yet.</p>
          <Link to="/user/applications" className="mt-3 inline-block text-blue-900 underline">
            View applications
          </Link>
        </div>
      )}
      {!loading && !error && certificates.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Certificate number</th>
                <th className="px-4 py-3 font-medium">Application</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium">QR</th>
                <th className="px-4 py-3 font-medium">PDF</th>
                <th className="px-4 py-3 font-medium">Integrity hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {certificates.map((certificate) => (
                <tr key={certificate.id}>
                  <td className="px-4 py-3 text-slate-900">{certificate.certificate_number}</td>
                  <td className="px-4 py-3 text-slate-700">#{certificate.application_id}</td>
                  <td className="px-4 py-3 text-slate-700">{certificate.status}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {new Date(certificate.issued_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCertificate(certificate)}
                      className="text-blue-900 underline"
                    >
                      Show QR
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDownload(certificate)}
                      disabled={downloadingId === certificate.id}
                      className="text-blue-900 underline disabled:opacity-50"
                    >
                      {downloadingId === certificate.id ? 'Preparing...' : 'Download PDF'}
                    </button>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-slate-500">
                    {certificate.integrity_hash || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedCertificate && (
        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            QR for {selectedCertificate.certificate_number}
          </h2>
          <img
            src={getCertificateQrUrl(selectedCertificate.certificate_number)}
            alt={`QR code for ${selectedCertificate.certificate_number}`}
            className="mt-4 h-48 w-48"
          />
          <p className="mt-3 text-sm text-slate-600">
            Scan this code to open the public certificate verification page.
          </p>
        </section>
      )}
    </main>
  )
}

export default Certificates
