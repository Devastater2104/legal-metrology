import { Link } from 'react-router'
import logo from '../assets/legal-metrology-logo.png'

function GovernmentHeader() {
  return (
    <header className="bg-white">

      {/* Government Identity Row */}
      <div className="border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* Government of India */}
          <div className="flex items-center gap-4">

            <img
              src="/Emblem_of_India.svg"
              alt="State Emblem of India"
              className="h-16 w-auto object-contain"
            />

            <div className="h-12 w-px bg-slate-200" />

            <div className="leading-tight">
              <div className="govt-hindi text-[17px] font-semibold text-slate-800">
                भारत सरकार
              </div>

              <div className="mt-1 text-[12px] font-semibold tracking-[0.08em] text-slate-500">
                GOVERNMENT OF INDIA
              </div>
            </div>

          </div>

          {/* Department */}
          <div className="hidden text-center md:block">

            <div className="text-[14px] font-semibold tracking-tight text-slate-800">
              Department of Consumer Affairs
            </div>

            <div className="mt-1 text-[11px] font-medium text-slate-500">
              Ministry of Consumer Affairs, Food & Public Distribution
            </div>

            <div className="mt-1 text-[10px] tracking-wide text-slate-400">
              GOVERNMENT OF INDIA
            </div>

          </div>

          {/* e-MānakSetu */}
          <img
            src={logo}
            alt="e-MānakSetu"
            className="h-16 w-auto object-contain"
          />

        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2.5">

          <Link
            to="/"
            className="text-[17px] font-semibold tracking-tight text-[#173b8f]"
          >
            e-MānakSetu
          </Link>

          <nav className="flex items-center gap-2">

            <Link
              to="/verify"
              className="rounded-md px-4 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-[#173b8f]"
            >
              Verify Certificate
            </Link>

            <Link
              to="/login"
              className="rounded-md bg-[#173b8f] px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#123276]"
            >
              Login
            </Link>

          </nav>

        </div>
      </div>

      {/* National Tricolour Accent */}
      <div className="flex h-[3px] w-full">
        <div className="w-1/3 bg-[#f47721]" />
        <div className="w-1/3 bg-white" />
        <div className="w-1/3 bg-[#138808]" />
      </div>

    </header>
  )
}

export default GovernmentHeader