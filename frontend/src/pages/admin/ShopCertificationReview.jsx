import { useCallback, useEffect, useState } from 'react'
import {
  getAdminCertificationShops,
  issueShopCertificates,
} from '../../services/certificateService'

function ShopCertificationReview({ token }) {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [issuingShopId, setIssuingShopId] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)

    try {
      const data = await getAdminCertificationShops(token)
      setShops(Array.isArray(data) ? data : [])
    } catch (loadError) {
      setError(
        loadError.message || 'Unable to load certification review.'
      )
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  async function handleIssueShop(shop) {
    if (!shop?.shop?.id) return

    const totalInstruments = Number(shop.total_instruments || 0)
    const passed = Number(shop.passed || 0)
    const failed = Number(shop.failed || 0)
    const ready = Number(shop.certificates_ready || 0)

    /*
     * A shop certificate can ONLY be issued when:
     *
     * 1. There is at least one instrument.
     * 2. Every instrument has PASS.
     * 3. Every PASS instrument is ready for certification.
     *
     * This prevents partial shop certification.
     */
    const allPassed =
      totalInstruments > 0 &&
      passed === totalInstruments &&
      failed === 0

    const shopAlreadyIssued =
      allPassed && ready === 0

    if (!allPassed || shopAlreadyIssued || ready !== totalInstruments) {
      return
    }

    const confirmed = window.confirm(
      `Issue the shop certificate for ${shop.shop.name}?\n\n` +
      `All ${totalInstruments} instrument(s) have PASSED inspection.\n` +
      `Certificates will be issued for all instruments in this shop.`
    )

    if (!confirmed) return

    setError('')
    setIssuingShopId(shop.shop.id)

    try {
      await issueShopCertificates(shop.shop.id, token)
      await load()
    } catch (issueError) {
      setError(
        issueError.message || 'Unable to issue shop certificate.'
      )
    } finally {
      setIssuingShopId(null)
    }
  }

  if (loading) {
    return (
      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Shop Certification Review
        </h2>

        <p className="mt-4 text-slate-600">
          Loading shops...
        </p>
      </section>
    )
  }

  return (
    <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Shop Certification Review
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Certification is performed at shop level. Every instrument
          in the shop must pass inspection before the shop can be certified.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {shops.length === 0 ? (
        <p className="mt-5 text-slate-600">
          No shops are ready for certification review.
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          {shops.map((shop) => {
            const totalInstruments = Number(
              shop.total_instruments || 0
            )

            const passed = Number(shop.passed || 0)
            const failed = Number(shop.failed || 0)
            const ready = Number(shop.certificates_ready || 0)

            const allPassed =
              totalInstruments > 0 &&
              passed === totalInstruments &&
              failed === 0

            /*
             * The shop certificate is considered issued when the
             * backend reports that there are no remaining certificates
             * to issue AND all instruments have passed.
             *
             * The important rule is:
             * - ALL PASS -> Issue Shop Certificate
             * - ALL PASS + already issued -> Shop Certificate Issued
             * - Anything else -> Certificate Blocked
             */
            /*
             * A shop certificate is anchored to one of the shop's
             * applications. Therefore the most reliable frontend
             * indicator is whether ANY instrument already carries
             * a certificate record.
             *
             * Do not rely only on certificates_ready because that
             * value is a "remaining certificates" count, not an
             * explicit shop-issued flag.
             */
            const hasExistingShopCertificate =
              Boolean(shop.certificate) ||
              shop.instruments?.some(
                (item) => Boolean(item.certificate)
              )

            const shopAlreadyIssued =
              allPassed && hasExistingShopCertificate

            const canIssue =
              allPassed && !shopAlreadyIssued

            const issuing =
              issuingShopId === shop.shop.id

            let buttonLabel = 'Certificate Blocked'

            if (issuing) {
              buttonLabel = 'Issuing Shop Certificate...'
            } else if (shopAlreadyIssued) {
              buttonLabel = 'Shop Certificate Issued'
            } else if (canIssue) {
              buttonLabel = 'Issue Shop Certificate'
            }

            return (
              <div
                key={shop.shop.id}
                className="overflow-hidden rounded-xl border border-slate-200"
              >
                {/* SHOP HEADER */}
                <div className="border-b border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {shop.shop.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        GST: {shop.shop.gst_number || 'Not available'}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {shop.shop.address}
                      </p>
                    </div>

                    {/* ONE SHOP-LEVEL ACTION */}
                    <button
                      type="button"
                      onClick={() => handleIssueShop(shop)}
                      disabled={!canIssue || issuing}
                      className={[
                        'rounded-lg px-4 py-2.5 font-semibold shadow-sm transition',
                        canIssue && !issuing
                          ? 'bg-blue-900 text-white hover:bg-blue-800'
                          : 'cursor-not-allowed bg-slate-200 text-slate-500',
                      ].join(' ')}
                    >
                      {buttonLabel}
                    </button>
                  </div>

                  {/* SHOP SUMMARY */}
                  <div className="mt-4 grid gap-2 sm:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-500">
                        Instruments
                      </p>

                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {totalInstruments}
                      </p>
                    </div>

                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="text-xs text-green-700">
                        PASS
                      </p>

                      <p className="mt-1 text-xl font-bold text-green-800">
                        {passed}
                      </p>
                    </div>

                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-xs text-red-700">
                        FAIL
                      </p>

                      <p className="mt-1 text-xl font-bold text-red-800">
                        {failed}
                      </p>
                    </div>

                    <div
                      className={[
                        'rounded-lg border p-3',
                        allPassed
                          ? 'border-green-200 bg-green-50'
                          : 'border-blue-200 bg-blue-50',
                      ].join(' ')}
                    >
                      <p
                        className={[
                          'text-xs',
                          allPassed
                            ? 'text-green-700'
                            : 'text-blue-700',
                        ].join(' ')}
                      >
                        Certification
                      </p>

                      <p
                        className={[
                          'mt-1 text-sm font-bold',
                          allPassed
                            ? 'text-green-800'
                            : 'text-blue-900',
                        ].join(' ')}
                      >
                        {shopAlreadyIssued
                          ? 'ISSUED'
                          : allPassed
                            ? 'READY'
                            : 'BLOCKED'}
                      </p>
                    </div>
                  </div>

                  {/* EXPLANATION */}
                  {!allPassed && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      <strong>Certification blocked:</strong>{' '}
                      every instrument in this shop must PASS
                      before the shop certificate can be issued.
                    </div>
                  )}

                  {shopAlreadyIssued && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                      <strong>Shop certification completed.</strong>{' '}
                      All instruments passed and the certification
                      action has already been completed.
                    </div>
                  )}
                </div>

                {/* INSTRUMENTS — INFORMATION ONLY */}
                <div className="divide-y divide-slate-200">
                  {shop.instruments.map((instrument) => {
                    const result =
                      instrument.inspection?.result

                    return (
                      <div
                        key={instrument.instrument_id}
                        className="flex flex-wrap items-center justify-between gap-4 p-4"
                      >
                        <div className="min-w-[240px]">
                          <p className="font-semibold text-slate-900">
                            {instrument.instrument_type}
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            {instrument.manufacturer ||
                              'Manufacturer not recorded'}
                            {' · '}
                            {instrument.model ||
                              'Model not recorded'}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Serial: {instrument.serial_number}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {result === 'PASS' ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                              PASS
                            </span>
                          ) : result === 'FAIL' ? (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
                              FAIL
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                              {result || 'PENDING'}
                            </span>
                          )}

                          {/* NO INDIVIDUAL CERTIFICATE ACTION/NUMBER */}
                          {result === 'PASS' && shopAlreadyIssued ? (
                            <span className="text-sm font-medium text-slate-500">
                              Included in shop certification
                            </span>
                          ) : result === 'PASS' ? (
                            <span className="text-sm text-slate-500">
                              Awaiting shop certification
                            </span>
                          ) : result === 'FAIL' ? (
                            <span className="text-sm text-red-600">
                              Not eligible
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500">
                              Inspection pending
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default ShopCertificationReview
