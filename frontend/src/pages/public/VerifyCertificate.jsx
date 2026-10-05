import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { verifyCertificate } from '../../services/publicService'

function VerifyCertificate() {
  const { certificateNumber } = useParams()
  const navigate = useNavigate()
  const [input, setInput] = useState(certificateNumber || '')
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(Boolean(certificateNumber))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!certificateNumber) return

    setLoading(true)
    setError('')
    verifyCertificate(certificateNumber)
      .then(setCertificate)
      .catch((loadError) => setError(loadError.message || 'Unable to verify certificate.'))
      .finally(() => setLoading(false))
  }, [certificateNumber])

  function handleSubmit(event) {
    event.preventDefault()
    if (input.trim()) {
      navigate(`/verify/${encodeURIComponent(input.trim())}`)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-sm text-blue-900 underline">Back to home</Link>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Verify Certificate</h1>
        <p className="mt-2 text-slate-600">Enter a certificate number to check its public status.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex gap-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            required
            placeholder="LM-2026-000001"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3"
          />
          <button type="submit" className="rounded-lg bg-blue-900 px-5 py-3 font-medium text-white">
            Verify
          </button>
        </form>

        {loading && <p className="mt-8 text-slate-600">Checking certificate...</p>}
        {!loading && error && <p className="mt-8 rounded-lg bg-red-50 p-4 text-red-700" role="alert">{error}</p>}

        {!loading && certificate && (
          <section className="mt-8 rounded-lg border border-green-200 bg-white p-6">
            <p className="text-sm font-medium text-green-700">Certificate verification result</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{certificate.certificate_number}</h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <Detail label="Status" value={certificate.status} />
              <Detail label="Inspection result" value={certificate.inspection_result} />
              <Detail label="Instrument type" value={certificate.instrument_type} />
              <Detail label="Manufacturer" value={certificate.manufacturer} />
              <Detail label="Model" value={certificate.model || '-'} />
              <Detail label="Serial number" value={certificate.serial_number} />
              <Detail label="Issued" value={new Date(certificate.issued_at).toLocaleDateString()} />
              <Detail label="Valid until" value={certificate.expires_at ? new Date(certificate.expires_at).toLocaleDateString() : '-'} />
              <Detail label="Integrity hash" value={certificate.integrity_hash || '-'} />
            </dl>
          </section>
        )}
      </div>
    </main>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-900">{value}</dd>
    </div>
  )
}

export default VerifyCertificate