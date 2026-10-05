import { BrowserRouter, Routes, Route } from 'react-router'

import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import Landing from "./pages/public/Landing"
import VerifyCertificate from './pages/public/VerifyCertificate'
import Login from "./pages/auth/Login"
import Register from './pages/auth/Register'
import AuthCallback from './pages/auth/AuthCallback'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'
import UserDashboard from "./pages/user/UserDashboard"
import Instruments from './pages/user/Instruments'
import RegisterInstrument from './pages/user/RegisterInstrument'
import Shops from './pages/user/Shops'
import AddShop from './pages/user/AddShop'
import ShopDetails from './pages/user/ShopDetails'
import AddInstrument from './pages/user/AddInstrument'
import Applications from './pages/user/Applications'
import RegisterApplication from './pages/user/RegisterApplication'
import Certificates from './pages/user/Certificates'
import OfficerDashboard from "./pages/officer/OfficerDashboard"
import InspectionForm from './pages/officer/InspectionForm'
import AdminDashboard from "./pages/admin/AdminDashboard"
import SmartAssignment from './pages/admin/SmartAssignment'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify" element={<VerifyCertificate />} />
          <Route path="/verify/:certificateNumber" element={<VerifyCertificate />} />

          <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
            <Route path="/user" element={<UserDashboard />} />
            <Route path="/user/instruments" element={<Instruments />} />
            <Route path="/user/instruments/new" element={<RegisterInstrument />} />

            <Route path="/user/shops" element={<Shops />} />
            <Route path="/user/shops/new" element={<AddShop />} />
            <Route path="/user/shops/:shopId" element={<ShopDetails />} />
            <Route
              path="/user/shops/:shopId/instruments/new"
              element={<AddInstrument />}
            />

            <Route path="/user/applications" element={<Applications />} />
            <Route path="/user/applications/new" element={<RegisterApplication />} />
            <Route path="/user/certificates" element={<Certificates />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['OFFICER']} />}>
            <Route path="/officer" element={<OfficerDashboard />} />
            <Route path="/officer/applications/:applicationId/inspection" element={<InspectionForm />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/assignments" element={<SmartAssignment />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App