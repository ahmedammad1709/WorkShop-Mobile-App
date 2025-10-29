import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import showPasswordIcon from "../assets/showpassword.png";
import hidePasswordIcon from "../assets/hidepassword.png";
import logo from "../assets/logo.png";

const API_BASE_URL = 'http://localhost:5000/api/auth';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  const showError = (message) => {
    setError(message);
    setShowToast(true);
    window.clearTimeout(window.__fp_toast_timeout);
    window.__fp_toast_timeout = window.setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !isValidEmail(email)) {
      showError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setStep(2);
        // Set resend cooldown
        setResendCooldown(data.resendCooldownSeconds || 60);
        // Show success message
        setError("Reset code sent to your email!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        showError(data.message || "Failed to send reset code. Please try again.");
      }
    } catch (error) {
      console.error('Error sending reset code:', error);
      showError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      showError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/verify-password-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        setStep(3);
        // Show success message
        setError("OTP verified successfully!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        showError(data.message || "Invalid or expired reset code.");
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      showError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      showError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword: password }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        setError("Password reset successfully! Redirecting to login...");
        setShowToast(true);
        setTimeout(() => {
          navigate("/loginselection");
        }, 2000);
      } else {
        showError(data.message || "Failed to reset password. Please try again.");
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setResendCooldown(data.resendCooldownSeconds || 60);
        setError("New reset code sent to your email!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        showError(data.message || "Failed to resend reset code. Please try again.");
      }
    } catch (error) {
      console.error('Error resending reset code:', error);
      showError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`flex items-center gap-3 bg-white border rounded-lg shadow-lg px-4 py-3 w-72 ${
            error.includes("successfully") || error.includes("sent") 
              ? "border-green-200 text-green-700" 
              : "border-red-200 text-red-700"
          }`}>
            <div className={`h-2 w-2 rounded-full ${
              error.includes("successfully") || error.includes("sent") 
                ? "bg-green-500" 
                : "bg-red-500"
            }`}></div>
            <div className="flex-1 text-sm">{error}</div>
            <button
              type="button"
              onClick={() => setShowToast(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="bg-white w-[350px] p-6 rounded-xl shadow-md">
        <img src={logo} alt="Logo" className="mx-auto mb-6 h-16" />

        <h2 className="text-center text-xl font-semibold text-gray-800">
          Forgot Password
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          {step === 1 && "Enter your registered email to receive an OTP."}
          {step === 2 && "Enter the OTP sent to your email."}
          {step === 3 && "Create your new password."}
        </p>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Registered email"
              className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 font-medium rounded-lg ${
                loading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700"
              } text-white`}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
            <div className="text-center text-sm">
              <Link to="/login" className="text-gray-500 hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={otp}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(digits);
              }}
              placeholder="Enter OTP"
              className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 tracking-widest"
              required
            />
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                className={`text-green-600 hover:underline ${
                  resendCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : ''
                }`}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 border rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 font-medium rounded-lg ${
                  loading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-green-600 hover:bg-green-700"
                } text-white`}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className="w-full pr-10 pl-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                <img
                  src={showNewPassword ? hidePasswordIcon : showPasswordIcon}
                  alt={showNewPassword ? "Hide password" : "Show password"}
                  className="h-5 w-5 opacity-80"
                />
              </button>
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pr-10 pl-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                <img
                  src={showConfirmPassword ? hidePasswordIcon : showPasswordIcon}
                  alt={showConfirmPassword ? "Hide password" : "Show password"}
                  className="h-5 w-5 opacity-80"
                />
              </button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 border rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 font-medium rounded-lg ${
                  loading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-green-600 hover:bg-green-700"
                } text-white`}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


