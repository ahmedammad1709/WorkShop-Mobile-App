// PersonalInformation.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * PersonalInformation
 * Read-only profile view that displays Name, Email, Role, and Created At.
 * Loads details from the database (users table) via `/api/auth/user/:email`.
 * Supports both `user` and `contractor` props for compatibility.
 */

export default function PersonalInformation({ user, contractor, onBack }) {
  const selected = useMemo(() => user || contractor || null, [user, contractor]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState({
    name: selected?.name || "",
    email: selected?.email || "",
    role: selected?.role || "",
    createdAt: selected?.created_at || selected?.createdAt || "",
  });

  useEffect(() => {
    const email = selected?.email;
    if (!email) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/auth/user/${encodeURIComponent(email)}`);
        const data = await res.json();
        if (!cancelled) {
          if (data && data.success && data.user) {
            setDetails({
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              createdAt: data.user.createdAt,
            });
          } else {
            setError(data?.error || "Failed to load user details");
          }
        }
      } catch (e) {
        if (!cancelled) setError("Error fetching user details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected?.email]);

  const formatDate = (value) => {
    if (!value) return "";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleString();
    } catch {
      return String(value);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow border-t-2 border-[#29cc6a]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="text-lg font-semibold text-gray-700">Personal Information</div>
          {typeof onBack === "function" && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-sm text-gray-600">Loading profile...</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">Name</label>
                <div className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-800">
                  {details.name || ""}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">Email</label>
                <div className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-800">
                  {details.email || ""}
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">Role</label>
                <div className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-800 capitalize">
                  {details.role || ""}
                </div>
              </div>

              {/* Created At */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">Created At</label>
                <div className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-800">
                  {formatDate(details.createdAt)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
