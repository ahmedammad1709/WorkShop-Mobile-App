// src/components/TechnicianDashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import RepairTypesList from "../../components/RepairTypesList";

/**
 * TechnicianDashboard.jsx
 *
 * Features:
 * - Desktop-first responsive layout (sidebar + main content)
 * - Search + filter work orders
 * - Work Order list (Accept / Decline / View Details)
 * - Work Order Details modal with Edit + Generate Invoice
 * - Create Work Order multi-step wizard (modal)
 * - Notifications panel & simple toast/snackbar
 * - Simple "Download Invoice" as an HTML file
 *
 * Notes:
 * - Tailwind CSS must be available in the project.
 * - Colors follow the Design.json palette (primary, success, accent, etc.)
 * - This implementation is purposely dependency-free (no external icon libs).
 *
 * Usage:
 * import TechnicianDashboard from './components/TechnicianDashboard'
 * <TechnicianDashboard />
 *
 */

export default function TechnicianDashboard() {
  // User state
  const [user, setUser] = useState({ name: "Loading...", email: "" });
  const [userLoading, setUserLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Remove hardcoded orders; will fetch pending orders from API
  const initialOrders = [];

  const initialNotifications = [
    { id: 1, text: "New car repair work posted by Mr John.", time: "11:10 pm", read: false },
    { id: 2, text: "New car repair work posted by Mr Jacob.", time: "11:10 pm", read: false },
    { id: 3, text: "Emergency Work Alert by Mr John.", time: "11:10 pm", read: false },
  ];

  // --- state
  const [orders, setOrders] = useState(initialOrders);
  const [allOrders, setAllOrders] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, order: null });
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const listEndpoint = `${API_URL}/work-orders?status=pending`;
  const statusEndpoint = (id) => `${API_URL}/work-orders/${id}/status`;
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [referModal, setReferModal] = useState({ open: false, order: null, supply_item: '', item_description: '' });

  // create-work-order form state
  const [newOrder, setNewOrder] = useState({
    customerName: "",
    phone: "",
    vin: "",
    odometer: "",
    make: "",
    model: "",
    year: "",
    trim: "",
    workTypes: [], // list of strings
    items: [], // {desc, qty, price}
    notes: "",
  });

  // --- helpers
const statusMeta = {
  requested: { label: "Requested", color: "bg-blue-100 text-blue-800", dot: "#29cc6a" },
  accepted: { label: "accepted", color: "bg-blue-100 text-blue-800", dot: "#29cc6a" },
  in_progress: { label: "In Progress", color: "bg-orange-100 text-orange-800", dot: "#FF9500" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", dot: "#FFCC00" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", dot: "#34C759" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", dot: "#FF3B30" },
};

  // Normalize various status formats to our keys and provide safe meta
  const normalizeStatusKey = (s) => {
    const k = String(s || '').toLowerCase().trim();
    if (k === 'in-progress' || k === 'in progress' || k === 'in process') return 'in_progress';
    return k;
  };
  const defaultStatusMeta = { label: 'Unknown', color: 'bg-gray-100 text-gray-800', dot: '#9CA3AF' };
  const getStatusMeta = (s) => statusMeta[normalizeStatusKey(s)] || defaultStatusMeta;


  const showToast = (msg, ms = 3000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  };

  const fetchPendingOrders = async () => {
    try {
      const res = await fetch(listEndpoint);
      console.log("Fetching from:", listEndpoint);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to load');
      // orders shape: { id, title, charges, status, updatedAt }
      const pendingList = Array.isArray(data.orders) ? data.orders : [];
      if (pendingList.length > 0) {
        setOrders(pendingList);
        return;
      }
      // Fallback: load all and filter by display status 'Pending' case-insensitively
      const resAll = await fetch(`${API_URL}/work-orders`);
      const dataAll = await resAll.json();
      if (!resAll.ok || !dataAll?.success) throw new Error(dataAll?.error || 'Failed to load all');
      const all = Array.isArray(dataAll.orders) ? dataAll.orders : [];
      const filtered = all.filter((o) => String(o.status).toLowerCase() === 'pending');
      setOrders(filtered);
    } catch (e) {
      console.error('Pending orders fetch failed:', e);
      setOrders([]);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/work-orders`);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to load all');
      const all = Array.isArray(data.orders) ? data.orders : [];
      setAllOrders(all);
    } catch (e) {
      console.error('All orders fetch failed:', e);
      setAllOrders([]);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
    fetchAllOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acceptOrder = (order) => {
    setConfirmModal({ open: true, type: 'accept', order });
  };

  // Decline action removed per requirement

  const closeConfirm = () => setConfirmModal({ open: false, type: null, order: null });

  const performConfirm = async () => {
    const { type, order } = confirmModal;
    if (!type || !order) return closeConfirm();
    try {
      let newStatus = 'requested';
      if (type === 'accept') newStatus = 'in_progress';
      if (type === 'finish') newStatus = 'completed';
      const technicianEmail = user?.email || localStorage.getItem('userEmail') || '';
      const res = await fetch(statusEndpoint(order.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, accepted_by: technicianEmail })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Status update failed');
      await fetchPendingOrders();
      await fetchAllOrders();
      if (type === 'accept') showToast('Work order accepted successfully!');
      if (type === 'finish') {
        showToast('Work order marked as completed');
        setSelectedOrder((s) => (s && s.id === order.id ? { ...s, status: 'completed' } : s));
      }
      closeConfirm();
    } catch (e) {
      console.error('Confirm action failed:', e);
      showToast('Action failed');
      closeConfirm();
    }
  };

  const openDetails = async (order) => {
    try {
      setDetailsLoading(true);
      const res = await fetch(`${API_URL}/work-orders/${order.id}`);
      const data = await res.json();
      if (res.ok && data?.success && data?.order) {
        const o = data.order;
        const items = Array.isArray(data.items)
          ? data.items.map((it) => ({ desc: it.description, qty: Number(it.qty || 1), price: Number(it.unit_price || 0) }))
          : (order.items || []);
        const workTypes = Array.isArray(data.work_types)
          ? data.work_types.map((wt) => wt.work_type_title || wt.work_type_id || '').filter(Boolean)
          : (order.workTypes || []);
        const mapped = {
          id: o.id,
          title: order.title || `${o.vehicle_year ? o.vehicle_year + ' ' : ''}${o.vehicle_make || ''} ${o.vehicle_model || ''}`.trim(),
          assignedBy: o.created_by || order.assignedBy || '—',
          customerName: o.customer_name || order.customerName || '—',
          phone: o.customer_phone || order.phone || '—',
          vehicle: `${o.vehicle_make || ''} ${o.vehicle_model || ''}`.trim() || order.vehicle || '—',
          vin: o.vehicle_vin || order.vin || '—',
          modelYear: o.vehicle_year || order.modelYear || '—',
          odometer: o.vehicle_odometer || order.odometer || '—',
          trim: o.vehicle_trim || order.trim || '—',
          status: o.status || order.status,
          accepted_by: o.accepted_by || order.accepted_by || null,
          created_at: o.created_at || null,
          updated_at: o.updated_at || null,
          date: o.updated_at || o.created_at || order.date || '—',
          activityType: o.activity_type || '—',
          notes: o.activity_description || order.notes || '',
          repairTypes: o.repairs_json || [],
          items,
          workTypes,
          quote_subtotal: Number(o.quote_subtotal || 0),
          quote_tax: Number(o.quote_tax || 0),
          quote_total: Number(o.quote_total || 0),
          photos: Array.isArray(data.photos) ? data.photos : [],
        };
        setSelectedOrder(mapped);
      } else {
        setSelectedOrder(order);
      }
    } catch (e) {
      console.error('Failed to load work order details:', e);
      setSelectedOrder(order);
    } finally {
      setIsDetailsOpen(true);
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedOrder(null);
    setIsDetailsOpen(false);
  };

  const openReferModal = (order) => {
    setReferModal({ open: true, order, supply_item: '', item_description: '' });
  };

  const closeReferModal = () => setReferModal({ open: false, order: null, supply_item: '', item_description: '' });

  const submitReferToConsultant = async () => {
    const { order, supply_item, item_description } = referModal;
    if (!order || !supply_item || String(supply_item).trim() === '') {
      showToast('Supply item is required');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/work-orders/${order.id}/refer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supply_item: String(supply_item).trim(), item_description: String(item_description || '').trim() || null })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to refer');
      showToast('Sent to consultant for approval');
      await fetchAllOrders();
      // Update selected order temp fields locally if open
      setSelectedOrder((s) => (s && s.id === order.id ? { ...s, temp_supply_item: String(supply_item).trim(), temp_desc: String(item_description || '').trim() || null } : s));
      closeReferModal();
    } catch (e) {
      console.error('Refer failed:', e);
      showToast('Failed to send referral');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const technicianEmail = (user?.email || localStorage.getItem('userEmail') || '');
      const res = await fetch(statusEndpoint(orderId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, accepted_by: technicianEmail })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Status update failed');
      await fetchPendingOrders();
      await fetchAllOrders();
      showToast('Status updated');
    } catch (e) {
      console.error('Status update failed:', e);
      showToast('Status update failed');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesQuery =
      !query ||
      o.title.toLowerCase().includes(query.toLowerCase()) ||
      o.customerName.toLowerCase().includes(query.toLowerCase()) ||
      o.vin.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = filterStatus === "all" ? true : o.status === filterStatus;
    return matchesQuery && matchesStatus;
  });

  const techEmail = (user?.email || localStorage.getItem('userEmail') || '').toLowerCase().trim();
  const counts = {
    new: allOrders.filter((o) => normalizeStatusKey(o.status) === 'pending').length,
    in_progress: allOrders.filter((o) => normalizeStatusKey(o.status) === 'in_progress' && String(o.accepted_by || '').toLowerCase() === techEmail).length,
    finished: allOrders.filter((o) => normalizeStatusKey(o.status) === 'completed' && String(o.accepted_by || '').toLowerCase() === techEmail).length,
  };

  const workListByTab = (() => {
    const matchesQuery = (o) => (
      !query ||
      String(o.title || '').toLowerCase().includes(query.toLowerCase()) ||
      String(o.customerName || '').toLowerCase().includes(query.toLowerCase()) ||
      String(o.vin || '').toLowerCase().includes(query.toLowerCase())
    );
    const isMine = (o) => String(o.accepted_by || '').toLowerCase().trim() === techEmail;
    const statusKey = (o) => normalizeStatusKey(o.status);
    if (filterStatus === 'in_progress') {
      return allOrders.filter((o) => statusKey(o) === 'in_progress' && isMine(o) && matchesQuery(o));
    }
    if (filterStatus === 'finished') {
      return allOrders.filter((o) => statusKey(o) === 'completed' && isMine(o) && matchesQuery(o));
    }
    // 'all' tab defaults to completed work history accepted by this technician
    return allOrders.filter((o) => statusKey(o) === 'completed' && isMine(o) && matchesQuery(o));
  })();

  // --- Create Work Order Wizard handlers
  const resetWizard = () => {
    setWizardStep(1);
    setNewOrder({
      customerName: "",
      phone: "",
      vin: "",
      odometer: "",
      make: "",
      model: "",
      year: "",
      trim: "",
      workTypes: [],
      items: [],
      notes: "",
    });
  };

  const addWorkType = (type) => {
    setNewOrder((s) => ({ ...s, workTypes: s.workTypes.includes(type) ? s.workTypes : [...s.workTypes, type] }));
  };

  const addItemToNewOrder = (item) => {
    setNewOrder((s) => ({ ...s, items: [...s.items, item] }));
  };

  const submitNewOrder = () => {
    const id = `W${String(Date.now()).slice(-4)}`;
    const created = {
      id,
      title: newOrder.workTypes.join(", ") || "General Service",
      slot: "To be scheduled",
      assignedBy: "Unassigned",
      customerName: newOrder.customerName || "Unknown",
      vehicle: `${newOrder.make} ${newOrder.model}`.trim() || "Unknown",
      vin: newOrder.vin || "",
      phone: newOrder.phone || "",
      modelYear: newOrder.year || "",
      repairType: newOrder.workTypes[0] || "General",
      status: "new",
      date: new Date().toISOString().slice(0, 10),
      items: newOrder.items.length ? newOrder.items : [{ desc: "Labor", qty: 1, price: 0 }],
      notes: newOrder.notes,
    };
    setOrders((o) => [created, ...o]);
    setIsCreateOpen(false);
    resetWizard();
    setNotifications((n) => [{ id: Date.now(), text: `New work order created ${id}`, time: "now", read: false }, ...n]);
    showToast("Work order created");
  };

  // --- edit order inline in details modal
  const saveOrderEdits = (changes) => {
    setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? { ...o, ...changes } : o)));
    setSelectedOrder((s) => ({ ...s, ...changes }));
    showToast("Work order updated");
  };

  // --- invoice download
  const downloadInvoice = (order) => {
    // build basic HTML invoice
    const total = (order.items || []).reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice - ${order.id}</title>
  <style>
    body { font-family: Inter, Roboto, Arial, sans-serif; padding:20px; color:#111 }
    h1 { color:#29cc6a }
    table { width:100%; border-collapse: collapse; margin-top:20px }
    th, td { text-align:left; padding:8px; border-bottom:1px solid #ddd }
    .total { font-weight:700; font-size:1.1rem; }
  </style>
</head>
<body>
  <h1>Invoice - ${order.id}</h1>
  <p><strong>Customer:</strong> ${order.customerName} • ${order.phone}</p>
  <p><strong>Vehicle:</strong> ${order.vehicle} • VIN: ${order.vin}</p>
  <p><strong>Date:</strong> ${order.date}</p>
  <table>
    <thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
    <tbody>
      ${(order.items || [])
        .map(
          (it) =>
            `<tr><td>${it.desc}</td><td>${it.qty}</td><td>$${Number(it.price).toFixed(2)}</td><td>$${(
              (Number(it.price) || 0) *
              (Number(it.qty) || 1)
            ).toFixed(2)}</td></tr>`
        )
        .join("")}
    </tbody>
  </table>
  <p class="total">Total: $${Number(total).toFixed(2)}</p>
  <p>Generated by Technician Dashboard</p>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice_${order.id}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Invoice downloaded");
  };

  // --- notifications helpers
  const markAllRead = () => {
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
          console.error('No user email found in localStorage');
          setUser({ name: "Guest User", email: "" });
          setUserLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/auth/user/${encodeURIComponent(userEmail)}`);
        const data = await response.json();

        if (data.success && data.user) {
          setUser({
            name: data.user.name,
            email: data.user.email
          });
        } else {
          console.error('Failed to fetch user data:', data.error);
          setUser({ name: "Guest User", email: userEmail });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser({ name: "Guest User", email: "" });
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Logout functionality
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    
    // Close modal
    setShowLogoutModal(false);
    
    // Redirect to login selection
    window.location.href = '/loginselection';
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // cleanup timers
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // --- tiny inline icon svgs to avoid external libs
  const IconBell = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );

  const IconSearch = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
    </svg>
  );

  const IconPlus = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );

  // --- small UI pieces
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased" style={{ fontFamily: "Inter, Roboto, sans-serif" }}>
      {/* CSS variables for brand colors (follow Design.json) */}
      <style>{`
        :root {
          --primary: #29cc6a;
          --success: #34C759;
          --accent: #FF9500;
          --warning: #FFCC00;
          --error: #FF3B30;
        }
      `}</style>

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-md flex items-center justify-center bg-[var(--primary)] text-white font-bold">TD</div>
          <div>
            <div className="text-lg font-semibold">Technician Dashboard</div>
            <div className="text-xs text-gray-500">Welcome back — manage your work orders</div>
          </div>
        </div>

        <div className="flex-1 px-6">
          <div className="max-w-2xl mx-auto">
            <label className="relative block">
              <span className="sr-only">Search work orders</span>
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <IconSearch />
              </span>
              <input
                className="placeholder:italic placeholder:text-slate-400 block bg-gray-100 w-full border border-transparent rounded-md py-2 pl-10 pr-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="Search work orders, customer, VIN..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            title="Create Work Order"
             onClick={handleLogout} 
             className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-md shadow-sm text-sm cursor-pointer transition-colors"
          >
    
            Logout
          </button>

          <div className="relative">
            <button
              onClick={() => {
                // open notifications panel toggled by a small flag
                const panel = document.getElementById("notif-panel");
                if (panel) panel.classList.toggle("hidden");
              }}
              className="p-2 rounded-md hover:bg-gray-100 cursor-pointer"
              aria-label="Notifications"
            >
              <IconBell />
            </button>

            <div
              id="notif-panel"
              className="hidden absolute right-0 mt-2 w-80 bg-white rounded-md shadow-card ring-1 ring-black ring-opacity-5 z-40"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="font-medium">Notifications</div>
                <div className="text-sm flex items-center gap-2">
                  <button onClick={markAllRead} className="text-xs text-slate-500 hover:underline cursor-pointer">Mark all</button>
                  <button onClick={clearNotifications} className="text-xs text-red-500 hover:underline cursor-pointer">Clear</button>
                </div>
              </div>
              <div className="max-h-64 overflow-auto">
                {notifications.length === 0 && <div className="p-4 text-sm text-gray-500">No notifications</div>}
                {notifications.map((n) => (
                  <div key={n.id} className={`p-3 border-b ${n.read ? "bg-white" : "bg-gray-50"}`}>
                    <div className="text-sm">{n.text}</div>
                    <div className="text-xs text-gray-400">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
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
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-[#29cc6a] font-semibold cursor-pointer">
              {user.name ? user.name.charAt(0).toUpperCase() : 'T'}
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-3 hidden lg:block">
            <nav className="bg-white rounded-md p-4 shadow-card space-y-2">
              <button onClick={() => setFilterStatus("all")} className={`w-full text-left p-2 rounded cursor-pointer ${filterStatus==="all" ? "bg-[var(--primary)] text-white" : "hover:bg-gray-50"}`}>All Work</button>
              {/* <button onClick={() => setFilterStatus("new")} className={`w-full text-left p-2 rounded cursor-pointer ${filterStatus==="new" ? "bg-[var(--primary)] text-white" : "hover:bg-gray-50"}`}>New</button> */}
              <button onClick={() => setFilterStatus("in_progress")} className={`w-full text-left p-2 rounded cursor-pointer ${filterStatus==="in_progress" ? "bg-[var(--primary)] text-white" : "hover:bg-gray-50"}`}>In Progress</button>
              <button onClick={() => setFilterStatus("finished")} className={`w-full text-left p-2 rounded cursor-pointer ${filterStatus==="finished" ? "bg-[var(--primary)] text-white" : "hover:bg-gray-50"}`}>Finished</button>

              <div className="border-t pt-3">
                <div className="text-xs font-semibold text-gray-500">Quick actions</div>
                {/* <button onClick={() => { setIsCreateOpen(true); resetWizard(); }} className="w-full mt-2 inline-flex items-center gap-2 bg-white border border-gray-200 text-sm px-3 py-2 rounded cursor-pointer">
                  <IconPlus /> Create Work Order
                </button> */}
                <button onClick={() => window.print()} className="w-full mt-2 inline-flex items-center gap-2 bg-white border border-gray-200 text-sm px-3 py-2 rounded cursor-pointer">
                  Print
                </button>
              </div>
            </nav>

            <div className="mt-4 bg-white p-4 rounded-md shadow-card">
              <div className="text-xs font-semibold text-gray-500">Work Summary</div>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">New</div>
                    <div className="text-xs text-gray-400">Unassigned / awaiting</div>
                  </div>
                  <div className="text-xl font-bold">{counts.new}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">In progress</div>
                    <div className="text-xs text-gray-400">Active jobs</div>
                  </div>
                  <div className="text-xl font-bold">{counts.in_progress}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Completed</div>
                    <div className="text-xs text-gray-400">Work history</div>
                  </div>
                  <div className="text-xl font-bold">{counts.finished}</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <section className="col-span-12 lg:col-span-9 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {/* Cards */}
              <div className="col-span-1 bg-white p-4 rounded-md shadow-card">
                <div className="text-xs text-gray-500">New Work Orders</div>
                <div className="mt-2 text-2xl font-bold">{counts.new}</div>
                <div className="text-xs text-gray-400 mt-1">Check and accept new work</div>
              </div>
              <div className="col-span-1 bg-white p-4 rounded-md shadow-card">
                <div className="text-xs text-gray-500">Active</div>
                <div className="mt-2 text-2xl font-bold">{counts.in_progress}</div>
                <div className="text-xs text-gray-400 mt-1">Jobs you're working on</div>
              </div>
              <div className="col-span-1 bg-white p-4 rounded-md shadow-card">
                <div className="text-xs text-gray-500">Completed</div>
                <div className="mt-2 text-2xl font-bold">{counts.finished}</div>
                <div className="text-xs text-gray-400 mt-1">Work history</div>
              </div>
            </div>

            {/* Latest Work Orders: show pending-only, with themed actions */}
            <div className="bg-white p-4 rounded-md shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Latest Work Orders</h2>
                <div className="text-sm text-gray-500">{orders.length} items</div>
              </div>

              <div className="mt-4 space-y-3">
                {orders.length === 0 && <div className="p-6 text-sm text-gray-500">No pending work orders to show.</div>}
                {orders.map((o) => (
                  <div key={o.id} className="flex items-start gap-4 p-3 border border-gray-300 rounded-md">
                    <div className="w-12 h-12 rounded-md bg-green-100 flex items-center justify-center text-[#29cc6a] font-semibold">
                      {(o.title?.[0] || 'W')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{o.title || `${o.vehicle_make || ''} ${o.vehicle_model || ''}`.trim() || 'Work Order'} <span className="text-xs text-gray-400">• {o.id}</span></div>
                          <div className="text-xs text-gray-500">Updated: {(o.updatedAt || o.updated_at || o.created_at) ? new Date(o.updatedAt || o.updated_at || o.created_at).toLocaleString() : '—'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm mt-1">
                            <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Pending</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <button onClick={() => acceptOrder(o)} className="text-sm bg-[var(--primary)] text-white px-3 py-1 rounded cursor-pointer">Accept</button>
                        <button onClick={() => openDetails(o)} className="text-sm border border-gray-200 px-3 py-1 rounded text-gray-700 hover:bg-gray-50 cursor-pointer">Details</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Work History */}
            <div className="bg-white p-4 rounded-md shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold">{filterStatus === 'in_progress' ? 'In Progress' : (filterStatus === 'finished' ? 'Finished' : 'Work History')}</h3>
                <div className="text-sm text-gray-500">
                  {filterStatus === 'in_progress' && 'Accepted jobs you are working on'}
                  {filterStatus === 'finished' && 'Completed jobs accepted by you'}
                  {filterStatus === 'all' && 'Completed work accepted by you'}
                </div>
              </div>
              <div className="mt-3">
                {workListByTab.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">
                    {filterStatus === 'in_progress' ? 'You have not accepted any work yet.' : 'You have not completed any work yet.'}
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500">
                      <tr>
                        <th className="text-left py-2">#</th>
                        <th className="text-left py-2">Customer</th>
                        <th className="text-left py-2">Title / Vehicle</th>
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {workListByTab.map((o) => (
                        <tr key={o.id} className="border-t">
                          <td className="py-3">{o.id}</td>
                          <td className="py-3">{o.customerName || o.customer_name || '—'}</td>
                          <td className="py-3">
                            {o.title || `${o.vehicle_make || ''} ${o.vehicle_model || ''}`.trim() || 'Work Order'}
                          </td>
                          <td className="py-3">{(o.updatedAt || o.updated_at || o.created_at) ? new Date(o.updatedAt || o.updated_at || o.created_at).toLocaleDateString() : '—'}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusMeta(o.status).color}`}>{getStatusMeta(o.status).label}</span>
                          </td>
                          <td className="py-3">
                            <button onClick={() => openDetails(o)} className="text-sm text-[var(--primary)] hover:underline cursor-pointer">Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Details Modal */}
      {isDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black opacity-30" onClick={closeDetails}></div>
          <div className="relative bg-white w-11/12 md:w-3/4 lg:w-2/3 rounded-md shadow-modal p-6 z-50 max-h-[90vh] overflow-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{selectedOrder.title} • {selectedOrder.id}</h3>
                <div className="text-sm text-gray-500">{selectedOrder.customerName} • {selectedOrder.vehicle} • VIN: {selectedOrder.vin}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadInvoice(selectedOrder)} className="text-sm bg-green-600 text-white px-3 py-1 rounded cursor-pointer">Download Invoice</button>
                {normalizeStatusKey(selectedOrder.status) === 'in_progress' && (
                  <button onClick={() => openReferModal(selectedOrder)} className="text-sm bg-[var(--primary)] text-white px-3 py-1 rounded cursor-pointer">Refer to supplier</button>
                )}
                <button onClick={closeDetails} className="text-sm border px-3 py-1 rounded cursor-pointer">Close</button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">Assigned by</div>
                <div className="font-medium">{selectedOrder.assignedBy}</div>

                <div className="mt-3 text-xs text-gray-500">Accepted By</div>
                <div className="font-medium">{selectedOrder.accepted_by || '—'}</div>

                <div className="mt-3 text-xs text-gray-500">Phone</div>
                <div>{selectedOrder.phone}</div>

                <div className="mt-3 text-xs text-gray-500">Model Year</div>
                <div>{selectedOrder.modelYear}</div>

                <div className="mt-3 text-xs text-gray-500">Odometer</div>
                <div>{selectedOrder.odometer}</div>

                <div className="mt-3 text-xs text-gray-500">Trim</div>
                <div>{selectedOrder.trim}</div>

                <div className="mt-3 text-xs text-gray-500">Activity Type</div>
                <div>{selectedOrder.activityType}</div>

                <div className="mt-3 text-xs text-gray-500">Repair Types</div>
                <div>
                  <RepairTypesList repairTypes={selectedOrder.repairTypes} className="mt-1" />
                </div>

                {selectedOrder.paint_codes_json && Array.isArray(selectedOrder.paint_codes_json) && selectedOrder.paint_codes_json.length > 0 && (
                  <div>
                    <div className="mt-3 text-xs text-gray-500">Paint Codes</div>
                    <div className="mt-1 space-y-1">
                      {selectedOrder.paint_codes_json.map((paintCode, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {paintCode.code}
                          </span>
                          <span className="text-gray-600">Qty: {paintCode.quantity}</span>
                          {paintCode.triStage && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                              Tri Stage
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-500">Status</div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs ${getStatusMeta(selectedOrder.status).color}`}>{getStatusMeta(selectedOrder.status).label}</span>
                </div>

                <div className="mt-3 text-xs text-gray-500">Date</div>
                <div>{selectedOrder.date}</div>

                <div className="mt-3 text-xs text-gray-500">Notes</div>
                <div className="text-sm whitespace-pre-line">{selectedOrder.notes}</div>

                <div className="mt-3 text-xs text-gray-500">Quote</div>
                <div className="text-sm">Subtotal: ${Number(selectedOrder.quote_subtotal || 0).toFixed(2)} • Tax: ${Number(selectedOrder.quote_tax || 0).toFixed(2)} • Total: ${Number(selectedOrder.quote_total || 0).toFixed(2)}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold">Parts & Labor</div>
              <div className="mt-2">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-400">
                    <tr><th className="text-left">Desc</th><th>Qty</th><th>Price</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((it, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2">{it.desc}</td>
                        <td className="py-2 text-center">{it.qty}</td>
                        <td className="py-2 text-right">${Number(it.price).toFixed(2)}</td>
                        <td className="py-2 text-right">${((Number(it.price) || 0) * (Number(it.qty) || 1)).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="border-t">
                      <td className="py-2 font-semibold">Total</td>
                      <td></td>
                      <td></td>
                      <td className="py-2 text-right font-semibold">${((selectedOrder.items || []).reduce((a,c)=>a + (Number(c.price)||0)*(Number(c.qty)||1),0)).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

              <div className="mt-4 flex items-center gap-2">
              {selectedOrder.status !== "finished" && normalizeStatusKey(selectedOrder.status) !== 'completed' && (
                <button
                  onClick={() => setConfirmModal({ open: true, type: 'finish', order: selectedOrder })}
                  className="bg-[var(--success)] px-3 py-1 text-white rounded cursor-pointer"
                >
                  Mark Finished
                </button>
              )}
              <button onClick={() => downloadInvoice(selectedOrder)} className="border px-3 py-1 rounded cursor-pointer">Generate Invoice</button>
              <button onClick={closeDetails} className="text-sm ml-auto text-gray-600 cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            {confirmModal.type === 'accept' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">✔</div>
                  <h3 className="text-lg font-semibold text-black">Accept Work Order</h3>
                </div>
                <p className="text-sm text-gray-700 mb-6">Accepting will move this work to In Progress.</p>
              </>
            )}
            {confirmModal.type === 'finish' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700">⚠</div>
                  <h3 className="text-lg font-semibold text-black">Confirm Completion</h3>
                </div>
                <p className="text-sm text-gray-700 mb-6">Have you completed this work order? This action cannot be undone.</p>
              </>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={closeConfirm} className="px-4 py-2 border rounded-md hover:bg-gray-50 cursor-pointer">Cancel</button>
              <button onClick={performConfirm} className="px-4 py-2 rounded-md text-white cursor-pointer bg-[var(--primary)] hover:brightness-95">
                {confirmModal.type === 'accept' ? 'Accept' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refer to Supplier Modal */}
      {referModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-modal">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--primary-light,#ecf2ff)] text-[var(--primary,#2f55d4)]">⮕</div>
              <h3 className="text-lg font-semibold text-black">Refer to Supplier</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">This will be forwarded to your consultant. On approval, it will be sent to the supplier.</p>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-700">Supply item<span className="text-red-500">*</span></label>
                <input value={referModal.supply_item} onChange={(e)=>setReferModal((s)=>({ ...s, supply_item: e.target.value }))} placeholder="e.g., Front bumper, AC compressor" className="mt-1 w-full p-2 border rounded"/>
              </div>
              <div>
                <label className="text-sm text-gray-700">Item description (optional)</label>
                <textarea value={referModal.item_description} onChange={(e)=>setReferModal((s)=>({ ...s, item_description: e.target.value }))} placeholder="Additional notes or description" className="mt-1 w-full p-2 border rounded"></textarea>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button onClick={submitReferToConsultant} className="bg-[var(--primary)] px-3 py-1 text-white rounded cursor-pointer">Send to consultant for approval</button>
              <button onClick={closeReferModal} className="border px-3 py-1 rounded cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Work Order Wizard Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black opacity-30" onClick={() => setIsCreateOpen(false)}></div>
          <div className="relative bg-white w-11/12 md:w-3/4 rounded-md shadow-modal p-6 z-50 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Work Order</h3>
              <div className="text-sm text-gray-500">Step {wizardStep} / 4</div>
            </div>

            {/* Steps */}
            <div className="mt-4">
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">Customer information</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Customer name" value={newOrder.customerName} onChange={(e)=>setNewOrder(s=>({...s, customerName:e.target.value}))} className="p-2 border rounded"/>
                    <input placeholder="Phone" value={newOrder.phone} onChange={(e)=>setNewOrder(s=>({...s, phone:e.target.value}))} className="p-2 border rounded"/>
                    <input placeholder="VIN" value={newOrder.vin} onChange={(e)=>setNewOrder(s=>({...s, vin:e.target.value}))} className="p-2 border rounded"/>
                    <input placeholder="Odometer" value={newOrder.odometer} onChange={(e)=>setNewOrder(s=>({...s, odometer:e.target.value}))} className="p-2 border rounded"/>
                  </div>

                  <div className="text-sm text-gray-600 mt-3">Vehicle info</div>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <input placeholder="Make" value={newOrder.make} onChange={(e)=>setNewOrder(s=>({...s, make:e.target.value}))} className="p-2 border rounded"/>
                    <input placeholder="Model" value={newOrder.model} onChange={(e)=>setNewOrder(s=>({...s, model:e.target.value}))} className="p-2 border rounded"/>
                    <input placeholder="Year" value={newOrder.year} onChange={(e)=>setNewOrder(s=>({...s, year:e.target.value}))} className="p-2 border rounded"/>
                    <input placeholder="Trim" value={newOrder.trim} onChange={(e)=>setNewOrder(s=>({...s, trim:e.target.value}))} className="p-2 border rounded"/>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">Add work types</div>
                  <div className="flex flex-wrap gap-2">
                    {["Engine checkup","Air Conditioning","Oil change","ECU testing","Brake","Paint","Other"].map((t)=>(
                      <button key={t} onClick={()=>addWorkType(t)} className={`px-3 py-1 rounded border cursor-pointer ${newOrder.workTypes.includes(t) ? "bg-[var(--primary)] text-white" : "bg-white"}`}>{t}</button>
                    ))}
                  </div>

                  <div className="text-sm text-gray-600 mt-3">Add item (part / labor)</div>
                  <AddItemInline onAdd={(it)=>addItemToNewOrder(it)} />
                  <div className="mt-2">
                    {(newOrder.items || []).map((it, idx)=>(
                      <div key={idx} className="text-sm">{it.desc} — {it.qty} × ${it.price}</div>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div>
                  <div className="text-sm text-gray-600">Activity details</div>
                  <textarea placeholder="Activity description / notes" value={newOrder.notes} onChange={(e)=>setNewOrder(s=>({...s, notes:e.target.value}))} className="mt-2 w-full p-2 border rounded" rows={4}></textarea>
                  <div className="text-xs text-gray-400 mt-2">Add quotes, attributes or attachments in next steps (if needed)</div>
                </div>
              )}

              {wizardStep === 4 && (
                <div>
                  <div className="text-sm font-semibold">Review</div>
                  <div className="mt-3 text-sm">
                    <div><span className="font-medium">Customer:</span> {newOrder.customerName} • {newOrder.phone}</div>
                    <div><span className="font-medium">Vehicle:</span> {newOrder.make} {newOrder.model} {newOrder.year}</div>
                    <div><span className="font-medium">Work types:</span> {(newOrder.workTypes || []).join(", ")}</div>
                    <div className="mt-2"><span className="font-medium">Items:</span></div>
                    <div className="mt-1">
                      {(newOrder.items || []).map((it,idx)=>(
                        <div key={idx} className="text-sm">{it.desc} — {it.qty} × ${it.price}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-2">
              <div className="flex-1">
                {wizardStep > 1 && <button onClick={()=>setWizardStep(s=>s-1)} className="px-3 py-1 border rounded cursor-pointer">Previous</button>}
              </div>

              <div className="flex items-center gap-2">
                {wizardStep < 4 && <button onClick={()=>setWizardStep(s=>s+1)} className="px-3 py-1 bg-[var(--primary)] text-white rounded cursor-pointer">Next</button>}
                {wizardStep === 4 && <button onClick={submitNewOrder} className="px-3 py-1 bg-[var(--primary)] text-white rounded cursor-pointer">Submit</button>}
                <button onClick={()=>{setIsCreateOpen(false); resetWizard();}} className="px-3 py-1 border rounded cursor-pointer">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
              
              {/* Message */}
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to logout? You will need to sign in again to access your dashboard.
              </p>
              
              {/* Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelLogout}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* simple toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white px-4 py-2 rounded shadow">{toast}</div>
        </div>
      )}
    </div>
  );
}

/**
 * AddItemInline component - small UI to add item to the new-order wizard
 */
function AddItemInline({ onAdd }) {
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");

  const add = () => {
    if (!desc) return;
    onAdd({ desc, qty: Number(qty || 1), price: Number(price || 0) });
    setDesc("");
    setQty(1);
    setPrice("");
  };

  return (
    <div className="flex items-center gap-2">
      <input placeholder="Description" value={desc} onChange={(e)=>setDesc(e.target.value)} className="p-2 border rounded flex-1"/>
      <input placeholder="Qty" type="number" min="1" value={qty} onChange={(e)=>setQty(e.target.value)} className="w-20 p-2 border rounded"/>
      <input placeholder="Price" type="number" value={price} onChange={(e)=>setPrice(e.target.value)} className="w-28 p-2 border rounded"/>
      <button onClick={add} className="px-3 py-1 bg-[var(--primary)] text-white rounded cursor-pointer">Add</button>
    </div>
  );
}