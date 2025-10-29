import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import LoginSelection from './pages/LoginSelection.jsx'
import Login from './pages/Login.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Signup from './pages/signup.jsx'
// import Dashboard from './pages/Dashboard.jsx'
import AdminDashboard from './pages/adminDashboard/AdminDashboard.jsx'
import TechnicianDashboard from './pages/technicianDashboard/TechnicianDashboard.jsx'
import ContractorDashboard from './pages/contractorDashboard.jsx'
import SupplierDashboard from './pages/supplierDashboard/SupplierDashboard.jsx'
import ConsultantDashboard from './pages/consultantDashboard/ConsultantDashboard.jsx'
import Logs from './pages/Logs.jsx'
import Reports from './pages/Reports.jsx'
import UserManagement from './pages/adminDashboard/users/UserManagement'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/loginselection" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/loginselection" element={<LoginSelection />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="/techniciandashboard" element={<TechnicianDashboard />} />
        <Route path="/contractordashboard" element={<ContractorDashboard />} />
        <Route path="/supplierdashboard" element={<SupplierDashboard />} />
        <Route path="/consultantdashboard" element={<ConsultantDashboard />} />
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        <Route path="/logs" element={<Logs />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="*" element={<Navigate to="/loginselection" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App