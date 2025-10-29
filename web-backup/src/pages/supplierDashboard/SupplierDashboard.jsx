// SupplierDashboard.jsx
// Drop this file into your Vite + React + Tailwind project.
// Requires: Tailwind CSS + React. (No other deps required)
// Usage: import SupplierDashboard from './SupplierDashboard'; <SupplierDashboard />

import React, { useEffect, useMemo, useState, useRef } from "react";

/**
 * Supplier Dashboard
 *
 * Features implemented (based on uploaded PDF + Design.json):
 * - Sidebar & header
 * - Search orders
 * - Status tabs (All, Sent, In Progress, Finished, Approved By Contractor)
 * - Work order list with expandable details
 * - Change status inline (updates UI)
 * - Generate Invoice modal (preview)
 * - Services / Price List on right panel
 * - Modify Price modal (update service prices)
 * - Notifications panel with clear all
 *
 * Styling: Tailwind classes + some CSS variables injected locally to match Design.json colors.
 */

export default function SupplierDashboard() {
  // Inject Inter font from Google (one-time)
  useEffect(() => {
    if (!document.querySelector("#supplier-dashboard-inter")) {
      const link = document.createElement("link");
      link.id = "supplier-dashboard-inter";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // ---------- Dynamic work orders ----------
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    async function fetchWorkOrders() {
      try {
        setOrdersLoading(true);
        setOrdersError("");
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const base = (API_URL || '').replace(/\/+$/,'');
        const path = /\/api\/?$/.test(base) ? `${base}/work-orders` : `${base}/api/work-orders`;
        const res = await fetch(path);
        const contentType = res.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        const data = isJson ? await res.json() : null;
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || res.statusText);
        }
        const mapped = (data.orders || []).map((o) => ({
          id: o.id,
          title: o.title || `${o.vehicle_year ? o.vehicle_year + ' ' : ''}${o.vehicle_make || ''} ${o.vehicle_model || ''}`.trim(),
          contractor: o.created_by || '—',
          status: normalizeStatusLabel(o.status || o.status_raw || 'pending'),
          totalCost: Number(o.quote_total || o.charges || 0),
          details: `${o.customer_name || ''} ${o.customer_phone ? '(' + o.customer_phone + ')' : ''}`.trim(),
          services: [],
          supply_item: o.supply_item || null,
          item_description: o.item_description || null,
          supplier_email: o.supplier_email || null,
          startDate: (() => { try { const d = o.updatedAt || o.created_at; return d ? new Date(d).toISOString().split('T')[0] : ''; } catch { return ''; } })(),
        }));
        setOrders(mapped);
      } catch (e) {
        console.error('Failed to load work orders', e);
        setOrdersError(e.message || 'Failed to load work orders');
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    }
    fetchWorkOrders();
  }, []);

  const [services, setServices] = useState([
    { id: "S01", name: "Car Washing", price: 29 },
    { id: "S02", name: "Steering Repair", price: 45 },
    { id: "S03", name: "Engine Repair", price: 199 },
    { id: "S04", name: "Clutch", price: 89 },
    { id: "S05", name: "Break", price: 49 }, // as in PDF text ("Break")
    { id: "S06", name: "Tire", price: 179 },
  ]);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Your work is approved by contractor",
      time: "11:10 pm",
      read: false,
    },
    {
      id: 2,
      title: "New work order received: #W04",
      time: "09:20 am",
      read: false,
    },
    {
      id: 3,
      title: "Price change requested for Steering Repair",
      time: "Yesterday",
      read: true,
    },
  ]);

  // UI state
  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("All");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Modify price modal
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingPrice, setEditingPrice] = useState("");

  // Invoice modal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  // Notifications panel
  const [notifOpen, setNotifOpen] = useState(false);
  const notificationRef = useRef(null);

  // Status changer state for each order (which one is showing arrows)
  const [activeStatusChanger, setActiveStatusChanger] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState({});

  // Approve confirmation modal
  const [approveModal, setApproveModal] = useState({ open: false, order: null, loading: false, error: '' });
  const openApproveModal = (order) => setApproveModal({ open: true, order, loading: false, error: '' });
  const closeApproveModal = () => setApproveModal({ open: false, order: null, loading: false, error: '' });
  const performApprove = async () => {
    const order = approveModal.order;
    if (!order) return closeApproveModal();
    try {
      setApproveModal((s) => ({ ...s, loading: true, error: '' }));
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const base = (API_URL || '').replace(/\/+$/,'');
      const path = /\/api\/?$/.test(base) ? `${base}/work-orders/${order.id}/approve` : `${base}/api/work-orders/${order.id}/approve`;
      const supplierEmail = (user?.email || localStorage.getItem('userEmail') || '').trim();
      const res = await fetch(path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier_email: supplierEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || res.statusText);
      // Update local orders list to reflect acceptance
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'In Progress', supplier_email: supplierEmail } : o)));
      closeApproveModal();
    } catch (e) {
      setApproveModal((s) => ({ ...s, loading: false, error: e.message || 'Approval failed' }));
    }
  };

  // User state (dynamic from backend by email in localStorage)
  const [user, setUser] = useState({ name: "Loading...", email: "" });
  const [userLoading, setUserLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load user from localStorage and fetch profile
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
          console.error('No user email found in localStorage');
          setUser({ name: 'Guest User', email: '' });
          setUserLoading(false);
          return;
        }

        const response = await fetch(`/api/auth/user/${encodeURIComponent(userEmail)}`);
        const data = await response.json();

        if (data.success && data.user) {
          setUser({ name: data.user.name, email: data.user.email });
        } else {
          console.error('Failed to fetch user data:', data.error);
          setUser({ name: 'Guest User', email: userEmail });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser({ name: 'Guest User', email: '' });
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const STATUS_COLORS = {
    "Sent": "bg-gray-200 text-gray-800",
    "In Progress": "bg-yellow-100 text-yellow-800",
    "Finished": "bg-green-100 text-green-800",
    "Contractor": "bg-green-200 text-green-900",
  };

  const STATUS_HOVER_COLORS = {
    "Sent": "hover:bg-gray-300",
    "In Progress": "hover:bg-yellow-200",
    "Finished": "hover:bg-green-200",
    "Contractor": "hover:bg-green-300",
  };

  const STATUS_LIST = ["Sent", "In Progress", "Finished", "Contractor"];

  // ---------- Derived / Filtered Data ----------
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const hasSupplier = !!(o.supply_item && String(o.supply_item).trim() !== '');
      if (!hasSupplier) return false;
      const tabOk = selectedTab === "All" ? true : o.status === selectedTab;
      const searchOk =
        !q ||
        String(o.title || '').toLowerCase().includes(q) ||
        String(o.id || '').toLowerCase().includes(q) ||
        String(o.contractor || '').toLowerCase().includes(q);
      return tabOk && searchOk;
    });
  }, [orders, search, selectedTab]);

  const stats = useMemo(() => {
    const hasSupplier = (o) => !!(o.supply_item && String(o.supply_item).trim() !== '');
    const base = orders.filter(hasSupplier);
    const total = base.length; // reflects 'All' tab items
    const inProgress = base.filter((o) => o.status === "In Progress").length;
    const finished = base.filter((o) => o.status === "Finished").length;
    const approved = base.filter((o) => !!o.supplier_email).length; // approved by supplier
    return { total, inProgress, finished, approved };
  }, [orders]);

  // ---------- Actions ----------
  function changeOrderStatus(orderId, newStatus) {
    setOrders((prev) => {
      return prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: newStatus,
            completionDate: newStatus === "Finished" ? new Date().toISOString().slice(0, 10) : o.completionDate,
          };
        }
        return o;
      });
    });
  }

  // Normalize backend/display status labels to dashboard tabs
  function normalizeStatusLabel(s) {
    const key = String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
    if (key === 'pending' || key === 'requested') return 'Sent';
    if (key === 'in progress' || key === 'in-process' || key === 'in process' || key === 'accepted') return 'In Progress';
    if (key === 'completed' || key === 'finished') return 'Finished';
    return s || 'Sent';
  }

  function openModifyPrice(service) {
    setEditingService(service);
    setEditingPrice(String(service.price));
    setPriceModalOpen(true);
  }

  function savePriceChange() {
    const parsed = parseFloat(editingPrice);
    if (isNaN(parsed) || parsed < 0) {
      alert("Please enter a valid price.");
      return;
    }
    setServices((prev) => prev.map((s) => (s.id === editingService.id ? { ...s, price: parsed } : s)));
    // Update any orders that reference this service id (reflect price change in totalCost)
    setOrders((prev) =>
      prev.map((o) => {
        const has = o.services.some((sv) => sv.id === editingService.id);
        if (!has) return o;
        // recompute total from service ids mapping to services array
        const newTotal = o.services.reduce((sum, sv) => {
          const found = (sv.id && services.find((s) => s.id === sv.id)) || sv; // fallback
          const newPrice = sv.id === editingService.id ? parsed : found.price;
          return sum + newPrice;
        }, 0);
        return { ...o, totalCost: newTotal };
      })
    );
    setPriceModalOpen(false);
    setEditingService(null);
    setEditingPrice("");
  }

  function openInvoice(order) {
    setInvoiceOrder(order);
    setInvoiceModalOpen(true);
  }

  function markNotificationRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function clearNotifications() {
    setNotifications([]);
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  // Logout flows (match Technician/Consultant dashboards)
  function handleLogout() {
    setShowLogoutModal(true);
  }
  function confirmLogout() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    setShowLogoutModal(false);
    window.location.href = '/loginselection';
  }
  function cancelLogout() {
    setShowLogoutModal(false);
  }

  function addService(name, price) {
    const id = `S${String(Math.floor(Math.random() * 10000)).padStart(2, "0")}`;
    const parsed = parseFloat(price) || 0;
    setServices((prev) => [...prev, { id, name, price: parsed }]);
  }

  // Toggle status changer arrows for specific order
  function toggleStatusChanger(orderId) {
    setActiveStatusChanger(prev => prev === orderId ? null : orderId);
  }

  // Close status changer
  function closeStatusChanger() {
    setActiveStatusChanger(null);
  }

  // Cycle status up (next in the list)
  function cycleStatusUp(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const currentIndex = STATUS_LIST.indexOf(order.status);
    const nextIndex = (currentIndex + 1) % STATUS_LIST.length;
    const newStatus = STATUS_LIST[nextIndex];
    
    // Start transition animation
    setIsTransitioning(prev => ({ ...prev, [orderId]: 'up' }));
    
    setTimeout(() => {
      changeOrderStatus(orderId, newStatus);
      setIsTransitioning(prev => ({ ...prev, [orderId]: false }));
    }, 150);
  }

  // Cycle status down (previous in the list)
  function cycleStatusDown(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const currentIndex = STATUS_LIST.indexOf(order.status);
    const prevIndex = currentIndex === 0 ? STATUS_LIST.length - 1 : currentIndex - 1;
    const newStatus = STATUS_LIST[prevIndex];
    
    // Start transition animation
    setIsTransitioning(prev => ({ ...prev, [orderId]: 'down' }));
    
    setTimeout(() => {
      changeOrderStatus(orderId, newStatus);
      setIsTransitioning(prev => ({ ...prev, [orderId]: false }));
    }, 150);
  }

  // Handle click outside notification popup
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }

    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notifOpen]);

  // Handle click outside status changer
  useEffect(() => {
    function handleClickOutside(event) {
      // Check if click is outside any status changer
      if (!event.target.closest('.status-changer')) {
        closeStatusChanger();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ---------- Helpers ----------
  function formatCurrency(v) {
    // compute digit by digit: create string using toFixed (safe)
    const num = Number(v) || 0;
    return `$${num.toFixed(2)}`;
  }

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', Roboto, sans-serif" }}>
      <style>{`
        :root{
          --primary: #29cc6a;
          --secondary: #34C759;
          --accent: #FF9500;
          --bg-light: #FFFFFF;
          --bg-dark: #F4F5F7;
          --text-primary: #111111;
          --text-secondary: #6B6B6B;
        }
        .sd-badge { font-weight:600; font-size:0.8rem; padding:0.25rem 0.5rem; border-radius:9999px;}
        .sd-card { box-shadow: 0 1px 3px rgba(0,0,0,0.06); border-radius:12px; background:var(--bg-light); }
        .sd-modal { background: rgba(12,12,12,0.5); position:fixed; inset:0; display:flex; align-items:center; justify-content:center; z-index:60; }
      `}</style>

      {/* Top header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-md flex items-center justify-center bg-[var(--primary)] text-white font-bold">SD</div>
          <div>
            <div className="text-lg font-semibold">Supplier Dashboard</div>
            <div className="text-xs text-gray-500">Manage orders, services and invoices</div>
          </div>
        </div>

        <div className="flex-1 px-6">
          <div className="max-w-2xl mx-auto">
            <label className="relative block">
              <span className="sr-only">Search orders</span>
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                className="placeholder:italic placeholder:text-slate-400 block bg-gray-100 w-full border border-transparent rounded-md py-2 pl-10 pr-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="Search work, contractor, id..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Logout button (red), placed between search bar and notification icon */}
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer"
            title="Logout"
          >
            Logout
          </button>
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="p-2 rounded-md hover:bg-gray-100 cursor-pointer"
              aria-label="Notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 17H9a3 3 0 006 0zM18 8a6 6 0 10-12 0v5l-2 2h16l-2-2V8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {notifications.some((n) => !n.read) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500" />
              )}
            </button>

            {/* Notifications popover */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white shadow-lg rounded-md p-3 z-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={markAllRead}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Mark all read
                    </button>
                    <button onClick={() => clearNotifications()} className="text-xs text-red-500">Clear</button>
                  </div>
                </div>
                <div className="max-h-64 overflow-auto">
                  {notifications.length === 0 && <div className="text-xs text-gray-400">No notifications</div>}
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-2 rounded-md flex items-start gap-3 ${n.read ? "bg-gray-50" : "bg-green-50"}`}>
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-gray-800">{n.title}</div>
                        <div className="text-xs text-gray-500">{n.time}</div>
                      </div>
                      {!n.read && (
                        <button onClick={() => markNotificationRead(n.id)} className="text-xs text-[#29cc6a]">Mark</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              {userLoading ? (
                <div className="text-sm font-medium text-gray-400">Loading...</div>
              ) : (
                <>
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-[#29cc6a] font-semibold cursor-pointer" onClick={handleLogout} title="Logout">
              {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 max-w-7xl mx-auto">
        <div className="flex gap-6">
          {/* Left Sidebar - Price List and Recent Activity */}
          <div className="w-80 flex-shrink-0 space-y-6">
            {/* Price List */}
            <div className="sd-card p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold">Price List</h3>
                  <div className="text-xs text-gray-500">Services you offer</div>
                </div>
                <button
                  onClick={() => {
                    const name = prompt("Service name (e.g. 'Oil Change'):");
                    if (!name) return;
                    const price = prompt("Price (numeric):", "0");
                    addService(name, parseFloat(price || 0));
                  }}
                  className="text-sm bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
                >
                  Add Service
                </button>
              </div>

              <div className="space-y-2">
                {services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                    <div>
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-gray-500">#{s.id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">{formatCurrency(s.price)}</div>
                        <button onClick={() => openModifyPrice(s)} className="text-xs text-green-600 hover:underline">Modify Price</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            {/* Recent Activity */}
            <div className="sd-card p-4">
              <h4 className="text-sm font-semibold">Recent Activity</h4>
              <div className="text-xs text-gray-500 mt-1">Recent events</div>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1" />
                  <div>
                    <div className="font-medium">#W03 approved</div>
                    <div className="text-xs text-gray-500">Approved • 2 days ago</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 mt-1" />
                  <div>
                    <div className="font-medium">Price updated - Engine Repair</div>
                    <div className="text-xs text-gray-500">You changed the price • 1 week ago</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="sd-card p-4">
                <div className="text-sm text-gray-500">Total Orders</div>
                <div className="text-2xl font-semibold">{stats.total}</div>
              </div>
              <div className="sd-card p-4">
                <div className="text-sm text-gray-500">In Progress</div>
                <div className="text-2xl font-semibold">{stats.inProgress}</div>
              </div>
              <div className="sd-card p-4">
                <div className="text-sm text-gray-500">Finished</div>
                <div className="text-2xl font-semibold">{stats.finished}</div>
              </div>
              <div className="sd-card p-4">
                <div className="text-sm text-gray-500">Approved</div>
                <div className="text-2xl font-semibold">{stats.approved}</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-md">
              {["All", ...STATUS_LIST].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTab(t)}
                  className={`px-3 py-1 rounded-md text-sm ${selectedTab === t ? "bg-green-500 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Orders list */}
            <div className="space-y-4">
              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">No work orders match your filters.</div>
              )}
              {filteredOrders.map((o) => {
                  return (
                      <div key={o.id} className="sd-card p-4 flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">{o.id}</div>
                          <div className="flex-1">
                              <div className="flex items-start justify-between gap-4">
                                  <div>
                                      <div className="text-md font-semibold text-gray-900">{o.title}</div>
                                      <div className="text-xs text-gray-500">Contractor: {o.contractor} • Start: {o.startDate}{o.completionDate ? ` • Completed: ${o.completionDate}` : ""}</div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <div className="text-sm font-semibold">{formatCurrency(o.totalCost)}</div>
                                      <button
                                          className="text-sm p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                          onClick={() => openInvoice(o)}
                                          title="Download Invoice"
                                      >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                              <polyline points="7,10 12,15 17,10" />
                                              <line x1="12" y1="15" x2="12" y2="3" />
                                          </svg>
                                      </button>
                                      <div className="flex items-center gap-1 status-changer">
                                          <button
                                              type="button"
                                              onClick={() => toggleStatusChanger(o.id)}
                                              className={`sd-badge ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-700"} border-0 cursor-pointer hover:opacity-80 transition-all duration-300 w-28 text-center relative overflow-hidden ${isTransitioning[o.id] ? 'pointer-events-none' : ''}`}
                                          >
                                              <span 
                                                  className={`block transition-transform duration-300 ease-out ${
                                                      isTransitioning[o.id] === 'up' ? '-translate-y-full opacity-0' :
                                                      isTransitioning[o.id] === 'down' ? 'translate-y-full opacity-0' :
                                                      'translate-y-0 opacity-100'
                                                  }`}
                                              >
                                                  {o.status}
                                              </span>
                                          </button>
                                          {activeStatusChanger === o.id && (
                                               <div className="flex flex-col gap-0.5 ml-1">
                                                   {/* Up Arrow */}
                                                   <button
                                                       onClick={(e) => {
                                                           e.stopPropagation();
                                                           cycleStatusUp(o.id);
                                                       }}
                                                       className="rounded-sm px-1 py-0.5 hover:opacity-80 transition-all duration-150 shadow-sm text-white flex items-center justify-center"
                                                       style={{ 
                                                           width: '14px', 
                                                           height: '14px',
                                                           backgroundColor: '#29cc6a'
                                                       }}
                                                   >
                                                       <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                                                           <polyline points="18,15 12,9 6,15"></polyline>
                                                       </svg>
                                                   </button>
                                                   {/* Down Arrow */}
                                                   <button
                                                       onClick={(e) => {
                                                           e.stopPropagation();
                                                           cycleStatusDown(o.id);
                                                       }}
                                                       className="rounded-sm px-1 py-0.5 hover:opacity-80 transition-all duration-150 shadow-sm text-white flex items-center justify-center"
                                                       style={{ 
                                                           width: '14px', 
                                                           height: '14px',
                                                           backgroundColor: '#29cc6a',
                                                       }}
                                                   >
                                                       <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                                                           <polyline points="6,9 12,15 18,9"></polyline>
                                                       </svg>
                                                   </button>
                                               </div>
                                           )}
                                      </div>
                                  </div>
                              </div>

                              <div className="mt-3 text-sm text-gray-700">
                                  {o.details}
                              </div>

                              <div className="mt-3 flex items-center gap-3">
                                  <button
                                      onClick={() => setExpandedOrderId((prev) => (prev === o.id ? null : o.id))}
                                      className="text-xs text-blue-600 cursor-pointer"
                                  >
                                      {expandedOrderId === o.id ? "Hide details" : "View details"}
                                  </button>
                                  {o.supplier_email ? (
                                    <button
                                      disabled
                                      className="text-xs px-2 py-1 rounded-md bg-emerald-600/70 text-white cursor-not-allowed"
                                      title={`Approved by ${o.supplier_email}`}
                                    >
                                      Approved
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => openApproveModal(o)}
                                      className="text-xs cursor-pointer px-2 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-transform shadow-sm"
                                    >
                                      Approve
                                    </button>
                                  )}
                              </div>

                              {/* Expanded details */}
                              {expandedOrderId === o.id && (
                                  <div className="mt-3 border-t pt-3 text-sm text-gray-700">
                                      {/* Supplier assignment details */}
                                      {o.supply_item && (
                                        <div className="mb-3">
                                          <div className="font-medium">Supplier Assignment</div>
                                          <div className="text-xs text-gray-500 mt-1">Item</div>
                                          <div className="text-sm">{o.supply_item}</div>
                                          {o.item_description && (
                                            <>
                                              <div className="text-xs text-gray-500 mt-2">Description</div>
                                              <div className="text-sm">{o.item_description}</div>
                                            </>
                                          )}
                                        </div>
                                      )}

                                      {/* Paint Codes Section */}
                                      {o.paint_codes_json && (
                                        <div className="mb-3">
                                          <div className="font-medium">Paint Codes</div>
                                          {(() => {
                                            try {
                                              const paintCodes = typeof o.paint_codes_json === 'string' 
                                                ? JSON.parse(o.paint_codes_json) 
                                                : o.paint_codes_json;
                                              return Array.isArray(paintCodes) && paintCodes.length > 0 ? (
                                                <div className="mt-1 space-y-1">
                                                  {paintCodes.map((paint, paintIdx) => (
                                                    <div key={paintIdx} className="flex items-center gap-2 text-sm">
                                                      <span className="font-medium text-gray-900">{paint.code}</span>
                                                      <span className="text-gray-600">Qty: {paint.quantity}</span>
                                                      {paint.triStage && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                          Tri Stage
                                                        </span>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="text-xs text-gray-500 mt-1">No paint codes available</div>
                                              );
                                            } catch (e) {
                                              return <div className="text-xs text-red-500 mt-1">Invalid paint code data</div>;
                                            }
                                          })()}
                                        </div>
                                      )}

                                      <div className="font-medium mb-2">Services</div>
                                      <ul className="space-y-2">
                                          {o.services.map((s) => {
                                              // find latest price
                                              const match = services.find((srv) => srv.id === s.id) || s;
                                              return (
                                                  <li key={s.id} className="flex items-center justify-between">
                                                      <div>{match.name}</div>
                                                      <div className="text-sm font-semibold">{formatCurrency(match.price)}</div>
                                                  </li>
                                              );
                                          })}
                                      </ul>
                                  </div>
                              )}
                          </div>
                      </div>
                  );
              })}
              </div>
            </div>
          </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-sm text-gray-600 mb-6">Are you sure you want to logout? You will need to sign in again to access your dashboard.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={cancelLogout} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
                <button onClick={confirmLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer">Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modify Price Modal */}
      {priceModalOpen && editingService && (
        <div className="sd-modal" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-lg w-[480px] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Modify Price</h3>
              <button onClick={() => setPriceModalOpen(false)} className="text-gray-500">✕</button>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <div className="text-xs text-gray-500">Service</div>
                <div className="font-medium">{editingService.name} <span className="text-xs text-gray-400">#{editingService.id}</span></div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Current price</div>
                <div className="text-sm font-semibold">{formatCurrency(editingService.price)}</div>
              </div>

              <div>
                <label className="text-xs text-gray-500">New price</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingPrice}
                  onChange={(e) => setEditingPrice(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button onClick={() => setPriceModalOpen(false)} className="px-3 py-1 rounded-md bg-gray-100 text-sm">Cancel</button>
                <button onClick={savePriceChange} className="px-3 py-1 rounded-md bg-emerald-600 text-white text-sm">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceModalOpen && invoiceOrder && (
        <div className="sd-modal" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-lg w-[640px] p-5 overflow-auto max-h-[90vh]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Invoice</h3>
                <div className="text-xs text-gray-500">Work order: {invoiceOrder.id}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{formatCurrency(invoiceOrder.totalCost)}</div>
                <div className="text-xs text-gray-500">Total due</div>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-400 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Contractor</div>
                  <div className="font-medium">{invoiceOrder.contractor}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Service Date</div>
                  <div className="font-medium">{invoiceOrder.startDate}</div>
                </div>
              </div>

              <div className="mt-4">
                {/* Supplier assignment details in invoice */}
                {invoiceOrder?.supply_item && (
                  <div className="mb-4">
                    <div className="font-medium">Supplier Assignment</div>
                    <div className="text-xs text-gray-500 mt-1">Item</div>
                    <div className="text-sm">{invoiceOrder.supply_item}</div>
                    {invoiceOrder.item_description && (
                      <>
                        <div className="text-xs text-gray-500 mt-2">Description</div>
                        <div className="text-sm">{invoiceOrder.item_description}</div>
                      </>
                    )}
                  </div>
                )}
                <div className="font-medium mb-2">Services</div>
                <div className="border border-gray-400 rounded-md">
                  {invoiceOrder.services.map((s) => {
                    const srv = services.find((ss) => ss.id === s.id) || s;
                    return (
                      <div key={s.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                        <div className="text-sm">{srv.name}</div>
                        <div className="text-sm font-semibold">{formatCurrency(srv.price)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-4">
                <button onClick={() => setInvoiceModalOpen(false)} className="px-3 py-1 rounded-md bg-gray-100 text-sm">Close</button>
                <button
                  onClick={() => {
                    // Quick preview "download" - open print dialog for invoice area
                    window.print();
                  }}
                  className="px-3 py-1 rounded-md bg-[#29cc6a] text-white text-sm"
                >
                  Print / Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approveModal.open && approveModal.order && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Approval</h3>
              <p className="text-sm text-gray-600 mb-6">Are you sure you want to confirm this work order? Your email will be recorded for the contractor.</p>
              {approveModal.error && (<div className="text-sm text-red-600 mb-3">{approveModal.error}</div>)}
              <div className="flex gap-3 justify-center">
                <button onClick={closeApproveModal} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer" disabled={approveModal.loading}>Cancel</button>
                <button onClick={performApprove} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-60" disabled={approveModal.loading}>
                  {approveModal.loading ? 'Confirming...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
