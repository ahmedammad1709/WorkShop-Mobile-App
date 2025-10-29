import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import showPasswordIcon from "../assets/showpassword.png";
import hidePasswordIcon from "../assets/hidepassword.png";

import logo from "../assets/logo.png";



export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const role = (params.get('role') || '').toLowerCase();
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : '';
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showBannedModal, setShowBannedModal] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      
      // Check if user is banned
      if (data.isBanned) {
        setShowBannedModal(true);
        return;
      }
      
      if (!res.ok) throw new Error(data?.message || 'Login failed');
      
      // Store user information in localStorage
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userRole', role);
      
      if (role === 'contractor') {
        navigate('/contractordashboard');
        return;
      }
      if (role === 'admin') {
        navigate('/adminDashboard');
        return;
      }
      if (role === 'technician') {
        navigate('/techniciandashboard');
        return;
      }
      if (role === 'supplier') {
        navigate('/supplierdashboard');
        return;
      }
       if (role === 'consultant') {
        navigate('/consultantdashboard');
        return;
      }

      alert('Login successful');
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white w-[350px] p-6 rounded-xl shadow-md">
      <img
          src={logo}
          alt="Logo"
          className="mx-auto mb-6 h-16"
        />

        <h2 className="text-center text-xl font-semibold text-gray-800">
          Login
        </h2>
        {roleLabel ? (
          <p className="text-center text-sm text-gray-600 mt-1">Login as {roleLabel}</p>
        ) : null}
        <p className="text-center text-gray-500 text-sm mb-6">
          Welcome back, Sign in to continue
        </p>

        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          {error ? <div className="text-red-600 text-sm">{error}</div> : null}
          <input
            type="text"
            placeholder="Email Address"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <img
                src={showPassword ? hidePasswordIcon : showPasswordIcon}
                alt={showPassword ? "Hide password" : "Show password"}
                className="h-5 w-5 opacity-80"
              />
            </button>
          </div>

          <div className="flex justify-between text-sm">
            <Link to="/forgot-password" className="text-gray-500 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 cursor-pointer"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-green-600 font-medium hover:underline">
            Create account
          </Link>
        </p>
      </div>
      
      {/* Banned User Modal */}
      {showBannedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="bg-white w-[400px] max-w-[90vw] p-6 rounded-2xl shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Banned</h3>
              <p className="text-sm text-gray-600 mb-6">
                You are banned by the admin. Please contact support for further assistance.
              </p>
              <button
                onClick={() => setShowBannedModal(false)}
                className="w-full py-2 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
