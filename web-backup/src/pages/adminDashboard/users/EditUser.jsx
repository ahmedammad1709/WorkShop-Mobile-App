import React, { useState } from "react";

/* -------------------------
   Toggle Switch Component
   ------------------------- */
function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        enabled ? "bg-[#29cc6a]" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/* -------------------------
   Permissions Data
   ------------------------- */
const DEFAULT_PERMISSIONS = [
  { id: 1, label: "Access dashboard", enabled: false },
  { id: 2, label: "Manage repair orders", enabled: true },
  { id: 3, label: "Remove repair order", enabled: true },
  { id: 4, label: "Edit repair order", enabled: false },
  { id: 5, label: "Edit Work Order", enabled: true },
  { id: 6, label: "Manage statuses", enabled: false },
];

/* -------------------------
   Main Component
   ------------------------- */
export default function EditUser({ role, onBack }) {
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);

  const togglePermission = (id, value) => {
    setPermissions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: value } : p))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Updated role:", role);
    console.log("Permissions:", permissions);
    alert("Role updated successfully!");
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow border-t-2 border-[#29cc6a]">
        <div className="w-full">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Role Details - Modified to use grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Role Details</h2>
                <p className="text-sm text-gray-500">
                  This information will be displayed publicly.
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-full">
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Role
                  </label>
                  <input
                    id="role"
                    type="text"
                    value={role.name}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-300"
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Permissions */}
            <div className="grid grid-cols-2 gap-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Permissions</h2>
                <p className="text-sm text-gray-500">
                  Sections of the application permission.
                </p>
              </div>

              <div className="space-y-4">
                {permissions.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center justify-start gap-4"
                  >
                    <Toggle
                      enabled={perm.enabled}
                      onChange={(val) => togglePermission(perm.id, val)}
                    />
                    <span className="text-gray-700 text-sm">{perm.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                className="px-5 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                onClick={() => alert("Cancelled")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-md border border-[#29cc6a] bg-[#29cc6a] text-white text-sm font-medium hover:bg-[#29cc6a]"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
