import { Link } from "react-router-dom";
import { useState } from "react";
import showPasswordIcon from "../assets/showpassword.png";
import hidePasswordIcon from "../assets/hidepassword.png";

import logo from "../assets/logo.png";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpError, setOtpError] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !userType) {
      setError("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: userType.toLowerCase() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to request OTP");
      }
      setOtp("");
      setOtpError("");
      setOtpModalOpen(true);
      if (typeof data.resendCooldownSeconds === "number") {
        setCooldown(data.resendCooldownSeconds);
        startCooldown(data.resendCooldownSeconds);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startCooldown(seconds) {
    let remaining = seconds;
    setCooldown(remaining);
    const interval = setInterval(() => {
      remaining -= 1;
      setCooldown(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
  }

  async function handleVerifyOtp() {
    setError("");
    setOtpError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to verify OTP");
      }
      setOtpModalOpen(false);
      alert("Account created successfully");
      window.location.href = "/loginselection";
    } catch (err) {
      setOtpError(err.message);
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0) return;
    setError("");
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to resend OTP");
      const seconds = data?.resendCooldownSeconds ?? 60;
      startCooldown(seconds);
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
          Sign Up
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
        Join us and start your journey today
        </p>

        <form className="flex flex-col gap-4" onSubmit={handleSignup}>
          {error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : null}
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700"
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
          >
            <option value="" disabled>
              Select Type
            </option>
            <option value="Contractor">Contractor</option>
            <option value="Technician">Technician</option>
            <option value="Supplier">Supplier</option>
            <option value="Consultant">Consultant</option>
          </select>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <label className="flex items-center text-sm text-gray-600">
            <input type="checkbox" className="mr-2" />
            I agree with our{" "}
            <span className="text-green-600 ml-1">Terms and Conditions</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "Sending OTP..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/loginselection" className="text-green-600 font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
      {otpModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="bg-white w-[420px] max-w-[90vw] p-6 rounded-2xl shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 text-center">Email Verification</h3>
            <p className="text-sm text-gray-600 text-center mt-1">We sent a 6‑digit code to <span className="font-medium">{email}</span>.</p>

            <label className="block text-sm text-gray-700 mt-5 mb-2">Enter OTP</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtpError("");
                setOtp(e.target.value.replace(/\D/g, ""));
              }}
              placeholder="● ● ● ● ● ●"
              className="w-full px-5 py-4 border rounded-xl text-lg tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {otpError ? (
              <div className="mt-2 text-sm text-red-600">{otpError}</div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-2">
                <button
                  onClick={() => setOtpModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm border w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyOtp}
                  className="px-4 py-2 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto"
                >
                  Confirm & Create Account
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <button
                  onClick={handleResendOtp}
                  disabled={cooldown > 0}
                  className="px-4 py-2 border rounded-lg text-sm w-full sm:w-auto disabled:opacity-50"
                  title={cooldown > 0 ? `Please wait ${cooldown}s` : "Resend OTP"}
                >
                  {cooldown > 0 ? `Resend (${cooldown}s)` : "Resend OTP"}
                </button>
                <div className="text-xs text-gray-500 text-center sm:text-right w-full sm:w-auto">OTP expires in 1 minutes</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
