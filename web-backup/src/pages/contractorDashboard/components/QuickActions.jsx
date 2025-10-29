import React from "react";

export default function QuickActions({ activeTab, onCreateClick, onOrdersClick, onNotificationsClick }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="text-sm font-semibold">Quick Actions</div>
          <div className="text-xs text-gray-400">Shortcuts</div>
        </div>
        <div className="text-xs text-gray-400">•••</div>
      </div>
      <div className="flex flex-col gap-2 mt-3">
        <button 
          onClick={onCreateClick} 
          className={`w-full px-3 py-2 bg-gray-100 rounded cursor-pointer ${
            activeTab === "create" 
              ? "bg-green-50 text-green-600" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          New Work Order
        </button>
        <button 
          onClick={onOrdersClick} 
          className={`w-full px-3 py-2 bg-gray-100 rounded cursor-pointer ${
            activeTab === "orders" 
              ? "bg-green-50 text-green-600" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Work Orders
        </button>
        <button 
          onClick={onNotificationsClick} 
          className={`w-full px-3 py-2 bg-gray-100 rounded cursor-pointer ${
            activeTab === "notifications" 
              ? "bg-green-50 text-green-600" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Notifications
        </button>
      </div>
    </div>
  );
}
