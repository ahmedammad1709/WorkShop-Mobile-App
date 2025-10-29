// ChangePassword.jsx
import React, { useState } from "react";

function LockClosedIcon({ className = "w-10 h-10" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 29 37"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M14.5002 28.0417C15.4063 28.0417 16.2754 27.6817 16.9161 27.041C17.5569 26.4002 17.9168 25.5312 17.9168 24.625C17.9168 23.7189 17.5569 22.8498 16.9161 22.2091C16.2754 21.5683 15.4063 21.2084 14.5002 21.2084C13.594 21.2084 12.725 21.5683 12.0842 22.2091C11.4435 22.8498 11.0835 23.7189 11.0835 24.625C11.0835 25.5312 11.4435 26.4002 12.0842 27.041C12.725 27.6817 13.594 28.0417 14.5002 28.0417ZM24.7502 12.6667C25.6563 12.6667 26.5254 13.0267 27.1661 13.6674C27.8069 14.3082 28.1668 15.1772 28.1668 16.0834V33.1667C28.1668 34.0729 27.8069 34.9419 27.1661 35.5827C26.5254 36.2234 25.6563 36.5834 24.7502 36.5834H4.25016C3.34401 36.5834 2.47496 36.2234 1.83421 35.5827C1.19347 34.9419 0.833496 34.0729 0.833496 33.1667V16.0834C0.833496 15.1772 1.19347 14.3082 1.83421 13.6674C2.47496 13.0267 3.34401 12.6667 4.25016 12.6667H5.9585V9.25004C5.9585 6.98465 6.85842 4.81204 8.46029 3.21017C10.0622 1.6083 12.2348 0.708374 14.5002 0.708374C15.6219 0.708374 16.7326 0.929311 17.7689 1.35857C18.8052 1.78783 19.7469 2.417 20.54 3.21017C21.3332 4.00334 21.9624 4.94496 22.3916 5.98129C22.8209 7.01761 23.0418 8.12833 23.0418 9.25004V12.6667H24.7502ZM14.5002 4.12504C13.1409 4.12504 11.8374 4.66499 10.8762 5.62612C9.91512 6.58724 9.37516 7.89081 9.37516 9.25004V12.6667H19.6252V9.25004C19.6252 7.89081 19.0852 6.58724 18.1241 5.62612C17.163 4.66499 15.8594 4.12504 14.5002 4.12504Z" fill="#currentColor" />
    </svg>
  );
}

/**
 * ChangePassword.jsx
 * React + Vite + Tailwind component to match the provided Change Password design.
 * Accent color: #29cc6a
 */

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Hook your password change logic here
    alert("Password changed successfully (demo).");
  }

  return (
    <div className="max-w-6xl mx-auto mt-10">
      <div className="bg-white rounded-lg shadow border-t-2 border-[#29cc6a]">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left column (icon + title + description) */}
            <div className="md:col-span-3">
              <div className="flex items-center gap-3">
                <LockClosedIcon className="w-10 h-10 text-[#29cc6a]" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Change Password
                </h2>
              </div>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                Change your password for a new one, valid for the next login.
              </p>
            </div>

            {/* Right column (form) */}
            <form
              onSubmit={handleSubmit}
              className="md:col-span-9 space-y-4"
            >
              <div className="space-y-5">
                {/* Current password */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Current password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={form.currentPassword}
                    onChange={handleChange}
                    placeholder="Your current password"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md bg-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#29cc6a] focus:border-[#29cc6a]"
                  />
                </div>

                {/* New password */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    New password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Your new password"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md bg-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#29cc6a] focus:border-[#29cc6a]"
                  />
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your new password"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md bg-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#29cc6a] focus:border-[#29cc6a]"
                  />
                </div>
              </div>

              {/* Button aligned bottom-right */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#29cc6a] px-4 py-2 text-sm font-medium text-white shadow"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
