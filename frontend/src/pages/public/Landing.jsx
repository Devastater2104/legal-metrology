import { Link } from 'react-router'
import GovernmentHeader from '../../components/GovernmentHeader'

function Landing() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">

      <GovernmentHeader />

      {/* Hero */}
      <main className="mx-auto max-w-7xl px-6">

        <section className="flex min-h-[620px] flex-col items-center justify-center text-center">

          {/* Eyebrow */}
          <div className="mb-6 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[13px] font-semibold tracking-wide text-[#2452b8]">
            DIGITAL VERIFICATION & CERTIFICATION
          </div>

          {/* Heading */}
          <h1 className="max-w-5xl text-5xl font-bold leading-[1.08] tracking-[-0.035em] text-[#172033] md:text-[58px]">
            Legal Metrology
            <span className="block text-[#173b8f]">
              Verification Platform
            </span>
          </h1>

          {/* Description */}
          <p className="mt-7 max-w-2xl text-[17px] leading-8 text-slate-500">
            A unified digital platform for instrument registration,
            verification, inspection, certification and certificate
            validation.
          </p>

          {/* Actions */}
          <div className="mt-10 flex items-center gap-3">

            <Link
              to="/login"
              className="rounded-md bg-[#173b8f] px-7 py-3.5 text-[14px] font-semibold text-white shadow-sm transition duration-200 hover:bg-[#123276] hover:shadow-md"
            >
              Get Started
            </Link>

            <Link
              to="/verify"
              className="rounded-md border border-slate-300 bg-white px-7 py-3.5 text-[14px] font-semibold text-slate-700 shadow-sm transition duration-200 hover:border-slate-400 hover:bg-slate-50"
            >
              Verify Certificate
            </Link>

          </div>

          {/* Trust Indicators */}
          <div className="mt-14 flex items-center gap-8 text-[12px] font-medium text-slate-400">

            <span>Secure Digital Verification</span>

            <span className="h-1 w-1 rounded-full bg-slate-300" />

            <span>Government Service Platform</span>

            <span className="h-1 w-1 rounded-full bg-slate-300" />

            <span>Certificate Validation</span>

          </div>

        </section>

      </main>

    </div>
  )
}

export default Landing