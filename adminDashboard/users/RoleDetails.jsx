import React from "react";

const PERMISSIONS_BY_ROLE = {
  contractor: [
    "Access dashboard",
    "Make WorkOrders",
    "Cancel WorkOrders",
    "Mark as Completed WorkOrders",
    "Can send WorkOrders to Supplier",
  ],
  technician: [
    "Can access Dashboard",
    "Accept any workOrders",
    "Mark WorkOrder as Completed/Finished",
    "Generate Invoice",
    "Refer workorder to supplier",
  ],
  supplier: [
    "Can access dashboard",
    "Accept the request from contractor",
    "Download invoice",
  ],
  consultant: [
    "Can access dashboard",
    "Generate Report as PDF",
    "Generate report in excel file",
    "Generate report from VIN number",
  ],
};

export default function RoleDetails({ role, onBack }) {
  const roleKey = String(role?.name || role?.role || '').toLowerCase();
  const perms = PERMISSIONS_BY_ROLE[roleKey] || [];

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow border-t-2 border-[#29cc6a]">
        <div className="p-6 space-y-8">
          {/* Role Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Role Details</h2>
              <p className="text-sm text-gray-500">Overall information about this role.</p>
            </div>
            <div className="flex items-center">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value={role?.name || role?.role || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Permissions */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Permissions</h2>
              <p className="text-sm text-gray-500">Allowed actions for this role.</p>
            </div>
            <div>
              <ul className="space-y-2">
                {perms.map((p, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    • {p}
                  </li>
                ))}
                {perms.length === 0 && (
                  <li className="text-sm text-gray-500">No permissions defined.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              className="px-5 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
              onClick={onBack}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}