import React from "react";
import { Home, PlusCircle, Bell, FileText, LogOut } from "lucide-react";

export default function ContractorSidebar({ activeTab, setActiveTab, user, onLogout }) {
  return (
    <div className="w-28 flex items-start justify-center p-6">
      <div className="w-20 bg-white rounded-3xl shadow-md py-6 px-3 flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-green-600 text-white flex items-center justify-center font-bold">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>

        <div className="flex flex-col gap-2 mt-1">
          <button
            onClick={() => setActiveTab("home")}
            className={`p-2 rounded-lg cursor-pointer ${activeTab === "home" ? "bg-green-50 text-green-600" : "text-gray-500 hover:bg-gray-100"}`}
            title="Home"
          >
            <Home size={18} />
          </button>

          <button
            onClick={() => setActiveTab("create")}
            className={`p-2 rounded-lg cursor-pointer ${activeTab === "create" ? "bg-green-50 text-green-600" : "text-gray-500 hover:bg-gray-100"}`}
            title="Create Work Order"
          >
            <PlusCircle size={18} />
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`p-2 rounded-lg cursor-pointer ${activeTab === "notifications" ? "bg-green-50 text-green-600" : "text-gray-500 hover:bg-gray-100"}`}
            title="Notifications"
          >
            <Bell size={18} />
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`p-2 rounded-lg cursor-pointer ${activeTab === "orders" ? "bg-green-50 text-green-600" : "text-gray-500 hover:bg-gray-100"}`}
            title="Work Orders"
          >
            <FileText size={18} />
          </button>
        </div>

        <div className="mt-auto flex flex-col items-center gap-3">
          <div className="flex gap-2">
            <button 
              onClick={onLogout}
              className="text-red-500 cursor-pointer hover:text-red-700 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
