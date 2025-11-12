import React, { useState, useRef, useEffect } from "react";
import { Search, Plus, Bell, Menu, X, Home, PlusCircle, FileText, LogOut } from "lucide-react";

export default function ContractorHeader({ 
  user, 
  userLoading = false,
  onCreateClick, 
  query, 
  setQuery, 
  notifications = [], 
  markAllRead, 
  clearNotifications,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  activeTab,
  setActiveTab,
  onLogout
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <>
      <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-white shadow-sm sticky top-0 z-30 mb-6">
        {/* Mobile hamburger menu */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="w-10 h-10 rounded-md flex items-center justify-center bg-green-600 text-white font-bold">CD</div>
          <div className="hidden sm:block">
            <div className="text-lg font-semibold">Contractor Dashboard</div>
            <div className="text-xs text-gray-500">Welcome back — manage your work orders</div>
          </div>
        </div>

        {/* Search bar - hidden on small screens, shown on medium+ */}
        <div className="hidden md:flex flex-1 px-6">
          <div className="max-w-2xl mx-auto w-full">
            <label className="relative block">
              <span className="sr-only">Search work orders</span>
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search size={16} />
              </span>
              <input
                className="placeholder:italic placeholder:text-slate-400 block bg-gray-100 w-full border border-transparent rounded-md py-2 pl-10 pr-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Search work orders, customer, VIN..."
                value={query || ""}
                onChange={(e) => setQuery && setQuery(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-1 md:gap-2 bg-green-600 hover:bg-green-700 text-white px-2 md:px-3 py-2 rounded-md shadow-sm text-sm cursor-pointer"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Create</span>
          </button>

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-md hover:bg-gray-100 relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-gray-200 z-40">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="font-medium">Notifications</div>
                  <div className="text-sm flex items-center gap-2">
                    <button onClick={markAllRead} className="text-xs text-slate-500 hover:underline cursor-pointer">Mark all</button>
                    <button onClick={clearNotifications} className="text-xs text-red-500 hover:underline cursor-pointer">Clear</button>
                  </div>
                </div>
                <div className="max-h-64 overflow-auto">
                  {notifications.length === 0 && <div className="p-4 text-sm text-gray-500">No notifications</div>}
                  {notifications.map(n => (
                    <div key={n.id} className={`p-3 border-b border-gray-200 last:border-b-0 ${n.read ? 'bg-gray-50' : 'bg-white'}`}>
                      <div className="text-sm">{n.text}</div>
                      <div className="text-xs text-gray-400 mt-1">{n.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Mobile search bar - shown below header on small screens */}
      <div className="md:hidden px-4 pb-4 bg-white shadow-sm">
        <label className="relative block">
          <span className="sr-only">Search work orders</span>
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search size={16} />
          </span>
          <input
            className="placeholder:italic placeholder:text-slate-400 block bg-gray-100 w-full border border-transparent rounded-md py-2 pl-10 pr-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Search work orders, customer, VIN..."
            value={query || ""}
            onChange={(e) => setQuery && setQuery(e.target.value)}
          />
        </label>
      </div>

      {/* Mobile Navigation Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-green-600 text-white flex items-center justify-center font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{user.name || 'User'}</div>
                    <div className="text-sm text-gray-500">{user.email || ''}</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => {
                    setActiveTab("home");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left cursor-pointer ${
                    activeTab === "home" ? "bg-green-50 text-green-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Home size={20} />
                  <span>Home</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("create");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left cursor-pointer ${
                    activeTab === "create" ? "bg-green-50 text-green-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <PlusCircle size={20} />
                  <span>Create Work Order</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("notifications");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left cursor-pointer ${
                    activeTab === "notifications" ? "bg-green-50 text-green-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Bell size={20} />
                  <span>Notifications</span>
                  {notifications.some(n => !n.read) && (
                    <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab("orders");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left cursor-pointer ${
                    activeTab === "orders" ? "bg-green-50 text-green-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FileText size={20} />
                  <span>Work Orders</span>
                </button>
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
