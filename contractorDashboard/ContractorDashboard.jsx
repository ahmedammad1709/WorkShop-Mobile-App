import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

// Layout components
import ContractorSidebar from "./layout/ContractorSidebar";
import ContractorHeader from "./layout/ContractorHeader";

// Home components
import Hero from "./home/Hero";
import WorkOrdersList from "./home/WorkOrdersList";
import OngoingWork from "./home/OngoingWork";

// Create work order components
import CustomerInfo from "./create/CustomerInfo";
import WorkTypes from "./create/WorkTypes";
import SpareParts from "./create/SpareParts";
import ActivityDetails from "./create/ActivityDetails";
import Quote from "./create/Quote";

// Sidebar components
import QuickActions from "./components/QuickActions";
import WorkOrderPreview from "./components/WorkOrderPreview";
import RecentActivity from "./components/RecentActivity";

// Page components
import Notifications from "./notifications/Notifications";
import Orders from "./orders/Orders";

/**
 * ContractorDashboard
 * - Desktop-first contractor dashboard inspired by provided wireframe
 * - Home: Search, Hero, List of Work Orders, Ongoing Work (horizontal)
 * - Create: Multi-step wizard with Work Types, Spare Parts, Activity details and Quote
 * - Enhanced with improved header, search functionality, and invoice download
 */
export default function ContractorDashboard() {
  const [user, setUser] = useState({ name: "Loading...", email: "" });
  const [userLoading, setUserLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // home | create | notifications | orders
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toastTimer = useRef(null);

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

        const response = await fetch(`/api/auth/user/${encodeURIComponent(userEmail)}`);
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

  // Notifications state (now dynamic; loaded from localStorage)
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('contractorNotifications');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setNotifications(parsed);
      }
    } catch {}
  }, []);
  const snapshotRef = useRef(new Map());
  const initializedSnapshotRef = useRef(false);
  const seenEventsRef = useRef(new Set());

  // Toast functionality
  const showToast = (msg, ms = 3000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  };

  // Notification handlers
  const persist = (list) => {
    try { localStorage.setItem('contractorNotifications', JSON.stringify(list)); } catch {}
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      persist(next);
      return next;
    });
    showToast("All notifications marked as read");
  };

  const markNotificationRead = (id) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      persist(next);
      return next;
    });
  };

  const clearAllNotifications = () => {
    setNotifications(() => {
      persist([]);
      return [];
    });
    showToast("All notifications cleared");
  };

  const clearNotification = (id) => {
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id);
      persist(next);
      return next;
    });
  };

  // Unified handler for Notifications component: if no id, mark all
  const handleMarkRead = (id) => {
    if (!id) return markAllNotificationsRead();
    return markNotificationRead(id);
  };

  // Cleanup toast timer
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // Wizard state for Create Work Order
  const [step, setStep] = useState(1);
  const steps = ["Customer", "Work Type", "Spare Parts", "Activity", "Quote"];

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
  });

  const [vehicle, setVehicle] = useState({
    make: "",
    model: "",
    vin: "",
    year: "",
    odometer: "",
    confirmOdometer: "",
    trim: "",
  });

  // sample work types (matching the wireframe with small images)
  const initialWorkTypes = [
    { id: "engine", title: "Engine", img: "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=600&q=60", selected: false },
    { id: "brakes", title: "Brakes", img: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=600&q=60", selected: false },
    { id: "electrical", title: "Electrical", img: "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=600&q=60", selected: false },
    { id: "suspension", title: "Suspension", img: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=600&q=60", selected: false },
    { id: "hvac", title: "HVAC", img: "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=600&q=60", selected: false },
    { id: "others", title: "Other", img: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=600&q=60", selected: false },
  ];
  const [workTypes, setWorkTypes] = useState(initialWorkTypes);
  const [otherWorkTypeText, setOtherWorkTypeText] = useState('');

  // Dynamic work type catalog fetched from backend (name + price)
  const [workTypeCatalog, setWorkTypeCatalog] = useState([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/work-type-prices');
        const data = await res.json();
        if (res.ok && data?.success && Array.isArray(data.items)) {
          const mapped = data.items.map((it) => ({ id: it.id, title: it.name, name: it.name, price: Number(it.price || 0) }));
          if (mounted) setWorkTypeCatalog(mapped);
        }
      } catch (e) {
        console.error('Failed to load work type prices', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const getWorkTypePrice = (w) => {
    // Match by id or title; for 'others', try matching otherWorkTypeText
    const titleToMatch = w.id === 'others' ? (otherWorkTypeText || '').trim() : (w.title || '').trim();
    const lc = (titleToMatch || '').toLowerCase();
    const byId = workTypeCatalog.find((it) => String(it.id) === String(w.id));
    if (byId) return Number(byId.price || 0);
    const byTitle = workTypeCatalog.find((it) => String(it.title || '').toLowerCase() === lc);
    if (byTitle) return Number(byTitle.price || 0);
    return 0; // default to 0 if no match found
  };

  // spare parts catalog (select & add to cart)
  const spareCatalog = [
    { id: "sp1", title: "Oil Filter", price: 12.5 },
    { id: "sp2", title: "Brake Pads", price: 45.0 },
    { id: "sp3", title: "Air Filter", price: 18.0 },
    { id: "sp4", title: "Spark Plug (set)", price: 34.0 },
  ];
  const [partsCart, setPartsCart] = useState([]); // {id,title,price,qty}

  const [activity, setActivity] = useState({
    type: "Inspection",
    description: "",
    selectedRepairTypes: [], // Changed from repairs object to selectedRepairTypes array
  });
  
  // Paint codes state for Activity step
  const [paintCodes, setPaintCodes] = useState([]);
  
  // Vehicle photos lifted to parent for submission
  const [vehiclePhotos, setVehiclePhotos] = useState([]);

  // Work orders fetched from backend
  const [workOrders, setWorkOrders] = useState([]);

  // Helper to push a notification
  const pushNotification = (text, orderId) => {
    const note = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text,
      time: new Date().toLocaleString(),
      read: false,
      orderId,
    };
    setNotifications(prev => {
      const next = [note, ...prev].slice(0, 200);
      persist(next);
      return next;
    });
  };

  const normalizeStatus = (s) => {
    const str = String(s || '').toLowerCase().trim().replace(/[-_]+/g, ' ');
    if (str.includes('in progress') || str.includes('in process') || str.includes('accepted')) return 'in_progress';
    if (str.includes('completed')) return 'completed';
    if (str.includes('cancelled') || str.includes('canceled')) return 'cancelled';
    if (str.includes('open')) return 'open';
    if (str.includes('pending')) return 'pending';
    if (str.includes('requested')) return 'requested';
    return str || 'requested';
  };

  const diffAndNotify = (prevMap, nextList) => {
    const email = ((user && user.email) || localStorage.getItem('userEmail') || '').toLowerCase();
    const nextMap = new Map();
    nextList.forEach(o => nextMap.set(o.id, o));

    nextList.forEach(o => {
      const createdBy = String(o.created_by || '').toLowerCase();
      if (createdBy !== email) return; // only notify for relevant contractor

      const prev = prevMap.get(o.id);
      if (!prev) {
        const key = `new-${o.id}`;
        if (!seenEventsRef.current.has(key)) {
          seenEventsRef.current.add(key);
          pushNotification(`New work order #${o.id} created${o.accepted_by ? `; accepted by ${o.accepted_by}` : ''}`, o.id);
        }
      } else {
        const ps = normalizeStatus(prev.status);
        const ns = normalizeStatus(o.status);
        if (ps !== ns) {
          const key = `status-${o.id}-${ps}->${ns}`;
          if (!seenEventsRef.current.has(key)) {
            seenEventsRef.current.add(key);
            pushNotification(`Work order #${o.id} status changed: ${ps} → ${ns}`, o.id);
          }
        }
        const pa = String(prev.accepted_by || '').trim();
        const na = String(o.accepted_by || '').trim();
        if (pa !== na && na) {
          const key = `accepted-${o.id}-${na}`;
          if (!seenEventsRef.current.has(key)) {
            seenEventsRef.current.add(key);
            pushNotification(`Work order #${o.id} accepted by Technician ${na}`, o.id);
          }
        }
      }
    });

    snapshotRef.current = nextMap;
  };

  // Fetch work orders from backend (MySQL) and map for UI
  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const base = (API_URL || '').replace(/\/+$/, '');
        const path = /\/api\/?$/.test(base) ? `${base}/work-orders` : `${base}/api/work-orders`;

        const res = await fetch(path);
        const contentType = res.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        const data = isJson ? await res.json() : null;
        if (!res.ok || !data?.success) {
          console.error('Failed to fetch work orders:', data?.error || res.statusText);
          return;
        }

        const placeholderImg = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=60';
        const mapped = (data.orders || []).map((o) => ({
          id: o.id,
          image: o.image || placeholderImg,
          make: o.make || o.vehicle_make || '',
          model: o.model || o.vehicle_model || '',
          year: o.year || o.vehicle_year || '',
          customerName: o.customerName || o.customer_name || '',
          phone: o.phone || o.customer_phone || '',
          vin: o.vin || o.vehicle_vin || '',
          date: (() => {
            const d = o.date || o.created_at || o.updatedAt;
            try { return d ? new Date(d).toISOString().split('T')[0] : ''; } catch { return ''; }
          })(),
          status: o.status || 'Open',
          total: typeof o.total !== 'undefined' ? Number(o.total) : (typeof o.charges !== 'undefined' ? Number(o.charges) : (typeof o.quote_total !== 'undefined' ? Number(o.quote_total) : 0)),
          created_by: o.created_by || o.createdBy || '',
          accepted_by: o.accepted_by || '',
          supplier_email: o.supplier_email || '',
          supply_item: o.supply_item || null,
          item_description: o.item_description || null,
          temp_supply_item: o.temp_supply_item || null,
          temp_desc: o.temp_desc || null,
          items: Array.isArray(o.items) ? o.items : [],
        }));


        setWorkOrders(mapped);
        // Initialize snapshot on first load; do not notify
        if (!initializedSnapshotRef.current) {
          snapshotRef.current = new Map(mapped.map(o => [o.id, o]));
          initializedSnapshotRef.current = true;
        }
      } catch (err) {
        console.error('Error fetching work orders:', err);
      }
    };

    fetchWorkOrders();
  }, []);

  // Poll for work order changes and generate notifications
  useEffect(() => {
    const intervalMs = 10000; // 10s
    let cancelled = false;
    const poll = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const base = (API_URL || '').replace(/\/+$/, '');
        const path = /\/api\/?$/.test(base) ? `${base}/work-orders` : `${base}/api/work-orders`;
        const res = await fetch(path);
        const contentType = res.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        const data = isJson ? await res.json() : null;
        if (!res.ok || !data?.success) return;
        const placeholderImg = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=60';
        const mapped = (data.orders || []).map((o) => ({
          id: o.id,
          image: o.image || placeholderImg,
          make: o.make || o.vehicle_make || '',
          model: o.model || o.vehicle_model || '',
          year: o.year || o.vehicle_year || '',
          customerName: o.customerName || o.customer_name || '',
          phone: o.phone || o.customer_phone || '',
          vin: o.vin || o.vehicle_vin || '',
          date: (() => {
            const d = o.date || o.created_at || o.updatedAt;
            try { return d ? new Date(d).toISOString().split('T')[0] : ''; } catch { return ''; }
          })(),
          status: o.status || 'Open',
          total: typeof o.total !== 'undefined' ? Number(o.total) : (typeof o.charges !== 'undefined' ? Number(o.charges) : (typeof o.quote_total !== 'undefined' ? Number(o.quote_total) : 0)),
          created_by: o.created_by || o.createdBy || '',
          accepted_by: o.accepted_by || '',
          supplier_email: o.supplier_email || '',
          supply_item: o.supply_item || null,
          item_description: o.item_description || null,
          temp_supply_item: o.temp_supply_item || null,
          temp_desc: o.temp_desc || null,
          items: Array.isArray(o.items) ? o.items : [],
        }));
        if (cancelled) return;
        setWorkOrders(mapped);
        if (initializedSnapshotRef.current) {
          diffAndNotify(snapshotRef.current, mapped);
        } else {
          snapshotRef.current = new Map(mapped.map(o => [o.id, o]));
          initializedSnapshotRef.current = true;
        }
      } catch {}
    };
    const id = setInterval(poll, intervalMs);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Ongoing work: show only work orders created by you with status "in process"
  const ongoing = useMemo(() => {
    const email = ((user && user.email) || localStorage.getItem('userEmail') || '').toLowerCase();
    return workOrders
      .filter(o => (o.created_by || '').toLowerCase() === email)
      .filter(o => {
        const s = String(o.status || '').toLowerCase().replace(/[\s-]+/g, '_');
        return s === 'in_process';
      })
      .map(o => ({
        id: o.id,
        title: `${o.customerName || ''} - ${o.make || ''} ${o.model || ''}`.trim(),
        progress: 50,
        avatar: (o.image || 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&q=60'),
      }));
  }, [workOrders, user]);
  
  // Invoice download functionality
  const downloadInvoice = (order) => {
    // Build basic HTML invoice
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
  <p><strong>Vehicle:</strong> ${order.make} ${order.model} (${order.year}) • VIN: ${order.vin}</p>
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
  <p>Generated by Contractor Dashboard</p>
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
  
  // Filter work orders based on search query
  const filteredWorkOrders = useMemo(() => {
    if (!query) return workOrders;
    
    return workOrders.filter(order => 
      order.make.toLowerCase().includes(query.toLowerCase()) ||
      (order.model && order.model.toLowerCase().includes(query.toLowerCase())) ||
      (order.customerName && order.customerName.toLowerCase().includes(query.toLowerCase())) ||
      (order.vin && order.vin.toLowerCase().includes(query.toLowerCase())) ||
      String(order.id).includes(query)
    );
  }, [workOrders, query]);

  // Helpers: workTypes selection toggle
  function toggleWorkTypeSelection(id) {
    setWorkTypes((prev) => prev.map((w) => (w.id === id ? { ...w, selected: !w.selected } : w)));
    if (id === 'others') {
      // If toggling off 'Other', clear the text input
      const isSelecting = !workTypes.find(w => w.id === 'others')?.selected;
      if (!isSelecting) {
        setOtherWorkTypeText('');
      }
    }
  }

  // Parts cart helpers
  function addPartToCart(part) {
    setPartsCart((prev) => {
      const found = prev.find((p) => p.id === part.id);
      if (found) return prev.map((p) => (p.id === part.id ? { ...p, qty: p.qty + 1 } : p));
      return [...prev, { ...part, qty: 1 }];
    });
  }
  function changeCartQty(id, delta) {
    setPartsCart((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, qty: Math.max(0, p.qty + delta) } : p))
        .filter((p) => p.qty > 0)
    );
  }

  // Quote computation
  const quoteItems = useMemo(() => {
    // parts cart entries
    const parts = partsCart.map((p) => ({ id: p.id, title: p.title, qty: p.qty, unit: p.price, total: p.qty * p.price }));
    // labour/activity (simple fixed labour per selected workType)
    const labour = workTypes.filter((w) => w.selected).map((w) => {
      const unitPrice = getWorkTypePrice(w);
      return {
        id: `labour-${w.id}`,
        title: `${w.title} (labour)`,
        qty: 1,
        unit: unitPrice,
        total: unitPrice,
      };
    });
    // other derived items (e.g., activity checks)
    const repairs = [];
    if (activity.selectedRepairTypes && Array.isArray(activity.selectedRepairTypes)) {
      activity.selectedRepairTypes.forEach((repairType) => {
        // Use actual repair type price, fallback to 25 if no price available
        const repairPrice = repairType.price || repairType.unit_price || repairType.unitPrice || 25;
        repairs.push({ 
          id: `repair-${repairType.id}`, 
          title: repairType.name, 
          qty: 1, 
          unit: repairPrice, 
          total: repairPrice 
        });
      });
    }
    return [...parts, ...labour, ...repairs];
  }, [partsCart, workTypes, activity]);

  const subtotal = useMemo(() => quoteItems.reduce((s, it) => s + (it.total || 0), 0), [quoteItems]);
  const tax = +(subtotal * 0.12).toFixed(2); // example 12% tax
  const grandTotal = +(subtotal + tax).toFixed(2);

  // Wizard navigation
  function goNext() {
    // Step-wise validations before proceeding
    if (step === 1) {
      const allCustomerFilled = (customer.name || "").trim() !== "" && (customer.phone || "").trim() !== "";
      const allVehicleFilled = [
        vehicle.make,
        vehicle.model,
        vehicle.vin,
        vehicle.year,
        vehicle.odometer,
        vehicle.confirmOdometer,
        vehicle.trim,
      ].every((v) => (v || "").toString().trim() !== "");

      if (!allCustomerFilled || !allVehicleFilled) {
        showToast("Please fill all customer and vehicle fields before continuing.");
        return;
      }

      // Odometer validations: digits-only and must match
      const digitsOnly = /^\d+$/;
      const odo = String(vehicle.odometer || "");
      const codo = String(vehicle.confirmOdometer || "");
      if (!digitsOnly.test(odo) || !digitsOnly.test(codo)) {
        showToast("Odometer fields must contain only numbers.");
        return;
      }
      if (odo !== codo) {
        showToast("Odometer and Confirm Odometer must match.");
        return;
      }
    }

    if (step === 2) {
      const anyWorkTypeSelected = workTypes.some((w) => w.selected);
      if (!anyWorkTypeSelected) {
        showToast("Please select at least one work type to continue.");
        return;
      }
    }

    // Step 3 (Spare Parts) currently optional; no strict validation

    if (step === 4) {
      const hasDescription = (activity.description || "").trim() !== "";
      const anyRepairChecked = (activity.selectedRepairTypes || []).length > 0;
      if (!hasDescription || !anyRepairChecked) {
        showToast("Please add activity description and select at least one repair.");
        return;
      }
    }

    if (step < steps.length) setStep(step + 1);
  }
  function goPrev() {
    if (step > 1) setStep(step - 1);
  }
  function resetWizard() {
    setStep(1);
    setCustomer({ name: "", phone: "" });
    setVehicle({ make: "", model: "", vin: "", year: "", odometer: "", confirmOdometer: "", trim: "" });
    setWorkTypes(initialWorkTypes);
    setPartsCart([]);
    setActivity({
      type: "Inspection",
      description: "",
      selectedRepairTypes: [], // Changed from repairs object to selectedRepairTypes array
    });
    setPaintCodes([]); // Reset paint codes
  }

  // Event handlers
  const handleCreateClick = () => {
    setActiveTab("create");
    setStep(1);
  };

  const handleOrdersClick = () => {
    setActiveTab("orders");
  };

  const handleNotificationsClick = () => {
    setActiveTab("notifications");
  };

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

  const handleSubmitWorkOrder = async () => {
    // Build payload for API
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const base = (API_URL || '').replace(/\/+$/, '');
    const path = /\/api\/?$/.test(base) ? `${base}/work-orders` : `${base}/api/work-orders`;
    const repairsArray = (activity.selectedRepairTypes || []).map(repairType => repairType.name);

    const payload = {
      created_by: user?.email || localStorage.getItem('userEmail') || '',
      status: 'requested',
      customer: {
        name: customer.name,
        phone: customer.phone,
      },
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        vin: vehicle.vin,
        year: vehicle.year,
        odometer: vehicle.odometer,
        trim: vehicle.trim,
      },
      activity: {
        type: activity.type,
        description: activity.description,
        selectedRepairTypes: activity.selectedRepairTypes, // send the new array structure
      },
      paint_codes: paintCodes, // Send paint codes from ActivityDetails
      quote: {
        subtotal,
        tax,
        total: grandTotal,
      },
      items: [
        // parts from cart
        ...partsCart.map((p) => ({ description: p.title, qty: p.qty, unit_price: p.price })),
        // labour derived from selected work types
        ...workTypes.filter((w) => w.selected).map((w) => ({ description: `${w.title} (labour)`, qty: 1, unit_price: getWorkTypePrice(w) })),
        // repairs flat rate
        ...(activity.selectedRepairTypes || []).map((repairType) => ({ 
          description: repairType.name, 
          qty: 1, 
          unit_price: 25 
        })),
      ],
      work_types: workTypes
        .filter((w) => w.selected)
        .map((w) => ({ 
          id: w.id, 
          title: (w.id === 'others' && (otherWorkTypeText || '').trim()) ? (otherWorkTypeText || '').trim() : w.title 
        })),
      photos: (vehiclePhotos || []).map((ph) => ({ url: ph.url, name: ph.name })),
    };

    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await res.json() : null;

      if (!res.ok || !data?.success) {
        console.error('Failed to submit work order:', data?.error || res.statusText);
        showToast('Failed to submit work order');
        return;
      }

      console.log(`Work order inserted successfully. ID: ${data.id}`);
      showToast('Work Order Created Successfully!');

      // Optimistically add to local list (optional)
      const newWorkOrder = {
        id: data.id,
        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=60",
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year || new Date().getFullYear(),
        customerName: customer.name,
        phone: customer.phone,
        vin: vehicle.vin,
        date: new Date().toISOString().split('T')[0],
        status: 'requested',
        items: payload.items.map(it => ({ desc: it.description, qty: it.qty, price: it.unit_price })),
      };
      setWorkOrders(prev => [newWorkOrder, ...prev]);

      // Reset wizard and go to home
      resetWizard();
      setActiveTab('home');
    } catch (e) {
      console.error('Error submitting work order:', e);
      showToast('Error submitting work order');
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <CustomerInfo customer={customer} setCustomer={setCustomer} vehicle={vehicle} setVehicle={setVehicle} vehiclePhotos={vehiclePhotos} setVehiclePhotos={setVehiclePhotos} />;
      case 2:
  return <WorkTypes 
    workTypes={workTypes} 
    toggleWorkTypeSelection={toggleWorkTypeSelection} 
    otherText={otherWorkTypeText}
    onOtherTextChange={setOtherWorkTypeText}
  />;
      case 3:
        return <SpareParts spareCatalog={spareCatalog} partsCart={partsCart} addPartToCart={addPartToCart} changeCartQty={changeCartQty} />;
      case 4:
        return <ActivityDetails activity={activity} setActivity={setActivity} paintCodes={paintCodes} setPaintCodes={setPaintCodes} />;
      case 5:
        return <Quote quoteItems={quoteItems} subtotal={subtotal} tax={tax} grandTotal={grandTotal} />;
      default:
        return null;
    }
  };

  // Render main content
  const renderMainContent = () => {
    if (activeTab === "home") {
      return (
        <>
          <Hero />
          <WorkOrdersList 
            workOrders={filteredWorkOrders} 
            selectedWorkOrder={selectedWorkOrder} 
            setSelectedWorkOrder={setSelectedWorkOrder} 
            onOrdersClick={() => setActiveTab("orders")}
            onDownloadInvoice={downloadInvoice}
          />
          <OngoingWork ongoing={ongoing} onCreateClick={handleCreateClick} />
        </>
      );
    }

    if (activeTab === "create") {
      return (
        <div className="bg-white p-6 rounded-xl shadow">
          {/* Step header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Create Work Order</h2>
              <div className="text-sm text-gray-400">{`Step ${step} of ${steps.length}`}</div>
            </div>

            <div className="flex items-center gap-2">
              <button className="text-sm text-gray-500" onClick={resetWizard}>Reset</button>
              <div className="text-xs text-gray-400">Preview</div>
            </div>
          </div>

          {/* Step progress pills */}
          <div className="flex items-center gap-3 mb-6">
            {steps.map((s, i) => {
              const idx = i + 1;
              return (
                <div key={s} className={`flex items-center gap-2 ${idx === step ? "text-green-600" : "text-gray-500"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${idx === step ? "bg-green-50" : "bg-gray-100"}`}>{idx}</div>
                  <div className="text-sm hidden md:block">{s}</div>
                  {i < steps.length - 1 && <div className="w-6 h-px bg-gray-200" />}
                </div>
              );
            })}
          </div>

          {/* Step content */}
          <div className="space-y-6">
            {renderStepContent()}
          </div>

          {/* Wizard actions */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={goPrev} disabled={step === 1} className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50 flex items-center gap-2">
                <ChevronLeft size={14} /> Previous
              </button>
              {step < steps.length && (
                <button
                  onClick={goNext}
                  disabled={
                    (step === 1 && (
                      // Compute if Next should be disabled for step 1
                      !((customer.name || '').trim() && (customer.phone || '').trim()) ||
                      ![
                        vehicle.make,
                        vehicle.model,
                        vehicle.vin,
                        vehicle.year,
                        vehicle.odometer,
                        vehicle.confirmOdometer,
                        vehicle.trim,
                      ].every((v) => (v || '').toString().trim() !== '') ||
                      !/^\d+$/.test(String(vehicle.odometer || '')) ||
                      !/^\d+$/.test(String(vehicle.confirmOdometer || '')) ||
                      String(vehicle.odometer || '') !== String(vehicle.confirmOdometer || '')
                    )) ||
                    (step === 2 && (
                      // If 'Other' selected, require the text field
                      (workTypes.some(w => w.id === 'others' && w.selected) && !((otherWorkTypeText || '').trim()))
                    ))
                  }
                  className="px-4 py-2 rounded-lg bg-green-600 text-white flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {step === steps.length && (
                <button onClick={handleSubmitWorkOrder} className="px-5 py-2 bg-green-600 text-white rounded-lg cursor-pointer">
                  Submit Work Order
                </button>
              )}

              <button onClick={resetWizard} className="px-4 py-2 rounded-lg bg-gray-100 cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "notifications") {
      return <Notifications 
        notifications={notifications}
        onMarkRead={markNotificationRead}
        onMarkAllRead={markAllNotificationsRead}
        onClearOne={clearNotification}
        onClearAll={clearAllNotifications}
      />;
    }

    if (activeTab === "orders") {
      return <Orders workOrders={workOrders} setWorkOrders={setWorkOrders} selectedWorkOrder={selectedWorkOrder} setSelectedWorkOrder={setSelectedWorkOrder} userEmail={user?.email || ''} />;
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-800">
      {/* LEFT: rounded vertical navigation card - hidden on mobile */}
      <div className="hidden md:block">
        <ContractorSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout} />
      </div>

      {/* RIGHT: main content */}
      <div className="flex-1 p-4 md:p-8">
        {/* TOP row (search + small actions) */}
        <ContractorHeader 
          user={user} 
          userLoading={userLoading}
          onCreateClick={handleCreateClick} 
          query={query} 
          setQuery={setQuery} 
          notifications={notifications}
          markAllRead={markAllNotificationsRead}
          clearNotifications={clearAllNotifications}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        />
        
        {/* Toast notification */}
        {toast && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in-up">
            {toast}
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

        {/* MAIN GRID: left (content) & right (preview) - responsive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* LEFT: large content */}
          <div className="lg:col-span-8">
            {renderMainContent()}
          </div>

          {/* RIGHT: preview / details - hidden on mobile, shown on large screens */}
          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-4">
              <QuickActions 
                activeTab={activeTab}
                onCreateClick={handleCreateClick}
                onOrdersClick={handleOrdersClick}
                onNotificationsClick={handleNotificationsClick}
              />
              <WorkOrderPreview 
            selectedWorkOrder={selectedWorkOrder} 
            setWorkOrders={setWorkOrders}
            setSelectedWorkOrder={setSelectedWorkOrder}
          />
              <RecentActivity />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
