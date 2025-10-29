// ConsultantDashboard.jsx
// Usage: import ConsultantDashboard from './ConsultantDashboard'; <ConsultantDashboard />
import React, { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/**
 * Consultant Dashboard
 *
 * Features:
 * - Generate reports (filters: report type, vendor, date range, order#, VIN)
 * - Reports history + view each report
 * - Export as PDF (html2canvas + jsPDF; fallback: window.print)
 * - Export as Excel (.xlsx via SheetJS; fallback: CSV)
 * - Print preview
 *
 * Notes:
 * - Tailwind CSS required in project.
 * - Dynamically loads libraries from CDN when export is requested.
 * - Uses font Inter (auto-injected).
 *
 * Reference design & content from uploaded PDF. :contentReference[oaicite:1]{index=1}
 */

export default function ConsultantDashboard() {
  // Inject Inter (if not present)
  useEffect(() => {
    if (!document.querySelector("#consultant-inter")) {
      const link = document.createElement("link");
      link.id = "consultant-inter";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // --- Sample dataset (you can replace with API data) ---
  const sampleOrders = [
    {
      id: "W01",
      title: "Car Engine Repair",
      time: "8:00 AM - 5:00 PM",
      assignedTo: "Charles",
      customerName: "Dave",
      vehicle: "Maruti",
      vin: "#8393038",
      phone: "9112345678",
      modelYear: 2017,
      repairType: "Break",
      services: [
        { name: "Engine Repair", price: 199 },
        { name: "Oil Change", price: 29 },
      ],
      notes: "Progress check, replace piston rings.",
      date: "2025-09-01",
    },
    {
      id: "W02",
      title: "Body Work",
      time: "9:00 AM - 2:00 PM",
      assignedTo: "Emily",
      customerName: "Sarah",
      vehicle: "Honda",
      vin: "#22334455",
      phone: "9123456780",
      modelYear: 2019,
      repairType: "Body",
      services: [{ name: "Paint", price: 250 }],
      notes: "Front bumper repaint.",
      date: "2025-09-05",
    },
  ];

  // --- State ---
  const [reportType, setReportType] = useState("Report Type");
  const [vendor, setVendor] = useState("All Vendors");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [vinFilter, setVinFilter] = useState("");
  const [reportTitle, setReportTitle] = useState("Progress Report");
  const [loadingExport, setLoadingExport] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [history, setHistory] = useState(() => [
    // initial reports
    {
      id: "R1001",
      title: "Progress Report",
      generatedAt: "2025-09-20 10:12",
      filters: { reportType: "Progress Report", vendor: "All Vendors" },
      data: [sampleOrders[0]],
    },
    {
      id: "R1002",
      title: "Sales Report",
      generatedAt: "2025-09-21 09:05",
      filters: { reportType: "Sales Report", vendor: "Vendor A" },
      data: [sampleOrders[1]],
    },
  ]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Header state (similar to SupplierDashboard)
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New report generated successfully",
      time: "2:30 pm",
      read: false,
    },
    {
      id: 2,
      title: "Monthly sales report is ready",
      time: "11:45 am",
      read: false,
    },
    {
      id: 3,
      title: "Export completed for Progress Report",
      time: "Yesterday",
      read: true,
    },
  ]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notificationRef = useRef(null);
  const [user, setUser] = useState({ name: "Loading...", email: "" });
  const [userLoading, setUserLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [message, setMessage] = useState(null);
  // Work Orders state
  const [workOrders, setWorkOrders] = useState([]);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(false);
  const [workOrdersError, setWorkOrdersError] = useState(null);
  const [workOrdersQuery, setWorkOrdersQuery] = useState("");
  
  // Dropdown state for Report Type
  const [isReportTypeOpen, setIsReportTypeOpen] = useState(false);
  
  // Dropdown state for Vendor
  const [isVendorOpen, setIsVendorOpen] = useState(false);

  // Supplier emails for Vendor dropdown
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersError, setSuppliersError] = useState(null);
  const vendorOptions = useMemo(() => ['All Vendors', ...suppliers], [suppliers]);

  // refs for dropdown click-outside handling
  const reportTypeRef = useRef(null);
  const vendorRef = useRef(null);

  // ref to printable report area
  const reportRef = useRef();

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

        const response = await fetch(`/auth/user/${encodeURIComponent(userEmail)}`);
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

  // Fetch work orders from backend API
  useEffect(() => {
    async function fetchWorkOrders() {
      setWorkOrdersLoading(true);
      setWorkOrdersError(null);
      try {
        const res = await fetch('/work-orders');
        const json = await res.json();
        if (json && json.success && Array.isArray(json.orders)) {
          // Normalize status display
          const normalized = json.orders.map((o) => ({
            id: o.id,
            title: o.title || `${o.vehicle_year || ''} ${o.vehicle_make || ''} ${o.vehicle_model || ''}`.trim(),
            customerName: o.customer_name || '',
            phone: o.customer_phone || '',
            vehicle: `${o.vehicle_year || ''} ${o.vehicle_make || ''} ${o.vehicle_model || ''}`.trim(),
            vin: o.vehicle_vin || '',
            assignedTo: o.accepted_by || '',
            status: o.status || o.status_raw || 'Pending',
            status_raw: o.status_raw || (o.status ? String(o.status).toLowerCase() : ''),
            date: o.updatedAt || o.created_at || '',
            modelYear: o.vehicle_year || '',
            charges: o.quote_total || 0,
            // Maintain shape compatible with selectedReport rendering
            services: [],
            notes: '',
          }));
          setWorkOrders(normalized);
        } else {
          setWorkOrders([]);
        }
      } catch (e) {
        console.error('Failed to fetch work orders', e);
        setWorkOrdersError('Failed to load work orders');
      } finally {
        setWorkOrdersLoading(false);
      }
    }
    fetchWorkOrders();
  }, []);

  // Fetch supplier users (role=supplier) for Vendor dropdown
  useEffect(() => {
    async function fetchSuppliers() {
      setSuppliersLoading(true);
      setSuppliersError(null);
      try {
        const res = await fetch('/auth/users/supplier');
        const json = await res.json();
        if (res.ok && json && Array.isArray(json.users)) {
          const emails = [...new Set(json.users.map(u => u.email).filter(Boolean))];
          setSuppliers(emails);
        } else {
          setSuppliers([]);
          setSuppliersError(json.error || 'Failed to load suppliers');
        }
      } catch (e) {
        console.error('Failed to fetch suppliers', e);
        setSuppliersError('Failed to load suppliers');
      } finally {
        setSuppliersLoading(false);
      }
    }
    fetchSuppliers();
  }, []);

  // Filter work orders by status (pending, in_progress, completed, cancelled) and search query
  const filteredWorkOrders = useMemo(() => {
    const allowed = new Set(['pending', 'in_progress', 'in-progress', 'in progress', 'completed', 'cancelled', 'canceled']);
    const term = (workOrdersQuery || '').toLowerCase().trim();
    return workOrders.filter((wo) => {
      const statusOk = allowed.has((wo.status_raw || wo.status || '').toLowerCase());
      if (!statusOk) return false;
      if (!term) return true;
      const hay = `${wo.title} ${wo.customerName} ${wo.vin} ${wo.vehicle} ${wo.assignedTo} ${wo.phone}`.toLowerCase();
      return hay.includes(term);
    });
  }, [workOrders, workOrdersQuery]);

  // helper: show temporary message
  function showMessage(text, ms = 2500) {
    setMessage(text);
    setTimeout(() => setMessage(null), ms);
  }

  // Dynamic notification functions
  function addNotification(title, type = 'info', autoDismiss = false, dismissTime = 5000) {
    const newNotification = {
      id: Date.now() + Math.random(), // Unique ID
      title,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type // 'success', 'error', 'warning', 'info'
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Auto-dismiss if enabled (disabled by default now)
    if (autoDismiss) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, dismissTime);
    }
    
    return newNotification.id;
  }

  function removeNotification(id) {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  function addSuccessNotification(title, autoDismiss = false) {
    return addNotification(title, 'success', autoDismiss);
  }

  function addErrorNotification(title, autoDismiss = false) {
    return addNotification(title, 'error', autoDismiss);
  }

  function addWarningNotification(title, autoDismiss = false) {
    return addNotification(title, 'warning', autoDismiss);
  }

  function addInfoNotification(title, autoDismiss = false) {
    return addNotification(title, 'info', autoDismiss);
  }

  // Header functions (similar to SupplierDashboard)
  function markNotificationRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function clearNotifications() {
    setNotifications([]);
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  // Logout functionality (align with TechnicianDashboard)
  function handleLogout() {
    setShowLogoutModal(true);
  }

  function confirmLogout() {
    // Clear user data from localStorage
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    
    // Close modal
    setShowLogoutModal(false);
    
    // Redirect to login selection
    window.location.href = '/loginselection';
  }

  function cancelLogout() {
    setShowLogoutModal(false);
  }

  // Click outside handler for notifications
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Click outside handler for Report Type dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (reportTypeRef.current && !reportTypeRef.current.contains(event.target)) {
        setIsReportTypeOpen(false);
      }
    }
    if (isReportTypeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isReportTypeOpen]);

  // Click outside handler for Vendor dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (vendorRef.current && !vendorRef.current.contains(event.target)) {
        setIsVendorOpen(false);
      }
    }
    if (isVendorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVendorOpen]);

  // --- Utility: dynamic script loader ---
  function loadScript(src, globalCheck) {
    return new Promise((resolve, reject) => {
      if (globalCheck && typeof globalCheck() !== "undefined" && globalCheck()) {
        return resolve(true);
      }
      // avoid loading same script multiple times
      if (document.querySelector(`script[src="${src}"]`)) {
        // wait for it to be ready
        const script = document.querySelector(`script[src="${src}"]`);
        script.addEventListener("load", () => resolve(true));
        script.addEventListener("error", () => reject(new Error("Script load error")));
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => reject(new Error("Script load error: " + src));
      document.body.appendChild(s);
    });
  }

  // --- Generate a report from filters (backend search) ---
  async function generateReport() {
    try {
      addInfoNotification('Generating report...', false);
      const params = new URLSearchParams();
      if (vendor && vendor !== 'All Vendors') params.set('supplier_email', vendor);
      if (orderNumber) params.set('order_number', String(orderNumber).trim());
      if (vinFilter) params.set('vin', String(vinFilter).trim());
      const toYMD = (d) => {
        if (!d) return null;
        const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return t.toISOString().slice(0, 10);
      };
      const df = toYMD(dateFrom);
      const dt = toYMD(dateTo);
      if (df) params.set('date_from', df);
      if (dt) params.set('date_to', dt);

      const res = await fetch(`/work-orders/search?${params.toString()}`);
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Search failed');
      }

      const orders = Array.isArray(json.orders) ? json.orders : [];
      const mismatches = Array.isArray(json.mismatches) ? json.mismatches : [];
      mismatches.forEach(msg => addWarningNotification(msg));

      const createdByEmail = localStorage.getItem('userEmail') || localStorage.getItem('email') || null;
      const createdByRole = localStorage.getItem('userRole') || null;

      const reportIdFromFilters = orderNumber ? String(orderNumber).trim() : (orders.length === 1 ? String(orders[0]?.id ?? orders[0]?.orderNumber ?? `R${Date.now()}`) : `R${Date.now()}`);

      const newReport = {
        id: reportIdFromFilters,
        title: reportTitle || reportType,
        generatedAt: new Date().toLocaleString(),
        filters: { reportType, vendor, dateFrom, dateTo, orderNumber, vinFilter },
        data: orders,
        createdBy: { email: createdByEmail, role: createdByRole }
      };

      setHistory((h) => [newReport, ...h]);
      addSuccessNotification(`${reportType} generated with ${newReport.data.length} records`);
      showMessage(mismatches.length ? 'Report generated with warnings' : 'Report generated and saved to history');
      setSelectedReport(newReport);
      setViewModalOpen(true);
    } catch (error) {
      console.error('Report generation failed:', error);
      addErrorNotification(error.message || 'Failed to generate report. Please try again.');
    }
  }

  // --- Export as PDF ---
  async function exportReportAsPDF(report = selectedReport) {
    if (!report) {
      addWarningNotification("No report selected for PDF export");
      return showMessage("No report selected");
    }
    
    // Add notification for export start
    addInfoNotification("Starting PDF export...", false);
    
    setLoadingExport(true);
    try {
      // Check if reportRef exists
      const node = reportRef.current;
      if (!node) {
        setLoadingExport(false);
        addErrorNotification("Report content not available for PDF export");
        return showMessage("Report content not available");
      }

      console.log("Loading external libraries for PDF export...");
      
      // load html2canvas and jsPDF with better error handling
      try {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", () => window.html2canvas);
        console.log("html2canvas loaded successfully");
      } catch (err) {
        console.error("Failed to load html2canvas:", err);
        throw new Error("Failed to load html2canvas library");
      }

      try {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", () => window.jspdf && window.jspdf.jsPDF);
        console.log("jsPDF loaded successfully");
      } catch (err) {
        console.error("Failed to load jsPDF:", err);
        throw new Error("Failed to load jsPDF library");
      }

      // Verify libraries are available
      if (!window.html2canvas) {
        throw new Error("html2canvas library not available");
      }
      if (!window.jspdf || !window.jspdf.jsPDF) {
        throw new Error("jsPDF library not available");
      }

      console.log("Creating canvas from report content...");
      addInfoNotification("Processing report content...", false);

      // clone & append to body (off-screen) so html2canvas captures isolated area
      const cloned = node.cloneNode(true);
      cloned.style.width = "1200px"; // render larger for quality
      cloned.style.position = "fixed";
      cloned.style.left = "-20000px";
      cloned.style.top = "0";
      cloned.style.background = "white";
      cloned.style.zIndex = "-1000";
      
      // Fix modern CSS colors that html2canvas doesn't support
      const fixColors = (element) => {
        // Convert modern color functions to hex/rgb equivalents
        const colorMap = {
          'rgb(248 250 252)': '#f8fafc', // slate-50
          'rgb(241 245 249)': '#f1f5f9', // slate-100
          'rgb(226 232 240)': '#e2e8f0', // slate-200
          'rgb(148 163 184)': '#94a3b8', // slate-400
          'rgb(100 116 139)': '#64748b', // slate-500
          'rgb(71 85 105)': '#475569',   // slate-600
          'rgb(15 23 42)': '#0f172a',    // slate-900
          'rgb(34 197 94)': '#22c55e',   // green-500
          'rgb(239 68 68)': '#ef4444',   // red-500
        };
        
        // Apply color fixes to all elements
        const allElements = [element, ...element.querySelectorAll('*')];
        allElements.forEach(el => {
          const computedStyle = window.getComputedStyle(el);
          
          // Fix background colors
          const bgColor = computedStyle.backgroundColor;
          if (bgColor && colorMap[bgColor]) {
            el.style.backgroundColor = colorMap[bgColor];
          }
          
          // Fix text colors
          const textColor = computedStyle.color;
          if (textColor && colorMap[textColor]) {
            el.style.color = colorMap[textColor];
          }
          
          // Fix border colors
          const borderColor = computedStyle.borderColor;
          if (borderColor && colorMap[borderColor]) {
            el.style.borderColor = colorMap[borderColor];
          }
          
          // Remove any CSS custom properties that might cause issues
          el.style.removeProperty('--tw-bg-opacity');
          el.style.removeProperty('--tw-text-opacity');
          el.style.removeProperty('--tw-border-opacity');
        });
      };
      
      document.body.appendChild(cloned);
      
      // Apply color fixes
      fixColors(cloned);

      // Wait for fonts and styles to load
      await new Promise((r) => setTimeout(r, 500));

      let canvas;
      try {
        canvas = await window.html2canvas(cloned, { 
          scale: 2, 
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          ignoreElements: (element) => {
            // Skip elements that might cause issues
            return element.tagName === 'SCRIPT' || 
                   element.tagName === 'STYLE' ||
                   element.classList.contains('ignore-html2canvas');
          }
        });
        console.log("Canvas created successfully, size:", canvas.width, "x", canvas.height);
      } catch (canvasErr) {
        console.error("html2canvas failed:", canvasErr);
        throw new Error("Failed to create canvas from report content");
      } finally {
        document.body.removeChild(cloned);
      }

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error("Generated canvas is empty or invalid");
      }

      console.log("Converting to PDF...");
      addInfoNotification("Generating PDF file...", false);

      const imgData = canvas.toDataURL("image/png");
      if (!imgData || imgData === "data:,") {
        throw new Error("Failed to convert canvas to image data");
      }

      const { jsPDF } = window.jspdf;
      // Create PDF with A4 size orientation portrait
      const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });

      // Calculate dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // image dims in mm
      const imgWidth = (canvas.width * 0.264583); // px to mm (approx at 96dpi)
      const imgHeight = (canvas.height * 0.264583);

      // scale to fit page width
      const scale = Math.min(pageWidth / imgWidth, pageHeight / imgHeight, 1);
      const renderWidth = imgWidth * scale;
      const renderHeight = imgHeight * scale;

      // center
      const x = (pageWidth - renderWidth) / 2;
      const y = 10; // top margin

      pdf.addImage(imgData, "PNG", x, y, renderWidth, renderHeight);
      const filename = `${(report.title || "report").replace(/\s+/g, "_")}_${report.id}.pdf`;
      
      try {
        pdf.save(filename);
        console.log("PDF saved successfully:", filename);
        // Success notification
        addSuccessNotification(`PDF exported successfully: ${filename}`);
        showMessage("PDF exported successfully");
      } catch (saveErr) {
        console.error("Failed to save PDF:", saveErr);
        throw new Error("Failed to save PDF file");
      }

    } catch (err) {
      console.error("PDF export failed:", err);
      
      // More specific error messages
      let errorMessage = "PDF export failed";
      if (err.message.includes("html2canvas")) {
        errorMessage = "Failed to load PDF generation library (html2canvas)";
      } else if (err.message.includes("jsPDF")) {
        errorMessage = "Failed to load PDF generation library (jsPDF)";
      } else if (err.message.includes("canvas")) {
        errorMessage = "Failed to process report content for PDF";
      } else if (err.message.includes("save")) {
        errorMessage = "Failed to save PDF file";
      }
      
      addErrorNotification(errorMessage);
      addWarningNotification("Opening print dialog as fallback");
      showMessage("PDF export failed; opening print dialog as fallback");
      
      // show print-only view of report
      setTimeout(() => {
        try {
          window.print();
        } catch (printErr) {
          console.error("Print dialog also failed:", printErr);
          addErrorNotification("Both PDF export and print dialog failed");
        }
      }, 500);
    } finally {
      setLoadingExport(false);
    }
  }

  // --- Export as Excel (.xlsx) ---
  async function exportReportAsExcel(report = selectedReport) {
    if (!report) {
      addWarningNotification("No report selected for Excel export");
      return showMessage("No report selected");
    }
    
    // Add notification for export start
    addInfoNotification("Prepared Excel export", false);
    
    setLoadingExport(true);
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js", () => window.XLSX);

      const wb = window.XLSX.utils.book_new();
      // Create a sheet with rows for each service per order
      const rows = [["Order ID", "Title", "Assigned To", "Customer", "Vehicle", "VIN", "Phone", "Model Year", "Repair Type", "Service", "Service Price", "Notes", "Date"]];
      report.data.forEach((o) => {
        if (o.services && o.services.length) {
          o.services.forEach((s) => {
            rows.push([o.id, o.title, o.assignedTo, o.customerName, o.vehicle, o.vin, o.phone, o.modelYear, o.repairType, s.name, s.price, o.notes || "", o.date || ""]);
          });
        } else {
          rows.push([o.id, o.title, o.assignedTo, o.customerName, o.vehicle, o.vin, o.phone, o.modelYear, o.repairType, "", "", o.notes || "", o.date || ""]);
        }
      });

      const ws = window.XLSX.utils.aoa_to_sheet(rows);
      window.XLSX.utils.book_append_sheet(wb, ws, "Report");
      const filename = `${(report.title || "report").replace(/\s+/g, "_")}_${report.id}.xlsx`;
      window.XLSX.writeFile(wb, filename);
      
      // Success notification
      addSuccessNotification(`Excel file exported successfully: ${filename}`);
      showMessage("Excel exported");
    } catch (err) {
      console.error("Excel export failed:", err);
      addWarningNotification("Excel export failed, falling back to CSV format");
      // fallback to CSV
      try {
        const csvRows = [];
        csvRows.push(["Order ID","Title","Assigned To","Customer","Vehicle","VIN","Phone","Model Year","Repair Type","Service","Service Price","Notes","Date"].join(","));
        report.data.forEach((o) => {
          if (o.services && o.services.length) {
            o.services.forEach((s) => {
              csvRows.push([
                escapeCsv(o.id), escapeCsv(o.title), escapeCsv(o.assignedTo), escapeCsv(o.customerName), escapeCsv(o.vehicle),
                escapeCsv(o.vin), escapeCsv(o.phone), escapeCsv(String(o.modelYear)), escapeCsv(o.repairType),
                escapeCsv(s.name), escapeCsv(String(s.price)), escapeCsv(o.notes || ""), escapeCsv(o.date || "")
              ].join(","));
            });
          } else {
            csvRows.push([
              escapeCsv(o.id), escapeCsv(o.title), escapeCsv(o.assignedTo), escapeCsv(o.customerName), escapeCsv(o.vehicle),
              escapeCsv(o.vin), escapeCsv(o.phone), escapeCsv(String(o.modelYear)), escapeCsv(o.repairType), "", "", escapeCsv(o.notes || ""), escapeCsv(o.date || "")
            ].join(","));
          }
        });
        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, `${(report.title || "report").replace(/\s+/g, "_")}_${report.id}.csv`);
        
        addSuccessNotification("CSV file exported successfully as fallback");
        showMessage("Excel library not available — downloaded CSV fallback");
      } catch (err2) {
        console.error("CSV fallback failed", err2);
        addErrorNotification("Both Excel and CSV export failed. Please try again.");
        showMessage("Export failed");
      }
    } finally {
      setLoadingExport(false);
    }
  }

  function escapeCsv(val) {
    if (val == null) return "";
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // --- Load report into Selected Report (row click) ---
  function loadReportToSelected(r) {
    setSelectedReport(r);
  }

  // --- Open report popup modal (View button click) ---
  function openHistoryReport(r) {
    setSelectedReport(r);
    setViewModalOpen(true);
  }

  // --- Derived counts ---
  const counts = useMemo(() => ({ total: history.length }), [history]);

  // Search functionality with debouncing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      // Sync WorkOrders table filter with global search bar
      setWorkOrdersQuery(search.trim());
      if (search.trim()) {
        performSearch(search.trim());
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [search, history, sampleOrders, workOrders]);

  function performSearch(query) {
    const searchTerm = query.toLowerCase();
    const results = [];

    // Search in reports history
    history.forEach(report => {
      const matchScore = calculateMatchScore(report, searchTerm);
      if (matchScore > 0) {
        results.push({
          type: 'report',
          data: report,
          id: report.id,
          title: report.title,
          description: `Generated on ${report.generatedAt}`,
          score: matchScore,
          matchedFields: getMatchedFields(report, searchTerm)
        });
      }
    });

    // Search in sample orders data
    sampleOrders.forEach(order => {
      const matchScore = calculateMatchScore(order, searchTerm);
      if (matchScore > 0) {
        results.push({
          type: 'order',
          data: order,
          id: order.id,
          title: `${order.customerName} - ${order.vehicle}`,
          description: `VIN: ${order.vin} | ${order.repairType}`,
          score: matchScore,
          matchedFields: getMatchedFields(order, searchTerm)
        });
      }
    });

    // Search in real work orders
    const allowedStatuses = new Set(['pending', 'in_progress', 'in-progress', 'in progress', 'completed', 'cancelled', 'canceled']);
    workOrders.forEach(wo => {
      const statusKey = (wo.status_raw || wo.status || '').toLowerCase();
      if (!allowedStatuses.has(statusKey)) return;
      const matchScore = calculateMatchScore(wo, searchTerm);
      if (matchScore > 0) {
        results.push({
          type: 'order', // treat as order for UI consistency
          data: wo,
          id: wo.id,
          title: `${wo.customerName || 'Customer'} - ${wo.vehicle || wo.title}`,
          description: `VIN: ${wo.vin} | Status: ${wo.status}`,
          score: matchScore,
          matchedFields: getMatchedFields(wo, searchTerm)
        });
      }
    });

    // Sort by score (highest first)
    results.sort((a, b) => b.score - a.score);
    setSearchResults(results.slice(0, 10)); // Limit to top 10 results
  }

  function calculateMatchScore(item, searchTerm) {
    let score = 0;
    const term = searchTerm.toLowerCase();

    // Helper function to check and score field matches
    const checkField = (value, multiplier = 1) => {
      if (!value) return 0;
      const str = value.toString().toLowerCase();
      if (str === term) return 10 * multiplier; // Exact match
      if (str.startsWith(term)) return 7 * multiplier; // Starts with search term gets medium score
      if (str.includes(term)) return 3 * multiplier; // Contains search term gets lower score
      return 0;
    };

    // Check different fields based on item type
    if (item.title) score += checkField(item.title, 3); // Title matches are important
    if (item.customerName) score += checkField(item.customerName, 2);
    if (item.vin) score += checkField(item.vin, 2);
    if (item.vehicle) score += checkField(item.vehicle, 1.5);
    if (item.repairType) score += checkField(item.repairType, 1.5);
    if (item.phone) score += checkField(item.phone, 1);
    if (item.notes) score += checkField(item.notes, 0.5);
    
    // Search in services if available
    if (item.services && Array.isArray(item.services)) {
      item.services.forEach(service => {
        score += checkField(service.name || service, 0.8);
      });
    }

    // Search in data array for reports
    if (item.data && Array.isArray(item.data)) {
      item.data.forEach(dataItem => {
        score += calculateMatchScore(dataItem, searchTerm) * 0.3; // Reduced weight for nested data
      });
    }

    return score;
  }

  function getMatchedFields(item, searchTerm) {
    const matchedFields = [];
    const term = searchTerm.toLowerCase();

    const checkAndAdd = (value, fieldName) => {
      if (value && value.toString().toLowerCase().includes(term)) {
        matchedFields.push(fieldName);
      }
    };

    checkAndAdd(item.title, 'Title');
    checkAndAdd(item.customerName, 'Customer');
    checkAndAdd(item.vin, 'VIN');
    checkAndAdd(item.vehicle, 'Vehicle');
    checkAndAdd(item.repairType, 'Repair Type');
    checkAndAdd(item.phone, 'Phone');
    checkAndAdd(item.notes, 'Notes');

    return matchedFields;
  }

  function selectSearchResult(result) {
    if (result.type === 'report') {
      setSelectedReport(result.data);
      setViewModalOpen(true);
    } else if (result.type === 'order') {
      // If this is a work order (has status), load details and open modal like View
      if (result.data && result.data.status) {
        const wo = result.data;
        (async () => {
          try {
            const res = await fetch(`/work-orders/${wo.id}`);
            const json = await res.json();
            if (json && json.success) {
              const ord = json.order || {};
              const items = Array.isArray(json.items) ? json.items : [];
              const transformed = {
                id: `WO_${wo.id}`,
                title: `Work Order #${wo.id} - ${wo.title}`,
                generatedAt: new Date().toLocaleString(),
                filters: { status: wo.status, vin: wo.vin, customer: wo.customerName },
                data: [
                  {
                    id: wo.id,
                    title: wo.title,
                    assignedTo: ord.accepted_by || wo.assignedTo || '',
                    customerName: ord.customer_name || wo.customerName || '',
                    vehicle: `${ord.vehicle_year || wo.modelYear || ''} ${ord.vehicle_make || ''} ${ord.vehicle_model || ''}`.trim(),
                    vin: ord.vehicle_vin || wo.vin || '',
                    phone: ord.customer_phone || wo.phone || '',
                    modelYear: ord.vehicle_year || wo.modelYear || '',
                    repairType: ord.activity_type || 'Inspection',
                    services: items.map((it) => ({ name: it.description, price: Number(it.unit_price || 0) })),
                    notes: ord.activity_description || '',
                    date: ord.updated_at || ord.created_at || '',
                    status: wo.status,
                  }
                ]
              };
              setSelectedReport(transformed);
              setViewModalOpen(true);
            } else {
              addWarningNotification('Failed to load work order details');
            }
          } catch (err) {
            console.error('Failed to load work order details', err);
            addErrorNotification('Error loading work order');
          }
        })();
      } else {
        // Sample order
        addInfoNotification(`Selected order: ${result.title}`);
      }
    }
    
    // Clear search
    setSearch('');
    setShowSearchResults(false);
    setSearchResults([]);
  }

  // --- Print styling: hide UI when printing except .printable-area ---
  // (We will add a small style tag)
  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', Roboto, sans-serif" }}>
      <style>{`
        :root {
          --primary: #29cc6a;
          --accent: #FF9500;
          --text-primary: #111111;
        }
        .card { background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(12,12,12,0.06); }
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      {/* Header - Updated to match SupplierDashboard */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-md flex items-center justify-center bg-[var(--primary)] text-white font-bold">CD</div>
          <div>
            <div className="text-lg font-semibold">Consultant Dashboard</div>
            <div className="text-xs text-gray-500">Generate reports, analyze data and export insights</div>
          </div>
        </div>

        <div className="flex-1 px-6">
          <div className="max-w-2xl mx-auto relative">
            <label className="relative block">
              <span className="sr-only">Search reports</span>
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                className="placeholder:italic placeholder:text-slate-400 block bg-gray-100 w-full border border-transparent rounded-md py-2 pl-10 pr-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="Search reports, vendors, dates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              />
            </label>
            
            {/* Search Results Dropdown */}
            {showSearchResults && search && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => selectSearchResult(result)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            result.type === 'report' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {result.type === 'report' ? 'Report' : 'Order'}
                          </span>
                          <h4 className="font-medium text-gray-900">{result.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                        {result.matchedFields && result.matchedFields.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {result.matchedFields.map((field, idx) => (
                              <span key={idx} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                {field}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Score: {result.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* No Results Message */}
            {showSearchResults && search && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 px-4 py-3">
                <p className="text-gray-500 text-sm">No results found for "{search}"</p>
              </div>
            )}
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
              {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left column: controls (narrower) */}
          <div className="col-span-3">
            <div className="card p-5">
              <h3 className="text-md font-semibold">Generate Report</h3>
              <p className="text-xs text-gray-500">Select filters and generate a report</p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-600">Report Type</label>
                  <div ref={reportTypeRef} className="relative inline-block w-full">
                    <button
                      type="button"
                      onClick={() => setIsReportTypeOpen(!isReportTypeOpen)}
                      className={`w-full bg-white border rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-[#29cc6a] focus:border-[#29cc6a] text-left text-gray-700 cursor-pointer text-sm mt-1 ${reportType !== 'Report Type' ? 'border-[#29cc6a]' : 'border-gray-200'}`}
                    >
                      {reportType}
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#29cc6a]">
                        <svg 
                          className={`h-4 w-4 transition-transform duration-200 ${isReportTypeOpen ? 'rotate-180' : ''}`} 
                          fill="none" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </button>
                    {isReportTypeOpen && (
                      <div className="text-sm absolute z-10 w-full top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg transform origin-top transition-all duration-150 max-h-48 overflow-y-auto custom-scrollbar">
                        {['Report Type', 'Progress Report', 'Sales Report', 'Accounting', 'Service Summary'].map((type) => (
                          <div
                            key={type}
                            onClick={() => {
                              setReportType(type);
                              setIsReportTypeOpen(false);
                            }}
                            className={`px-3 py-2 cursor-pointer hover:bg-[#4ddb86] hover:text-white transition-colors duration-150
                              ${reportType === type ? 'bg-[#29cc6a] text-white' : 'text-gray-700'}
                              ${type === 'Service Summary' ? 'rounded-b-md' : ''}
                              ${type === 'Progress Report' ? '' : ''}`}
                          >
                            {type}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600">Vendor</label>
                  <div ref={vendorRef} className="relative inline-block w-full">
                    <button
                      type="button"
                      onClick={() => setIsVendorOpen(!isVendorOpen)}
                      className={`w-full bg-white border rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-[#29cc6a] focus:border-[#29cc6a] text-left text-gray-700 cursor-pointer text-sm mt-1 ${vendor !== 'All Vendors' ? 'border-[#29cc6a]' : 'border-gray-200'}`}
                    >
                      {vendor}
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#29cc6a]">
                        <svg 
                          className={`h-4 w-4 transition-transform duration-200 ${isVendorOpen ? 'rotate-180' : ''}`} 
                          fill="none" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </button>
                    {isVendorOpen && (
                      <div className="absolute z-10 w-full top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg transform origin-top transition-all duration-150 max-h-48 overflow-y-auto custom-scrollbar">
                        {suppliersLoading && (
                          <div className="text-sm px-3 py-2 text-gray-500">Loading supplier emails...</div>
                        )}
                        {suppliersError && !suppliersLoading && (
                          <div className="text-sm px-3 py-2 text-red-600">{suppliersError}</div>
                        )}
                        {!suppliersLoading && !suppliersError && vendorOptions.map((vendorOption, idx) => (
                          <div
                            key={`${vendorOption}-${idx}`}
                            onClick={() => {
                              setVendor(vendorOption);
                              setIsVendorOpen(false);
                            }}
                            className={`text-sm px-3 py-2 cursor-pointer hover:bg-[#4ddb86] hover:text-white transition-colors duration-150
                              ${vendor === vendorOption ? 'bg-[#29cc6a] text-white' : 'text-gray-700'}
                              ${idx === 0 ? 'rounded-t-md' : ''}
                              ${idx === vendorOptions.length - 1 ? 'rounded-b-md' : ''}`}
                          >
                            {vendorOption}
                          </div>
                        ))}
                        {!suppliersLoading && !suppliersError && vendorOptions.length === 1 && (
                          <div className="text-sm px-3 py-2 text-gray-500">No supplier emails found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Date From</label>
                    <div className="relative">
                      <DatePicker
                        selected={dateFrom}
                        onChange={(date) => setDateFrom(date)}
                        placeholderText="Select start date"
                        dateFormat="yyyy-MM-dd"
                        className={`w-full mt-1 pl-3 pr-10 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#29cc6a] focus:border-[#29cc6a] text-sm text-gray-700 cursor-pointer custom-datepicker ${dateFrom ? 'border-[#29cc6a]' : 'border-gray-200'}`}
                        calendarClassName="custom-calendar"
                        popperClassName="custom-popper"
                        showPopperArrow={false}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 text-[#29cc6a] cursor-pointer hover:text-[#25b85d] transition-colors pointer-events-none">
                        <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Date To</label>
                    <div className="relative">
                      <DatePicker
                        selected={dateTo}
                        onChange={(date) => setDateTo(date)}
                        placeholderText="Select end date"
                        dateFormat="yyyy-MM-dd"
                        className={`w-full mt-1 pl-3 pr-10 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#29cc6a] focus:border-[#29cc6a] text-sm text-gray-700 cursor-pointer custom-datepicker ${dateTo ? 'border-[#29cc6a]' : 'border-gray-200'}`}
                        calendarClassName="custom-calendar"
                        popperClassName="custom-popper"
                        showPopperArrow={false}
                        minDate={dateFrom}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 text-[#29cc6a] cursor-pointer hover:text-[#25b85d] transition-colors pointer-events-none">
                        <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">Order Number</label>
                    <input type="text" placeholder="Order Number" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className={`w-full mt-1 p-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#29cc6a] ${orderNumber ? 'border-[#29cc6a]' : 'border-gray-200'}`} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">VIN</label>
                    <input type="text" placeholder="VIN" value={vinFilter} onChange={(e) => setVinFilter(e.target.value)} className={`w-full mt-1 p-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#29cc6a] ${vinFilter ? 'border-[#29cc6a]' : 'border-gray-200'}`} />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600">Report Title</label>
                  <input 
                    type="text" 
                    onChange={(e) => setReportTitle(e.target.value)} 
                    placeholder={reportType + ' Title'}
                    className="w-full mt-1 p-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#29cc6a]" 
                  />
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button onClick={generateReport} className="px-4 py-2 bg-[#29cc6a] text-white rounded-md cursor-pointer">Generate Report</button>
                  <button onClick={() => {
                    setReportType("Report Type"); setVendor("All Vendors"); setDateFrom(null); setDateTo(null); setOrderNumber(""); setVinFilter(""); setReportTitle("");
                  }} className="px-3 py-2 bg-gray-100 rounded-md text-sm cursor-pointer">Reset</button>
                </div>

              </div>
            </div>

            <div className="card p-4 mt-4">
              <h4 className="text-sm font-semibold">Quick Actions</h4>
              <div className="mt-3 flex flex-col gap-2">
                <button onClick={() => {
                  const last = history[0];
                  if (!last) return showMessage("No reports in history");
                  setSelectedReport(last);
                  setViewModalOpen(true);
                }} className="text-sm px-3 py-2 rounded-md bg-[#29cc6a] text-white">Open Latest Report</button>
                <button className="text-sm px-3 py-2 rounded-md bg-gray-100" onClick={() => {
                  // export aggregated history as excel (all reports)
                  const merged = { id: `ALL_${Date.now()}`, title: "All_Reports", data: history.flatMap(h => h.data) };
                  setSelectedReport(merged);
                  exportReportAsExcel(merged);
                }}>Export All Reports (Excel)</button>
              </div>
            </div>

          </div>

          {/* Middle column: WordOrders (wider) */}
          <div className="col-span-6">
            {/* Work Orders section - large screens: no horizontal scroll; mobile: allow horizontal scroll */}
            <div className="card p-4 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold">WordOrders</h3>
                <div className="text-xs text-gray-500">Live work orders</div>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={workOrdersQuery}
                    onChange={(e) => setWorkOrdersQuery(e.target.value)}
                    placeholder="Search work orders..."
                    className="w-full p-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#29cc6a]"
                  />
                </div>
                {workOrdersLoading && (
                  <div className="text-sm text-gray-500">Loading work orders...</div>
                )}
                {workOrdersError && (
                  <div className="text-sm text-red-600">{workOrdersError}</div>
                )}
                {!workOrdersLoading && !workOrdersError && (
                  <div className="border border-gray-100 rounded-md overflow-hidden">
                    {/* Mobile-only horizontal scroll; avoid horizontal scroll on md+ by removing min-width */}
                    <div className="max-h-[320px] overflow-y-auto overflow-x-auto md:overflow-x-hidden">
                      <table className="w-full text-sm min-w-[900px] md:min-w-0">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="text-left p-2">ID</th>
                            <th className="text-left p-2">Title</th>
                            <th className="text-left p-2">Customer</th>
                            <th className="text-left p-2">Vehicle</th>
                            <th className="text-left p-2">VIN</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Updated</th>
                            <th className="text-right p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredWorkOrders.map((wo) => (
                            <tr key={wo.id} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="p-2">{wo.id}</td>
                              <td className="p-2">{wo.title}</td>
                              <td className="p-2">{wo.customerName}</td>
                              <td className="p-2">{wo.vehicle}</td>
                              <td className="p-2">{wo.vin}</td>
                              <td className="p-2">
                                {(() => {
                                  const s = (wo.status || '').toLowerCase();
                                  const map = {
                                    completed: 'bg-green-100 text-green-800',
                                    'in progress': 'bg-yellow-100 text-yellow-800',
                                    'in-progress': 'bg-yellow-100 text-yellow-800',
                                    'in_progress': 'bg-yellow-100 text-yellow-800',
                                    pending: 'bg-red-100 text-red-800',
                                    cancelled: 'bg-gray-200 text-gray-700',
                                    canceled: 'bg-gray-200 text-gray-700',
                                    requested: 'bg-blue-100 text-blue-800',
                                  };
                                  const cls = map[s] || 'bg-gray-100 text-gray-700';
                                  const label = wo.status || 'Pending';
                                  return <span className={`px-2 py-1 rounded-full text-xs ${cls}`}>{label}</span>;
                                })()}
                              </td>
                              <td className="p-2 text-xs text-gray-500">{wo.date ? new Date(wo.date).toLocaleString() : '-'}</td>
                              <td className="p-2 text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    className="px-2 py-1 bg-white border border-gray-100 rounded-md"
                                    onClick={async () => {
                                      // Fetch details and open like Reports History View
                                      try {
                                        const res = await fetch(`/work-orders/${wo.id}`);
                                        const json = await res.json();
                                        if (json && json.success) {
                                          const ord = json.order || {};
                                          const items = Array.isArray(json.items) ? json.items : [];
                                          // Transform to selectedReport-compatible structure
                                          const transformed = {
                                            id: `WO_${wo.id}`,
                                            title: `Work Order #${wo.id} - ${wo.title}`,
                                            generatedAt: new Date().toLocaleString(),
                                            filters: { status: wo.status, vin: wo.vin, customer: wo.customerName },
                                            data: [
                                              {
                                                id: wo.id,
                                                title: wo.title,
                                                assignedTo: ord.accepted_by || wo.assignedTo || '',
                                                customerName: ord.customer_name || wo.customerName || '',
                                                vehicle: `${ord.vehicle_year || wo.modelYear || ''} ${ord.vehicle_make || ''} ${ord.vehicle_model || ''}`.trim(),
                                                vin: ord.vehicle_vin || wo.vin || '',
                                                phone: ord.customer_phone || wo.phone || '',
                                                modelYear: ord.vehicle_year || wo.modelYear || '',
                                                repairType: ord.activity_type || 'Inspection',
                                                services: items.map((it) => ({ name: it.description, price: Number(it.unit_price || 0) })),
                                                notes: ord.activity_description || '',
                                                date: ord.updated_at || ord.created_at || '',
                                                status: wo.status,
                                              }
                                            ]
                                          };
                                          setSelectedReport(transformed);
                                          setViewModalOpen(true);
                                        } else {
                                          addWarningNotification('Failed to load work order details');
                                        }
                                      } catch (err) {
                                        console.error('Failed to load work order details', err);
                                        addErrorNotification('Error loading work order');
                                      }
                                    }}
                                  >View</button>
                                  <button
                                    className="px-2 py-1 bg-white border rounded-md"
                                    onClick={() => {
                                      const tempReport = {
                                        id: `WO_${wo.id}`,
                                        title: `Work Order #${wo.id} - ${wo.title}`,
                                        generatedAt: new Date().toLocaleString(),
                                        filters: { status: wo.status, vin: wo.vin, customer: wo.customerName },
                                        data: [wo],
                                      };
                                      setSelectedReport(tempReport);
                                      setTimeout(() => exportReportAsPDF(tempReport), 300);
                                    }}
                                  >PDF</button>
                                  <button
                                    className="px-2 py-1 bg-white border-2 border-[#29cc6a] rounded-md text-[#29cc6a]"
                                    onClick={() => {
                                      const tempReport = {
                                        id: `WO_${wo.id}`,
                                        title: `Work Order #${wo.id} - ${wo.title}`,
                                        generatedAt: new Date().toLocaleString(),
                                        filters: { status: wo.status, vin: wo.vin, customer: wo.customerName },
                                        data: [wo],
                                      };
                                      exportReportAsExcel(tempReport);
                                    }}
                                  >Excel</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredWorkOrders.length === 0 && (
                            <tr>
                              <td colSpan="8" className="p-3 text-center text-sm text-gray-500">No matching work orders</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {/* If more than 8, show scroll - the container above has max-h-96 with overflow */}
                  </div>
                )}
              </div>
            </div>
            {/* Reports History section commented out per request. */}
            {/**
             * Reports History section is temporarily disabled.
             * Reason: User requested to comment out the table.
             * To restore, remove this comment block.
             */}
            {/**
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold">Reports History</h3>
                <div className="text-xs text-gray-500">Saved / generated reports</div>
              </div>

              
              <div className="mt-3 space-y-3 overflow-x-auto md:overflow-x-hidden">
                {history.length === 0 && <div className="text-sm text-gray-500">No reports yet</div>}
                {history.map((r) => (
                  <div 
                    key={r.id} 
                    className="p-3 border border-gray-100 rounded-md flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => loadReportToSelected(r)}
                  >
                    <div>
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-gray-500">Generated: {r.generatedAt} • ID: {r.id}</div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openHistoryReport(r)} className="text-sm px-3 py-1 bg-white border border-gray-100 rounded-md">View</button>
                      <button onClick={() => {
                        setSelectedReport(r);
                        setTimeout(() => exportReportAsPDF(r), 100);
                      }} className="text-sm px-3 py-1 bg-white border rounded-md">PDF</button>
                      <button onClick={() => exportReportAsExcel(r)} className="text-sm px-3 py-1 bg-white border-2 border-[#29cc6a] rounded-md text-[#29cc6a]">Excel</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            */}

            {/* <div className="card p-4 mt-4">
              <h4 className="text-sm font-semibold">Saved Filters</h4>
              <div className="mt-2 text-xs text-gray-500">(You can save frequently used filters in future iterations.)</div>
            </div> */}
          </div>

          {/* Right column: preview/selected details */}
          <div className="col-span-3">
            <div className="card p-4">
              <h3 className="text-md font-semibold">Selected Report</h3>
              {selectedReport ? (
                <>
                  {/* Report Header with Status Badge */}
                  <div className="mt-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{selectedReport.title}</div>
                      <div className="text-xs text-gray-500 mt-1">Report ID: {selectedReport.id}</div>
                    </div>
                    <div className="ml-3">
                      {(() => {
                        // Calculate overall report status based on order statuses
                        if (!selectedReport.data || selectedReport.data.length === 0) {
                          return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              No Data
                            </span>
                          );
                        }

                        const statusCounts = {
                          completed: 0,
                          inProgress: 0,
                          pending: 0
                        };

                        selectedReport.data.forEach(item => {
                          const orderStatus = item.status || 
                            (item.notes && item.notes.toLowerCase().includes('complete') ? 'Completed' : 
                             item.notes && item.notes.toLowerCase().includes('progress') ? 'In Progress' : 'Pending');
                          
                          if (orderStatus === 'Completed') statusCounts.completed++;
                          else if (orderStatus === 'In Progress') statusCounts.inProgress++;
                          else statusCounts.pending++;
                        });

                        const totalOrders = selectedReport.data.length;
                        const completionRate = (statusCounts.completed / totalOrders) * 100;

                        // Determine overall status based on completion rate
                        if (completionRate === 100) {
                          return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          );
                        } else if (statusCounts.inProgress > 0 || completionRate > 0) {
                          return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              In Progress ({Math.round(completionRate)}%)
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Pending
                            </span>
                          );
                        }
                      })()}
                    </div>
                  </div>

                  {/* Report Metadata */}
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 p-2 rounded-md">
                      <div className="text-gray-500">Generated</div>
                      <div className="font-medium text-gray-700">{selectedReport.generatedAt}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-md">
                      <div className="text-gray-500">Records</div>
                      <div className="font-medium text-gray-700">{selectedReport.data?.length || 0} orders</div>
                    </div>
                  </div>

                  {/* Data Summary */}
                  {selectedReport.data && selectedReport.data.length > 0 && (
                    <div className="mt-3 bg-green-50 p-3 rounded-md">
                      <div className="text-xs text-[#29cc6a] font-medium mb-2">Quick Stats</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-semibold text-green-600">
                            {selectedReport.data.filter(item => {
                              // Use the same dynamic status logic as in the table
                              const orderStatus = item.status || 
                                (item.notes && item.notes.toLowerCase().includes('complete') ? 'Completed' : 
                                 item.notes && item.notes.toLowerCase().includes('progress') ? 'In Progress' : 'Pending');
                              return orderStatus === 'Completed';
                            }).length}
                          </div>
                          <div className="text-gray-600">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-yellow-600">
                            {selectedReport.data.filter(item => {
                              // Use the same dynamic status logic as in the table
                              const orderStatus = item.status || 
                                (item.notes && item.notes.toLowerCase().includes('complete') ? 'Completed' : 
                                 item.notes && item.notes.toLowerCase().includes('progress') ? 'In Progress' : 'Pending');
                              return orderStatus === 'In Progress';
                            }).length}
                          </div>
                          <div className="text-gray-600">In Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-red-600">
                            {selectedReport.data.filter(item => {
                              // Use the same dynamic status logic as in the table
                              const orderStatus = item.status || 
                                (item.notes && item.notes.toLowerCase().includes('complete') ? 'Completed' : 
                                 item.notes && item.notes.toLowerCase().includes('progress') ? 'In Progress' : 'Pending');
                              return orderStatus === 'Pending';
                            }).length}
                          </div>
                          <div className="text-gray-600">Pending</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Applied Filters */}
                  <div className="mt-4">
                    <div className="text-xs text-gray-500 mb-2">Applied Filters:</div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        {Object.entries(selectedReport.filters).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="font-medium text-gray-800">
                              {value instanceof Date ? value.toLocaleDateString() : (value || 'N/A')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Export Actions */}
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => exportReportAsPDF()} className="px-3 py-2 bg-white border-2 rounded-md text-sm">
                      {loadingExport ? "Processing..." : "Export PDF"}
                    </button>
                    <button onClick={() => exportReportAsExcel()} className="px-3 py-2 bg-white text-[#29cc6a] border-2 border-[#29cc6a] rounded-md text-sm">
                      {loadingExport ? "Processing..." : "Export Excel"}
                    </button>
                    <button onClick={() => { window.print(); }} className="px-3 py-2 bg-gray-100 rounded-md text-sm">Print</button>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500 mt-3">No report selected. Generate or open one from history.</div>
              )}
            </div>

            <div className="card p-4 mt-4">
              <h4 className="text-sm font-semibold">Tips</h4>
              <ul className="text-xs text-gray-500 mt-2 space-y-1">
                <li>- Use date range to limit records</li>
                <li>- Export to Excel for data analysis</li>
                <li>- Export to PDF for printable progress reports</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden printable content - always available when selectedReport exists */}
      {selectedReport && (
        <div ref={reportRef} className="printable-area fixed -left-[9999px] top-0 w-[800px] bg-white" style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: '14px',
          lineHeight: '1.5',
          color: '#1f2937'
        }}>
          {/* Professional Header with Branding */}
          <div style={{
            background: 'linear-gradient(135deg, #29cc6a 0%, #22c55e 100%)',
            padding: '32px 40px',
            color: 'white',
            borderRadius: '0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Company Logo/Icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  CD
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                    Workshop Management System
                  </div>
                  <div style={{ fontSize: '14px', opacity: '0.9' }}>
                    Consultant Dashboard Report
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', opacity: '0.8', marginBottom: '4px' }}>
                  Generated on
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Report Title Section */}
          <div style={{ padding: '32px 40px 24px' }}>
            <div style={{
              borderLeft: '4px solid #29cc6a',
              paddingLeft: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#6b7280', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                Report Title
              </div>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: '700',
                color: '#111827',
                lineHeight: '1.2'
              }}>
                {selectedReport.title}
              </div>
            </div>

            {/* Report Metadata */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              padding: '20px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Report ID
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  #{selectedReport.id}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Generated At
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {selectedReport.generatedAt}
                </div>
              </div>
            </div>
          </div>

          {/* Applied Filters Section */}
          <div style={{ padding: '0 40px 24px' }}>
            <div style={{
              borderLeft: '4px solid #f59e0b',
              paddingLeft: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#111827'
              }}>
                Applied Filters
              </div>
            </div>
            <div style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fed7aa',
              borderRadius: '12px',
              padding: '20px'
            }}>
              {Object.entries(selectedReport.filters || {}).length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {Object.entries(selectedReport.filters || {}).map(([k,v]) => (
                    <div key={k} style={{
                      padding: '8px 12px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {k.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginTop: '2px' }}>
                        {String(v) || 'All'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                  No filters applied - showing all data
                </div>
              )}
            </div>
          </div>

          {/* Report Data Section */}
          <div style={{ padding: '0 40px 40px' }}>
            <div style={{
              borderLeft: '4px solid #3b82f6',
              paddingLeft: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#111827'
              }}>
                Report Data
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                {(selectedReport.data || []).length} records found
              </div>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '13px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Order #</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>VIN</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Customer</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Vehicle</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Status</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Date</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Creator</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Technician</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedReport.data || []).map((order, idx) => {
                    // Calculate total from services array
                    const calculatedTotal = order.services ? 
                      order.services.reduce((sum, service) => sum + (service.price || 0), 0) : 0;
                    
                    // Determine status based on available data or default
                    const orderStatus = order.status || 
                      (order.notes && order.notes.toLowerCase().includes('complete') ? 'Completed' : 
                       order.notes && order.notes.toLowerCase().includes('progress') ? 'In Progress' : 'Pending');
                    
                    return (
                      <tr key={idx} style={{ 
                        backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <td style={{ 
                          padding: '12px', 
                          fontWeight: '600',
                          color: '#111827'
                        }}>{order.id || order.orderNumber || 'N/A'}</td>
                        <td style={{ 
                          padding: '12px',
                          color: '#6b7280',
                          fontFamily: 'monospace',
                          fontSize: '12px'
                        }}>{order.vin || order.vehicle_vin || 'N/A'}</td>
                        <td style={{ 
                          padding: '12px',
                          color: '#374151'
                        }}>{order.customerName || order.customer || 'N/A'}</td>
                        <td style={{ 
                          padding: '12px',
                          color: '#374151'
                        }}>{order.vehicle || 'N/A'}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            backgroundColor: orderStatus === 'Completed' ? '#dcfce7' : 
                                           orderStatus === 'In Progress' ? '#fef3c7' : '#fee2e2',
                            color: orderStatus === 'Completed' ? '#166534' : 
                                   orderStatus === 'In Progress' ? '#92400e' : '#991b1b'
                          }}>
                            {orderStatus}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '12px',
                          color: '#6b7280'
                        }}>{order.date ? (order.date instanceof Date ? order.date.toLocaleDateString() : order.date) : (order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A')}</td>
                        <td style={{ 
                          padding: '12px',
                          color: '#374151'
                        }}>{order.created_by || 'N/A'}</td>
                        <td style={{ 
                          padding: '12px',
                          color: '#374151'
                        }}>{order.accepted_by || 'N/A'}</td>
                        <td style={{ 
                          padding: '12px',
                          textAlign: 'right',
                          fontWeight: '600',
                          color: '#111827'
                        }}>${order.total || order.quote_total || calculatedTotal || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Professional Footer */}
          <div style={{
            borderTop: '2px solid #e5e7eb',
            padding: '24px 40px',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Generated by Workshop Management System
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                This report contains confidential business information
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Page 1 of 1
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                Report ID: {selectedReport.id}
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

      {/* Enhanced View Modal */}
      {viewModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-xl card">
            {/* Modal Header */}
            <div className="bg-[var(--primary)] text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedReport.title}</h2>
                  <div className="text-green-100 text-sm mt-1">ID: {selectedReport.id} • {selectedReport.generatedAt}{selectedReport.createdBy?.email ? ` • Created by: ${selectedReport.createdBy.email}` : ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => exportReportAsPDF()} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors duration-200 flex items-center gap-1.5 text-sm">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                  </button>
                  <button onClick={() => exportReportAsExcel()} className="px-3 py-1.5 bg-[var(--accent)] hover:bg-orange-600 text-white rounded-md transition-colors duration-200 flex items-center gap-1.5 text-sm">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a4 4 0 01-4-4V5a4 4 0 014-4h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a4 4 0 01-4 4z" />
                    </svg>
                    Excel
                  </button>
                  <button onClick={() => setShowFullDetails(v => !v)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors duration-200 flex items-center gap-1.5 text-sm">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Details
                  </button>
                  <button onClick={() => setViewModalOpen(false)} className="p-1.5 hover:bg-white/20 text-white rounded-md transition-colors duration-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-auto max-h-[calc(85vh-80px)]">
              {(() => {
                // Calculate summary metrics
                const totalOrders = selectedReport.data?.length || 0;
                const totalRevenue = selectedReport.data?.reduce((sum, order) => {
                  const orderTotal = typeof order.quote_total !== 'undefined' ? Number(order.quote_total || 0) : (order.services || []).reduce((s, service) => s + (service.price || 0), 0);
                  return sum + orderTotal;
                }, 0) || 0;
                
                const statusCounts = { completed: 0, inProgress: 0, pending: 0 };
                selectedReport.data?.forEach(item => {
                  const orderStatus = item.status || 
                    (item.notes && item.notes.toLowerCase().includes('complete') ? 'Completed' : 
                     item.notes && item.notes.toLowerCase().includes('progress') ? 'In Progress' : 'Pending');
                  
                  if (orderStatus === 'Completed') statusCounts.completed++;
                  else if (orderStatus === 'In Progress') statusCounts.inProgress++;
                  else statusCounts.pending++;
                });

                const completionRate = totalOrders > 0 ? (statusCounts.completed / totalOrders) * 100 : 0;
                const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

                return (
                  <>
                    {/* Summary Cards */}
                    <div className="p-4 bg-gray-50">
                      <h3 className="text-md font-semibold text-gray-800 mb-3">Report Overview</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Total Orders Card */}
                        <div className="card p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-gray-600">Total Orders</p>
                              <p className="text-xl font-bold text-gray-900">{totalOrders}</p>
                            </div>
                            <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
                              <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Completion Rate Card */}
                        <div className="card p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-gray-600">Completion Rate</p>
                              <p className="text-xl font-bold text-[var(--primary)]">{completionRate.toFixed(1)}%</p>
                            </div>
                            <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
                              <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div className="bg-[var(--primary)] h-1.5 rounded-full transition-all duration-300" style={{width: `${completionRate}%`}}></div>
                            </div>
                          </div>
                        </div>

                        {/* Total Revenue Card */}
                        <div className="card p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-gray-600">Total Revenue</p>
                              <p className="text-xl font-bold text-[var(--accent)]">${totalRevenue.toFixed(2)}</p>
                            </div>
                            <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                              <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Average Order Value Card */}
                        <div className="card p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-gray-600">Avg Order Value</p>
                              <p className="text-xl font-bold text-gray-700">${avgOrderValue.toFixed(2)}</p>
                            </div>
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Distribution */}
                      <div className="mt-4 card p-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Status Distribution</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-[var(--primary)]">{statusCounts.completed}</div>
                            <div className="text-xs text-gray-600">Completed</div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div className="bg-[var(--primary)] h-1.5 rounded-full" style={{width: `${totalOrders > 0 ? (statusCounts.completed / totalOrders) * 100 : 0}%`}}></div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-[var(--accent)]">{statusCounts.inProgress}</div>
                            <div className="text-xs text-gray-600">In Progress</div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div className="bg-[var(--accent)] h-1.5 rounded-full" style={{width: `${totalOrders > 0 ? (statusCounts.inProgress / totalOrders) * 100 : 0}%`}}></div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-500">{statusCounts.pending}</div>
                            <div className="text-xs text-gray-600">Pending</div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div className="bg-red-500 h-1.5 rounded-full" style={{width: `${totalOrders > 0 ? (statusCounts.pending / totalOrders) * 100 : 0}%`}}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Applied Filters Section */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Applied Filters</h4>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(selectedReport.filters || {}).map(([key, value]) => (
                          <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>: {String(value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              {showFullDetails && (
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Full Work Order Details</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Order #</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Created By</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Technician</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Supplier Email</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Customer Name</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Customer Phone</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Vehicle Make</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Vehicle Model</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Year</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>VIN</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Status</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Quote Total</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Updated At</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Created At</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Supply Item</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Item Description</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Temp Supply Item</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Temp Desc</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Paint Codes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedReport.data || []).map((order, idx) => (
                          <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '10px' }}>{order.id}</td>
                            <td style={{ padding: '10px' }}>{order.created_by || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>{order.accepted_by || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>{order.supplier_email || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>{order.customer_name || order.customerName || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>{order.customer_phone || order.phone || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>{order.vehicle_make || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>{order.vehicle_model || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>{order.vehicle_year || 'N/A'}</td>
                            <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '11px' }}>{order.vehicle_vin || order.vin || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>{order.status || 'N/A'}</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>${(order.quote_total || order.total || 0)}</td>
                            <td style={{ padding: '10px' }}>{order.updated_at ? new Date(order.updated_at).toLocaleString() : (order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A')}</td>
                            <td style={{ padding: '10px' }}>{order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}</td>
                            <td style={{ padding: '10px' }}>{order.supply_item || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>{order.item_description || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>{order.temp_supply_item || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>{order.temp_desc || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>
                              {order.paint_codes_json ? (
                                (() => {
                                  try {
                                    const paintCodes = typeof order.paint_codes_json === 'string' 
                                      ? JSON.parse(order.paint_codes_json) 
                                      : order.paint_codes_json;
                                    return Array.isArray(paintCodes) && paintCodes.length > 0 ? (
                                      <div style={{ fontSize: '11px' }}>
                                        {paintCodes.map((paint, paintIdx) => (
                                          <div key={paintIdx} style={{ marginBottom: '2px' }}>
                                            <strong>{paint.code}</strong> (Qty: {paint.quantity})
                                            {paint.triStage && <span style={{ color: '#f59e0b', marginLeft: '4px' }}>• Tri Stage</span>}
                                          </div>
                                        ))}
                                      </div>
                                    ) : 'N/A';
                                  } catch (e) {
                                    return 'Invalid Data';
                                  }
                                })()
                              ) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Order Cards Section */}
              <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Order Details ({selectedReport.data?.length || 0} orders)</h4>
                
                {/* Order Cards Grid */}
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {selectedReport.data?.map((order, idx) => {
                    const total = typeof order.quote_total !== 'undefined' ? Number(order.quote_total || 0) : (order.services || []).reduce((s, it) => s + (it.price || 0), 0);
                    
                    // Intelligent status detection
                    const getOrderStatus = (order) => {
                      if (order.status) {
                        return order.status.toLowerCase();
                      }
                      const notes = (order.notes || '').toLowerCase();
                      if (notes.includes('complete')) return 'completed';
                      if (notes.includes('progress')) return 'in_progress';
                      return 'pending';
                    };
                    
                    const status = getOrderStatus(order);
                    const statusConfig = {
                      completed: { bg: 'bg-[var(--primary)]/10', text: 'text-[var(--primary)]', label: 'Completed', icon: '✓' },
                      in_progress: { bg: 'bg-[var(--accent)]/10', text: 'text-[var(--accent)]', label: 'In Progress', icon: '⏳' },
                      pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Pending', icon: '⏸' }
                    };
                    const config = statusConfig[status] || statusConfig.pending;
                    
                    return (
                      <div key={idx} className="card p-3 hover:shadow-md transition-shadow">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold text-xs">
                              {order.customerName?.charAt(0) || 'C'}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{order.id} • {order.title}</div>
                              <div className="text-xs text-gray-500">{order.customerName}</div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                            {config.icon} {config.label}
                          </span>
                        </div>
                        
                        {/* Vehicle Info */}
                        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                          <div>
                            <span className="text-gray-500">Vehicle:</span>
                            <div className="font-medium">{order.vehicle || 'N/A'}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">VIN:</span>
                            <div className="font-medium font-mono text-xs">{order.vin || 'N/A'}</div>
                          </div>
                        </div>
                        
                        {/* Services */}
                        {order.services && order.services.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs text-gray-500 mb-1">Services:</div>
                            <div className="flex flex-wrap gap-1">
                              {order.services.slice(0, 3).map((service, sIdx) => (
                                <span key={sIdx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                  {service.name} ${service.price}
                                </span>
                              ))}
                              {order.services.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                  +{order.services.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="text-sm text-gray-500">
                            {order.repairType || 'General'} • {order.date ? (order.date instanceof Date ? order.date.toLocaleDateString() : order.date) : 'No date'}
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            ${total.toFixed(2)}
                          </div>
                        </div>
                        
                        {/* Notes Preview */}
                        {order.notes && (
                          <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            <span className="font-medium">Notes:</span> {order.notes.length > 50 ? order.notes.substring(0, 50) + '...' : order.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Empty State */}
                {(!selectedReport.data || selectedReport.data.length === 0) && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Orders Found</h3>
                    <p className="text-gray-500">This report doesn't contain any order data.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* transient message */}
      {message && (
        <div className="fixed right-6 bottom-6 bg-black text-white px-4 py-2 rounded-md shadow-md z-50">
          {message}
        </div>
      )}
    </div>
  );
}