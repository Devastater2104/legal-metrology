import { Link } from 'react-router'
import logo from '../../assets/legal-metrology-logo.png'

function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="Legal Metrology"
              className="h-12 w-auto object-contain"
            />
          </Link>

          <Link
            to="/login"
            className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Login
          </Link>
        </div>
      </nav>

      <main className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center">
        <img
          src={logo}
          alt="Legal Metrology Digital Verification & Certification Platform"
          className="mb-8 h-28 w-auto object-contain"
        />

        <div className="mb-4 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
          Digital Verification & Certification
        </div>

        <h2 className="max-w-4xl text-5xl font-bold tracking-tight text-slate-900">
          Legal Metrology Verification Platform
        </h2>

        <p className="mt-6 max-w-2xl text-lg text-slate-600">
          A unified digital platform for instrument registration,
          verification, inspection, certification and certificate validation.
        </p>

        <div className="mt-10 flex gap-4">
          <Link
            to="/login"
            className="rounded-lg bg-blue-900 px-6 py-3 font-medium text-white hover:bg-blue-800"
          >
            Get Started
          </Link>

          <Link
            to="/verify"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
          >
            Verify Certificate
          </Link>
        </div>
      </main>
    </div>
  )
}

export default Landing