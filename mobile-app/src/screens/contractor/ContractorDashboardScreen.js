import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { COLORS, spacing, borderRadius, commonStyles, fontSize, fontWeight, shadow } from '../../utils/styles';
import { clearUserData, getUserEmail } from '../../utils/storage';
import { useNavigation } from '@react-navigation/native';
import { apiGet, apiPost, apiPut, authAPI } from '../../utils/api';

export default function ContractorDashboardScreen() {
  const navigation = useNavigation();

  // ---------- User ----------
  const [user, setUser] = useState({ name: 'Loading...', email: '' });
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const email = (await getUserEmail()) || '';
        if (!email) {
          setUser({ name: 'Guest User', email: '' });
          return;
        }
        const { ok, data } = await authAPI.getUser(email);
        if (ok && data?.success && data.user) {
          setUser({ name: data.user.name, email: data.user.email });
        } else {
          setUser({ name: 'Guest User', email });
        }
      } catch (e) {
        setUser({ name: 'Guest User', email: '' });
      } finally {
        setUserLoading(false);
      }
    }
    loadUser();
  }, []);

  // ---------- Work orders ----------
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    async function fetchWorkOrders() {
      try {
        setOrdersLoading(true);
        setOrdersError('');
        const { ok, data } = await apiGet('/work-orders');
        if (!ok || !data?.success) throw new Error(data?.error || 'Failed to load work orders');
        const mapped = (data.orders || []).map((o) => ({
          id: o.id,
          title: o.title || `${o.vehicle_year ? o.vehicle_year + ' ' : ''}${o.vehicle_make || ''} ${o.vehicle_model || ''}`.trim(),
          contractor: o.created_by || '—',
          status: normalizeStatusLabel(o.status || o.status_raw || 'pending'),
          totalCost: Number(o.quote_total || o.charges || 0),
          description: o.description || o.item_description || '',
          createdAt: (() => {
            try {
              const d = o.created_at || o.createdAt;
              return d ? new Date(d).toISOString().split('T')[0] : '';
            } catch {
              return '';
            }
          })(),
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

  // ---------- UI composition (web parity) ----------
  // Tabs: home | create | notifications | orders
  const [activeTab, setActiveTab] = useState('home');

  // ---------- Create Work Order Wizard (web parity) ----------
  const steps = ['Customer', 'Work Type', 'Spare Parts', 'Activity', 'Quote'];
  const [step, setStep] = useState(1);

  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [vehicle, setVehicle] = useState({ make: '', model: '', vin: '', year: '', odometer: '', trim: '' });

  const initialWorkTypes = [
    { id: 'engine', title: 'Engine', img: 'https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=600&q=60', selected: false },
    { id: 'brakes', title: 'Brakes', img: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=600&q=60', selected: false },
    { id: 'electrical', title: 'Electrical', img: 'https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=600&q=60', selected: false },
    { id: 'suspension', title: 'Suspension', img: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=600&q=60', selected: false },
    { id: 'hvac', title: 'HVAC', img: 'https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=600&q=60', selected: false },
    { id: 'others', title: 'Other', img: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=600&q=60', selected: false },
  ];
  const [workTypes, setWorkTypes] = useState(initialWorkTypes);
  const [otherWorkTypeText, setOtherWorkTypeText] = useState('');
  const [workTypeCatalog, setWorkTypeCatalog] = useState([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { ok, data } = await apiGet('/work-type-prices');
        if (ok && data?.success && Array.isArray(data.items)) {
          const mapped = data.items.map((it) => ({ id: it.id, title: it.name, name: it.name, price: Number(it.price || 0) }));
          if (mounted) setWorkTypeCatalog(mapped);
        }
      } catch (e) {
        // silently ignore, fallback will be used
      }
    })();
    return () => { mounted = false; };
  }, []);

  const spareCatalog = [
    { id: 'sp1', title: 'Oil Filter', price: 12.5 },
    { id: 'sp2', title: 'Brake Pads', price: 45.0 },
    { id: 'sp3', title: 'Air Filter', price: 18.0 },
    { id: 'sp4', title: 'Spark Plug (set)', price: 34.0 },
  ];
  const [partsCart, setPartsCart] = useState([]); // {id,title,price,qty}

  const [activity, setActivity] = useState({ type: 'Inspection', description: '', selectedRepairTypes: [] });
  const [paintCodes, setPaintCodes] = useState([]); // [{id, code, quantity, triStage}]
  const [vehiclePhotos, setVehiclePhotos] = useState([]); // [{url, name}]

  function toggleWorkTypeSelection(id) {
    setWorkTypes((prev) => prev.map((w) => (w.id === id ? { ...w, selected: !w.selected } : w)));
  }
  function addPartToCart(part) {
    setPartsCart((prev) => {
      const found = prev.find((p) => p.id === part.id);
      if (found) return prev.map((p) => (p.id === part.id ? { ...p, qty: p.qty + 1 } : p));
      return [...prev, { ...part, qty: 1 }];
    });
  }
  function changeCartQty(id, delta) {
    setPartsCart((prev) => prev.map((p) => (p.id === id ? { ...p, qty: Math.max(0, (p.qty || 0) + delta) } : p)).filter((p) => (p.qty || 0) > 0));
  }

  const getWorkTypePrice = (w) => {
    const titleToMatch = w.id === 'others' ? (otherWorkTypeText || '').trim() : (w.title || '').trim();
    const lc = (titleToMatch || '').toLowerCase();
    const byId = workTypeCatalog.find((it) => String(it.id) === String(w.id));
    if (byId) return Number(byId.price || 0);
    const byTitle = workTypeCatalog.find((it) => String(it.title || '').toLowerCase() === lc);
    if (byTitle) return Number(byTitle.price || 0);
    return 60; // fallback labour price when catalog unavailable
  };

  const quoteItems = useMemo(() => {
    const parts = partsCart.map((p) => ({ id: p.id, title: p.title, qty: p.qty, unit: p.price, total: (p.qty || 0) * (p.price || 0) }));
    const labour = workTypes.filter((w) => w.selected).map((w) => ({ id: `labour-${w.id}`, title: `${w.title} (labour)`, qty: 1, unit: getWorkTypePrice(w), total: getWorkTypePrice(w) }));
    const repairs = [];
    if (activity.selectedRepairTypes && Array.isArray(activity.selectedRepairTypes)) {
      activity.selectedRepairTypes.forEach((repairType) => {
        const price = typeof repairType.price !== 'undefined' ? Number(repairType.price) : 25;
        repairs.push({ id: `repair-${repairType.id}`, title: repairType.name, qty: 1, unit: price, total: price });
      });
    }
    return [...parts, ...labour, ...repairs];
  }, [partsCart, workTypes, activity]);

  const subtotal = useMemo(() => quoteItems.reduce((s, it) => s + (it.total || 0), 0), [quoteItems]);
  const tax = +(subtotal * 0.12).toFixed(2);
  const grandTotal = +(subtotal + tax).toFixed(2);

  function resetWizard() {
    setCustomer({ name: '', phone: '' });
    setVehicle({ make: '', model: '', vin: '', year: '', odometer: '', trim: '' });
    setWorkTypes(initialWorkTypes.map((w) => ({ ...w, selected: false })));
    setOtherWorkTypeText('');
    setPartsCart([]);
    setActivity({ type: 'Inspection', description: '', selectedRepairTypes: [] });
    setPaintCodes([]);
    setVehiclePhotos([]);
    setStep(1);
  }

  function goNext() { setStep((s) => Math.min(steps.length, s + 1)); }
  function goPrev() { setStep((s) => Math.max(1, s - 1)); }

  async function handleSubmitWorkOrder() {
    try {
      // Basic validation
      const nameOk = (customer.name || '').trim().length > 0;
      const phoneOk = (customer.phone || '').trim().length > 0;
      const makeOk = (vehicle.make || '').trim().length > 0;
      const modelOk = (vehicle.model || '').trim().length > 0;
      if (!nameOk || !phoneOk || !makeOk || !modelOk) {
        Alert.alert('Missing Info', 'Please fill customer name, phone, vehicle make and model.');
        return;
      }

      const items = [
        // parts from cart
        ...partsCart.map((p) => ({ description: p.title, qty: p.qty, unit_price: p.price })),
        // labour derived from selected work types
        ...workTypes
          .filter((w) => w.selected)
          .map((w) => ({ description: `${w.title} (labour)`, qty: 1, unit_price: getWorkTypePrice(w) })),
        // repairs flat rate
        ...(activity.selectedRepairTypes || []).map((repairType) => ({ description: repairType.name, qty: 1, unit_price: typeof repairType.price !== 'undefined' ? Number(repairType.price) : 25 })),
      ];

      const selectedWorkTypes = workTypes
        .filter((w) => w.selected)
        .map((w) => ({ id: w.id, title: w.id === 'others' && (otherWorkTypeText || '').trim() ? (otherWorkTypeText || '').trim() : w.title }));

      const payload = {
        created_by: user?.email || '',
        status: 'requested',
        customer: { name: customer.name, phone: customer.phone },
        vehicle: { make: vehicle.make, model: vehicle.model, vin: vehicle.vin, year: vehicle.year, odometer: vehicle.odometer, trim: vehicle.trim },
        activity: { type: activity.type, description: activity.description, selectedRepairTypes: activity.selectedRepairTypes },
        paint_codes: paintCodes,
        quote: { subtotal, tax, total: grandTotal },
        items,
        work_types: selectedWorkTypes,
        photos: (vehiclePhotos || []).map((ph) => ({ url: ph.url, name: ph.name })),
      };

      const { ok, data } = await apiPost('/work-orders', payload);
      if (!ok || !data?.success) {
        Alert.alert('Submit Failed', data?.error || 'Failed to create work order');
        return;
      }

      Alert.alert('Success', 'Work Order Created Successfully');

      const newOrder = {
        id: data.id,
        title: `${(vehicle.year || '').toString().trim()} ${String(vehicle.make || '').trim()} ${String(vehicle.model || '').trim()}`.trim() || `Order ${data.id}`,
        contractor: user?.email || '—',
        status: normalizeStatusLabel('requested'),
        totalCost: Number(grandTotal || 0),
        description: activity.description || '',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setOrders((prev) => [newOrder, ...prev]);

      resetWizard();
      setActiveTab('home');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Error submitting work order');
    }
  }

  // Selection for preview
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

  // Notifications (basic parity with web)
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const { ok, data } = await apiGet('/contractor/notifications');
        if (ok && Array.isArray(data?.items)) {
          setNotifications(data.items);
        } else {
          setNotifications([]);
        }
      } catch {
        setNotifications([]);
      }
    })();
  }, []);

  // ---------- UI State ----------
  const STATUS_LIST = ['All', 'Pending', 'In Progress', 'Finished', 'Rejected'];
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('All');

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const tabOk = selectedTab === 'All' ? true : o.status === selectedTab;
      const searchOk =
        !q ||
        String(o.title || '').toLowerCase().includes(q) ||
        String(o.id || '').toLowerCase().includes(q) ||
        String(o.contractor || '').toLowerCase().includes(q);
      return tabOk && searchOk;
    });
  }, [orders, search, selectedTab]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'Pending').length;
    const inProgress = orders.filter((o) => o.status === 'In Progress').length;
    const finished = orders.filter((o) => o.status === 'Finished').length;
    return { total, pending, inProgress, finished };
  }, [orders]);

  // Work order status actions for preview
  async function updateOrderStatus(orderId, status) {
    try {
      const { ok, data } = await apiPut(`/work-orders/${orderId}/status`, { status });
      if (!ok || !data?.success) throw new Error(data?.error || 'Status update failed');
      // Update local list
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: normalizeStatusLabel(status) } : o)));
      setSelectedWorkOrder((prev) => (prev && prev.id === orderId ? { ...prev, status: normalizeStatusLabel(status) } : prev));
      Alert.alert('Success', `Order marked as ${status}`);
    } catch (e) {
      Alert.alert('Error', e.message || 'Status update failed');
    }
  }

  async function logout() {
    await clearUserData();
    if (typeof global !== 'undefined' && typeof global.updateAuthState === 'function') {
      await global.updateAuthState();
    }
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  }

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.container}>
      {/* Header (parity with web ContractorHeader) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>Contractor Dashboard</Text>
          <Text style={styles.subtitleText}>{userLoading ? 'Loading user…' : `Welcome, ${user.name}`}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero (from web Hero.jsx) */}
      <View style={styles.heroCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Create & Search Work Easily</Text>
          <Text style={styles.heroSubtitle}>Manage all your work orders, spare parts and activities from a single dashboard.</Text>
        </View>
        <View style={styles.heroImageWrap}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=600&q=60' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.cardSection}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitleSm}>Quick Actions</Text>
            <Text style={styles.sectionSub}>Shortcuts</Text>
          </View>
          <Text style={styles.sectionSub}>•••</Text>
        </View>
        <View style={{ gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => setActiveTab('create')}
            style={[styles.quickActionBtn, activeTab === 'create' && styles.quickActionActive]}
          >
            <Text style={[styles.quickActionText, activeTab === 'create' && styles.quickActionTextActive]}>New Work Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('orders')}
            style={[styles.quickActionBtn, activeTab === 'orders' && styles.quickActionActive]}
          >
            <Text style={[styles.quickActionText, activeTab === 'orders' && styles.quickActionTextActive]}>All Work Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('notifications')}
            style={[styles.quickActionBtn, activeTab === 'notifications' && styles.quickActionActive]}
          >
            <Text style={[styles.quickActionText, activeTab === 'notifications' && styles.quickActionTextActive]}>Notifications</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats (kept for utility) */}
      <View style={styles.statsRow}>
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="In Progress" value={stats.inProgress} />
        <StatCard label="Finished" value={stats.finished} />
      </View>

      {/* Home tab content */}
      {activeTab === 'home' && (
        <View style={{ gap: spacing.lg }}>
          {/* Ongoing Work (horizontal cards) */}
          <View style={{ gap: spacing.sm }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Ongoing Work</Text>
              <TouchableOpacity><Text style={styles.sectionSub}>See all</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                {orders.filter((o) => o.status === 'In Progress' || o.status === 'Pending').slice(0, 8).map((o) => (
                  <View key={o.id} style={styles.ongoingCard}>
                    <View style={styles.ongoingTopRow}>
                      <View style={styles.avatarWrap}>
                        <Image
                          source={{ uri: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=600&q=60' }}
                          style={styles.avatar}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ongoingId}>#{o.id}</Text>
                        <Text style={styles.ongoingTitle}>{o.title}</Text>
                      </View>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={styles.progressBarFill} />
                    </View>
                  </View>
                ))}
                <View style={styles.ongoingNewWrap}>
                  <TouchableOpacity onPress={() => setActiveTab('create')} style={styles.ongoingNewBtn}>
                    <Text style={{ color: COLORS.primary, fontWeight: fontWeight.semibold }}>＋</Text>
                    <Text style={styles.sectionSub}>New</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Search & Tabs */}
          <View style={styles.searchTabs}>
            <TextInput
              placeholder="Search orders..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
              {STATUS_LIST.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tabButton, selectedTab === t && styles.tabButtonActive]}
                  onPress={() => setSelectedTab(t)}
                >
                  <Text style={[styles.tabText, selectedTab === t && styles.tabTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* List Of Work Orders (click to preview) */}
          <View style={styles.listContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>List Of Work Orders</Text>
              <TouchableOpacity onPress={() => setActiveTab('orders')}><Text style={[styles.sectionSub, { color: COLORS.primary }]}>See all</Text></TouchableOpacity>
            </View>
            {ordersLoading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : ordersError ? (
              <Text style={styles.errorText}>{ordersError}</Text>
            ) : filteredOrders.length === 0 ? (
              <Text style={styles.emptyText}>No matching orders.</Text>
            ) : (
              filteredOrders.map((o) => (
                <TouchableOpacity key={o.id} style={styles.orderCard} onPress={() => setSelectedWorkOrder(o)}>
                  <View style={styles.orderHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderTitle}>{o.title || `Order ${o.id}`}</Text>
                      <Text style={styles.orderSub}>Contractor: {o.contractor}</Text>
                    </View>
                    <StatusPill status={o.status} />
                  </View>
                  <View style={styles.orderDetails}>
                    <Text style={styles.detailText}>Created: {o.createdAt || '—'}</Text>
                    {o.description ? <Text style={styles.detailText}>Desc: {o.description}</Text> : null}
                    <Text style={styles.detailText}>Total Cost: ${o.totalCost.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Work Order Preview */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitleSm}>Work Order Preview</Text>
                <Text style={styles.sectionSub}>Select a work order to view details</Text>
              </View>
            </View>
            {selectedWorkOrder ? (
              <View style={{ gap: spacing.sm }}>
                <View style={styles.previewImage} />
                <Text style={styles.previewId}>#{selectedWorkOrder.id}</Text>
                <Text style={styles.previewSub}>{selectedWorkOrder.title}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => updateOrderStatus(selectedWorkOrder.id, 'cancelled')}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => updateOrderStatus(selectedWorkOrder.id, 'completed')}>
                    <Text style={styles.primaryButtonText}>Mark as Completed</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.sectionSub}>No selection</Text>
            )}
          </View>

          {/* Recent Activity */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitleSm}>Recent Activity</Text>
            <Text style={styles.sectionSub}>No recent updates</Text>
          </View>
        </View>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <View style={{ gap: spacing.lg }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity onPress={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}>
                <Text style={styles.sectionSub}>Mark all as read</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setNotifications([])}>
                <Text style={styles.sectionSub}>Clear all</Text>
              </TouchableOpacity>
            </View>
          </View>
          {notifications.length === 0 ? (
            <View style={styles.cardSection}><Text style={styles.sectionSub}>You have no notifications.</Text></View>
          ) : (
            notifications.map((n) => (
              <View key={n.id} style={styles.notificationItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notificationText}>{n.text}</Text>
                  <Text style={styles.notificationTime}>{n.time}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {!n.read && (
                    <TouchableOpacity onPress={() => setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}>
                      <Text style={[styles.sectionSub, { color: COLORS.primary }]}>Read</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setNotifications((prev) => prev.filter((x) => x.id !== n.id))}>
                    <Text style={[styles.sectionSub, { color: '#ef4444' }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Orders tab: reuse list with search & filters */}
      {activeTab === 'orders' && (
        <View style={{ gap: spacing.lg }}>
          <Text style={styles.sectionTitle}>All Work Orders</Text>
          <View style={styles.searchTabs}>
            <TextInput
              placeholder="Search orders..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
              {STATUS_LIST.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tabButton, selectedTab === t && styles.tabButtonActive]}
                  onPress={() => setSelectedTab(t)}
                >
                  <Text style={[styles.tabText, selectedTab === t && styles.tabTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.listContainer}>
            {ordersLoading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : ordersError ? (
              <Text style={styles.errorText}>{ordersError}</Text>
            ) : filteredOrders.length === 0 ? (
              <Text style={styles.emptyText}>No matching orders.</Text>
            ) : (
              filteredOrders.map((o) => (
                <View key={o.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderTitle}>{o.title || `Order ${o.id}`}</Text>
                      <Text style={styles.orderSub}>Contractor: {o.contractor}</Text>
                    </View>
                    <StatusPill status={o.status} />
                  </View>
                  <View style={styles.orderDetails}>
                    <Text style={styles.detailText}>Created: {o.createdAt || '—'}</Text>
                    {o.description ? <Text style={styles.detailText}>Desc: {o.description}</Text> : null}
                    <Text style={styles.detailText}>Total Cost: ${o.totalCost.toFixed(2)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* Create tab placeholder */}
      {activeTab === 'create' && (
        <View style={styles.cardSection}>
          {/* Step header */}
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Text style={styles.sectionTitle}>Create Work Order</Text>
              <Text style={styles.sectionSub}>{`Step ${step} of ${steps.length}`}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity onPress={resetWizard}><Text style={styles.sectionSub}>Reset</Text></TouchableOpacity>
              <Text style={styles.sectionSub}>Preview</Text>
            </View>
          </View>

          {/* Step pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {steps.map((s, i) => {
                const idx = i + 1;
                const active = step === idx;
                return (
                  <View key={s} style={[styles.stepPill, active && styles.stepPillActive]}>
                    <Text style={[styles.stepPillText, active && styles.stepPillTextActive]}>{`${idx}. ${s}`}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Step content */}
          <View style={{ gap: spacing.md }}>
            {step === 1 && (
              <View style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitleSm}>Customer</Text>
                <TextInput style={styles.searchInput} placeholder="Customer name" value={customer.name} onChangeText={(t) => setCustomer((p) => ({ ...p, name: t }))} />
                <TextInput style={styles.searchInput} placeholder="Phone" value={customer.phone} onChangeText={(t) => setCustomer((p) => ({ ...p, phone: t }))} />
                <Text style={styles.sectionTitleSm}>Vehicle</Text>
                <TextInput style={styles.searchInput} placeholder="Make" value={vehicle.make} onChangeText={(t) => setVehicle((p) => ({ ...p, make: t }))} />
                <TextInput style={styles.searchInput} placeholder="Model" value={vehicle.model} onChangeText={(t) => setVehicle((p) => ({ ...p, model: t }))} />
                <TextInput style={styles.searchInput} placeholder="VIN" value={vehicle.vin} onChangeText={(t) => setVehicle((p) => ({ ...p, vin: t }))} />
                <TextInput style={styles.searchInput} placeholder="Year" value={vehicle.year} onChangeText={(t) => setVehicle((p) => ({ ...p, year: t }))} />
                <TextInput style={styles.searchInput} placeholder="Odometer" value={vehicle.odometer} onChangeText={(t) => setVehicle((p) => ({ ...p, odometer: t }))} />
                <TextInput style={styles.searchInput} placeholder="Trim" value={vehicle.trim} onChangeText={(t) => setVehicle((p) => ({ ...p, trim: t }))} />
              </View>
            )}

            {step === 2 && (
              <View style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitleSm}>Select Work Types</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {workTypes.map((w) => (
                    <TouchableOpacity key={w.id} style={[styles.workTypeChip, w.selected && styles.workTypeChipActive]} onPress={() => toggleWorkTypeSelection(w.id)}>
                      <Text style={[styles.workTypeChipText, w.selected && styles.workTypeChipTextActive]}>{w.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {workTypes.find((x) => x.id === 'others')?.selected && (
                  <TextInput style={styles.searchInput} placeholder="Please specify the work type" value={otherWorkTypeText} onChangeText={setOtherWorkTypeText} />
                )}
              </View>
            )}

            {step === 3 && (
              <View style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitleSm}>Add Spare Parts</Text>
                <View style={{ gap: spacing.sm }}>
                  {spareCatalog.map((p) => (
                    <View key={p.id} style={styles.spareRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: COLORS.text }}>{p.title}</Text>
                        <Text style={styles.sectionSub}>${p.price.toFixed(2)}</Text>
                      </View>
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => addPartToCart(p)}>
                        <Text style={styles.secondaryButtonText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <Text style={styles.sectionTitleSm}>Parts in Order</Text>
                <View style={{ gap: spacing.sm }}>
                  {partsCart.length === 0 && <Text style={styles.sectionSub}>No parts added yet</Text>}
                  {partsCart.map((c) => (
                    <View key={c.id} style={styles.spareRow}>
                      <Text style={{ color: COLORS.text }}>{c.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => changeCartQty(c.id, -1)}><Text style={styles.secondaryButtonText}>−</Text></TouchableOpacity>
                        <Text style={{ color: COLORS.text }}>{c.qty}</Text>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => changeCartQty(c.id, 1)}><Text style={styles.secondaryButtonText}>＋</Text></TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {step === 4 && (
              <View style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitleSm}>Activity Details</Text>
                <Text style={styles.sectionSub}>Activity Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
                  {['Inspection', 'Repair', 'Maintenance', 'Diagnostics'].map((t) => (
                    <TouchableOpacity key={t} style={[styles.workTypeChip, activity.type === t && styles.workTypeChipActive]} onPress={() => setActivity((p) => ({ ...p, type: t }))}>
                      <Text style={[styles.workTypeChipText, activity.type === t && styles.workTypeChipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput style={styles.searchInput} placeholder="Activity description" value={activity.description} onChangeText={(t) => setActivity((p) => ({ ...p, description: t }))} />
                <Text style={styles.sectionTitleSm}>Repair Types</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {['Oil Change', 'Brake Service', 'Battery Replacement', 'AC Check'].map((name, idx) => {
                    const id = `r-${idx}`;
                    const selected = (activity.selectedRepairTypes || []).some((x) => x.id === id);
                    return (
                      <TouchableOpacity key={id} style={[styles.workTypeChip, selected && styles.workTypeChipActive]} onPress={() => {
                        setActivity((prev) => {
                          const current = prev.selectedRepairTypes || [];
                          const exists = current.some((x) => x.id === id);
                          return {
                            ...prev,
                            selectedRepairTypes: exists ? current.filter((x) => x.id !== id) : [...current, { id, name }],
                          };
                        });
                      }}>
                        <Text style={[styles.workTypeChipText, selected && styles.workTypeChipTextActive]}>{name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.sectionTitleSm}>Paint Codes</Text>
                <View style={{ gap: spacing.sm }}>
                  {paintCodes.map((pc) => (
                    <View key={pc.id} style={styles.spareRow}>
                      <TextInput style={[styles.searchInput, { flex: 1 }]} placeholder="Code" value={pc.code} onChangeText={(t) => setPaintCodes((prev) => prev.map((x) => (x.id === pc.id ? { ...x, code: t } : x)))} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => setPaintCodes((prev) => prev.map((x) => (x.id === pc.id ? { ...x, quantity: Math.max(1, (x.quantity || 1) - 1) } : x)))}><Text style={styles.secondaryButtonText}>−</Text></TouchableOpacity>
                        <Text style={{ color: COLORS.text }}>{pc.quantity || 1}</Text>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => setPaintCodes((prev) => prev.map((x) => (x.id === pc.id ? { ...x, quantity: (x.quantity || 1) + 1 } : x)))}><Text style={styles.secondaryButtonText}>＋</Text></TouchableOpacity>
                      </View>
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => setPaintCodes((prev) => prev.filter((x) => x.id !== pc.id))}>
                        <Text style={styles.secondaryButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.primaryButton} onPress={() => setPaintCodes((prev) => [...prev, { id: Date.now(), code: '', quantity: 1, triStage: false }])}>
                    <Text style={styles.primaryButtonText}>Add Paint Code</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 5 && (
              <View style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitleSm}>Quote</Text>
                <View style={{ gap: spacing.sm }}>
                  {quoteItems.length === 0 ? (
                    <Text style={styles.sectionSub}>No items</Text>
                  ) : (
                    quoteItems.map((it) => (
                      <View key={it.id} style={styles.spareRow}>
                        <Text style={{ color: COLORS.text }}>{it.title}</Text>
                        <Text style={styles.sectionSub}>{`${it.qty} × $${Number(it.unit).toFixed(2)} = $${Number(it.total).toFixed(2)}`}</Text>
                      </View>
                    ))
                  )}
                </View>
                <View style={{ gap: spacing.xs }}>
                  <Text style={styles.detailText}>Subtotal: ${subtotal.toFixed(2)}</Text>
                  <Text style={styles.detailText}>Tax (12%): ${tax.toFixed(2)}</Text>
                  <Text style={[styles.detailText, { fontWeight: fontWeight.semibold }]}>Total: ${grandTotal.toFixed(2)}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Navigation & actions */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity style={styles.secondaryButton} onPress={goPrev}><Text style={styles.secondaryButtonText}>Back</Text></TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={goNext}><Text style={styles.primaryButtonText}>Next</Text></TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {step === steps.length && (
                <TouchableOpacity style={styles.primaryButton} onPress={handleSubmitWorkOrder}>
                  <Text style={styles.primaryButtonText}>Submit Work Order</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.secondaryButton} onPress={resetWizard}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    // Ensure ScrollView's content grows and can exceed viewport to enable scrolling
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    backgroundColor: COLORS.background,
    // Add some bottom padding so the last elements aren’t flush with the edge
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    gap: spacing.xs,
  },
  appTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    color: COLORS.text,
  },
  subtitleText: {
    color: COLORS.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.sm,
  },
  heroTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: COLORS.text,
  },
  heroSubtitle: {
    marginTop: spacing.xs,
    color: COLORS.textSecondary,
  },
  heroImageWrap: {
    width: 120,
    height: 80,
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.lg,
    ...shadow.sm,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
  },
  cardSection: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadow.md,
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleSm: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: COLORS.text,
  },
  sectionSub: {
    color: COLORS.textSecondary,
    fontSize: fontSize.sm,
  },
  quickActionBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  quickActionActive: {
    backgroundColor: COLORS.primaryLight,
  },
  quickActionText: {
    color: '#374151',
  },
  quickActionTextActive: {
    color: COLORS.primary,
    fontWeight: fontWeight.semibold,
  },
  logoutButton: {
    backgroundColor: COLORS.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  logoutText: {
    color: COLORS.white,
    fontWeight: fontWeight.medium,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.md,
  },
  statLabel: {
    color: COLORS.textSecondary,
  },
  statValue: {
    color: COLORS.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  searchTabs: {
    gap: spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: COLORS.white,
  },
  tabsScroll: {
    marginTop: spacing.xs,
  },
  tabButton: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.text,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: fontWeight.semibold,
  },
  listContainer: {
    gap: spacing.md,
  },
  ongoingCard: {
    width: 180,
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadow.md,
    gap: spacing.sm,
  },
  ongoingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  ongoingId: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: COLORS.text,
  },
  ongoingTitle: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '60%',
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  ongoingNewWrap: {
    width: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ongoingNewBtn: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
    gap: spacing.xs,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.md,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  orderTitle: {
    color: COLORS.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  orderSub: {
    color: COLORS.textSecondary,
  },
  orderDetails: {
    gap: spacing.xs,
  },
  detailText: {
    color: COLORS.text,
  },
  historySection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: COLORS.text,
  },
  previewImage: {
    height: 140,
    borderRadius: borderRadius.lg,
    backgroundColor: '#f3f4f6',
  },
  previewId: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: COLORS.text,
  },
  previewSub: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
  },
  historyItem: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.sm,
  },
  notificationItem: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.sm,
  },
  notificationText: {
    color: COLORS.text,
    fontWeight: fontWeight.medium,
  },
  notificationTime: {
    color: COLORS.textSecondary,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  historyTitle: {
    color: COLORS.text,
    fontWeight: fontWeight.semibold,
  },
  historySub: {
    color: COLORS.textSecondary,
  },
  historyDate: {
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: COLORS.text,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: fontWeight.medium,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.error,
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
  stepPill: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  stepPillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  stepPillText: {
    color: COLORS.text,
  },
  stepPillTextActive: {
    color: COLORS.primary,
    fontWeight: fontWeight.semibold,
  },
  workTypeChip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  workTypeChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  workTypeChipText: {
    color: COLORS.text,
  },
  workTypeChipTextActive: {
    color: COLORS.primary,
    fontWeight: fontWeight.semibold,
  },
  spareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

function normalizeStatusLabel(raw) {
  const v = String(raw || '').toLowerCase();
  if (v.includes('progress')) return 'In Progress';
  if (v.includes('finish') || v.includes('done') || v.includes('completed')) return 'Finished';
  if (v.includes('reject') || v.includes('cancel')) return 'Rejected';
  return 'Pending';
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{String(value)}</Text>
    </View>
  );
}

function StatusPill({ status }) {
  const map = {
    Pending: { bg: COLORS.yellowLight, text: COLORS.yellowDark },
    'In Progress': { bg: COLORS.blueLight, text: COLORS.blueDark },
    Finished: { bg: COLORS.greenLight, text: COLORS.greenDark },
    Rejected: { bg: COLORS.redLight, text: COLORS.redDark },
  };
  const s = map[status] || { bg: COLORS.border, text: COLORS.text };
  return (
    <View style={{ backgroundColor: s.bg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full }}>
      <Text style={{ color: s.text }}>{status}</Text>
    </View>
  );
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toISOString().split('T')[0];
  } catch {
    return String(iso || '');
  }
}