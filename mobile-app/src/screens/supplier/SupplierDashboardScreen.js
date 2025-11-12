import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, spacing, borderRadius, commonStyles, fontSize, fontWeight, shadow } from '../../utils/styles';
import { clearUserData, getUserEmail } from '../../utils/storage';
import { useNavigation } from '@react-navigation/native';
import { apiGet, apiPut, authAPI } from '../../utils/api';

export default function SupplierDashboardScreen() {
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
        if (!ok || !data?.success) {
          throw new Error(data?.error || 'Failed to load work orders');
        }
        const mapped = (data.orders || []).map((o) => ({
          id: o.id,
          title:
            o.title || `${o.vehicle_year ? o.vehicle_year + ' ' : ''}${o.vehicle_make || ''} ${o.vehicle_model || ''}`.trim(),
          contractor: o.created_by || '—',
          status: normalizeStatusLabel(o.status || o.status_raw || 'pending'),
          totalCost: Number(o.quote_total || o.charges || 0),
          details: `${o.customer_name || ''} ${o.customer_phone ? '(' + o.customer_phone + ')' : ''}`.trim(),
          services: [],
          supply_item: o.supply_item || null,
          item_description: o.item_description || null,
          supplier_email: o.supplier_email || null,
          startDate: (() => {
            try {
              const d = o.updatedAt || o.created_at;
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

  // ---------- Notifications ----------
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Your work is approved by contractor', time: '11:10 pm', read: false },
    { id: 2, title: 'New work order received: #W04', time: '09:20 am', read: false },
    { id: 3, title: 'Price change requested for Steering Repair', time: 'Yesterday', read: true },
  ]);
  const [notifOpen, setNotifOpen] = useState(false);
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const clearNotifications = () => setNotifications([]);
  const markNotificationRead = (id) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  // ---------- UI State ----------
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('All');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Price modal
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingPrice, setEditingPrice] = useState('');
  // Services state
  const [services, setServices] = useState(DEFAULT_SERVICES);
  // Add Service modal
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');

  // Invoice modal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  // Status changer highlight
  const [activeStatusChanger, setActiveStatusChanger] = useState(null);
  // Approve confirmation modal
  const [approveModal, setApproveModal] = useState({ open: false, order: null, loading: false, error: '' });
  const openApproveModal = (order) => setApproveModal({ open: true, order, loading: false, error: '' });
  const closeApproveModal = () => setApproveModal({ open: false, order: null, loading: false, error: '' });
  const STATUS_CYCLE = ['Sent', 'In Progress', 'Finished', 'Contractor'];

  const STATUS_LIST = ['All', 'Sent', 'In Progress', 'Finished', 'Contractor'];

  // Derived
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const hasSupplier = !!(o.supply_item && String(o.supply_item).trim() !== '');
      if (!hasSupplier) return false;
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
    const hasSupplier = (o) => !!(o.supply_item && String(o.supply_item).trim() !== '');
    const base = orders.filter(hasSupplier);
    const total = base.length;
    const inProgress = base.filter((o) => o.status === 'In Progress').length;
    const finished = base.filter((o) => o.status === 'Finished').length;
    const approved = base.filter((o) => !!o.supplier_email).length;
    return { total, inProgress, finished, approved };
  }, [orders]);

  function changeOrderStatus(orderId, newStatus) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
  }

  function cycleStatusUp(orderId) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const idx = STATUS_CYCLE.indexOf(order.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    changeOrderStatus(orderId, next);
  }

  function cycleStatusDown(orderId) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const idx = STATUS_CYCLE.indexOf(order.status);
    const prev = idx === 0 ? STATUS_CYCLE[STATUS_CYCLE.length - 1] : STATUS_CYCLE[idx - 1];
    changeOrderStatus(orderId, prev);
  }

  function openInvoice(order) {
    setInvoiceOrder(order);
    setInvoiceModalOpen(true);
  }

  function openModifyPrice(service) {
    setEditingService(service);
    setEditingPrice(String(service?.price ?? ''));
    setPriceModalOpen(true);
  }

  async function performApprove(order) {
    if (!order) return;
    try {
      setApproveModal((s) => ({ ...s, loading: true, error: '' }));
      const supplierEmail = (user?.email || (await getUserEmail()) || '').trim();
      const { ok, data } = await apiPut(`/work-orders/${order.id}/approve`, { supplier_email: supplierEmail });
      if (!ok || !data?.success) throw new Error(data?.error || 'Approval failed');
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'In Progress', supplier_email: supplierEmail } : o)));
      closeApproveModal();
      Alert.alert('Approved', `Order ${order.id} moved to In Progress.`);
    } catch (e) {
      setApproveModal((s) => ({ ...s, loading: false, error: e.message || 'Approval failed' }));
    }
  }

  async function logout() {
    await clearUserData();
    if (typeof global !== 'undefined' && typeof global.updateAuthState === 'function') {
      await global.updateAuthState();
    }
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  }

  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>Supplier Dashboard</Text>
          <Text style={styles.subtitleText}>{userLoading ? 'Loading user…' : `Welcome, ${user.name}`}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notifButton} onPress={() => setNotifOpen(true)}>
            <Text style={styles.notifText}>Notifications ({notifications.filter(n => !n.read).length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={() => setLogoutOpen(true)}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Total" value={stats.total} />
        <StatCard label="In Progress" value={stats.inProgress} />
        <StatCard label="Finished" value={stats.finished} />
        <StatCard label="Approved" value={stats.approved} />
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

      {/* Orders List */}
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
                  <Text style={styles.orderSub}>{o.details || '—'}</Text>
                </View>
                <View style={styles.orderHeaderRight}>
                  <TouchableOpacity onPress={() => setActiveStatusChanger(activeStatusChanger === o.id ? null : o.id)}>
                    <StatusPill status={o.status} />
                  </TouchableOpacity>
                  {activeStatusChanger === o.id && (
                    <View style={styles.statusChangerWrap}>
                      <TouchableOpacity style={styles.statusArrowBtn} onPress={() => cycleStatusUp(o.id)}>
                        <Text style={styles.statusArrowText}>▲</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.statusArrowBtn} onPress={() => cycleStatusDown(o.id)}>
                        <Text style={styles.statusArrowText}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <TouchableOpacity style={styles.smallButton} onPress={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}>
                    <Text style={styles.smallButtonText}>{expandedOrderId === o.id ? 'Hide' : 'Details'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {expandedOrderId === o.id && (
                <View style={styles.orderDetails}>
                  <Text style={styles.detailText}>Contractor: {o.contractor}</Text>
                  <Text style={styles.detailText}>Start Date: {o.startDate || '—'}</Text>
                  <Text style={styles.detailText}>Total Cost: ${o.totalCost.toFixed(2)}</Text>
                  {o.supply_item ? (
                    <View style={{ marginTop: spacing.xs }}>
                      <Text style={[styles.detailText, { fontWeight: fontWeight.semibold }]}>Supplier Assignment</Text>
                      <Text style={styles.detailText}>Item: {o.supply_item}</Text>
                      {o.item_description ? (
                        <Text style={styles.detailText}>Description: {o.item_description}</Text>
                      ) : null}
                    </View>
                  ) : null}
                  {o.paint_codes_json ? (
                    <View style={{ marginTop: spacing.xs }}>
                      <Text style={[styles.detailText, { fontWeight: fontWeight.semibold }]}>Paint Codes</Text>
                      {(() => {
                        try {
                          const paintCodes = typeof o.paint_codes_json === 'string' ? JSON.parse(o.paint_codes_json) : o.paint_codes_json;
                          if (Array.isArray(paintCodes) && paintCodes.length > 0) {
                            return (
                              <View style={{ marginTop: 4 }}>
                                {paintCodes.map((paint, idx) => (
                                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                                    <Text style={styles.detailText}>{paint.code}</Text>
                                    <Text style={styles.detailText}>Qty: {paint.quantity}</Text>
                                    {paint.triStage ? (
                                      <View style={{ backgroundColor: '#FDE68A', borderRadius: borderRadius.full, paddingVertical: 2, paddingHorizontal: 6 }}>
                                        <Text style={{ color: '#92400E', fontSize: fontSize.xs }}>Tri Stage</Text>
                                      </View>
                                    ) : null}
                                  </View>
                                ))}
                              </View>
                            );
                          }
                          return <Text style={styles.detailText}>No paint codes available</Text>;
                        } catch (e) {
                          return <Text style={[styles.detailText, styles.errorText]}>Invalid paint code data</Text>;
                        }
                      })()}
                    </View>
                  ) : null}
                  <View style={{ marginTop: spacing.xs }}>
                    <Text style={[styles.detailText, { fontWeight: fontWeight.semibold }]}>Services</Text>
                    {Array.isArray(o.services) && o.services.length > 0 ? (
                      <View style={{ marginTop: 4 }}>
                        {o.services.map((s) => {
                          const match = services.find((srv) => srv.id === s.id) || s;
                          return (
                            <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={styles.detailText}>{match.name}</Text>
                              <Text style={styles.detailText}>${Number(match.price || 0).toFixed(2)}</Text>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.detailText}>No services attached.</Text>
                    )}
                  </View>
                  <View style={styles.actionsRow}>
                    {o.supplier_email ? (
                      <View style={[styles.secondaryButton, { backgroundColor: '#059669' }]}> 
                        <Text style={[styles.secondaryButtonText, { color: COLORS.white }]}>Approved</Text>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.primaryButton} onPress={() => openApproveModal(o)}>
                        <Text style={styles.primaryButtonText}>Approve</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => openInvoice(o)}>
                      <Text style={styles.secondaryButtonText}>Invoice</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Services Section */}
      <View style={styles.servicesSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.sectionTitle}>Services / Price List</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setAddServiceOpen(true)}>
            <Text style={styles.primaryButtonText}>Add Service</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.servicesGrid}>
          {services.map((s) => (
            <View key={s.id} style={styles.serviceItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{s.name}</Text>
                <Text style={styles.servicePrice}>${s.price}</Text>
                <Text style={styles.serviceMeta}>#{s.id}</Text>
              </View>
              <TouchableOpacity style={styles.smallButton} onPress={() => openModifyPrice(s)}>
                <Text style={styles.smallButtonText}>Modify</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Notifications Modal */}
      <Modal visible={notifOpen} transparent animationType="fade" onRequestClose={() => setNotifOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TouchableOpacity style={styles.secondaryButton} onPress={markAllRead}>
                  <Text style={styles.secondaryButtonText}>Mark All Read</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={clearNotifications}>
                  <Text style={styles.secondaryButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {notifications.map((n) => (
                <View key={n.id} style={styles.notificationItem}>
                  <Text style={styles.notificationTitle}>{n.title}</Text>
                  <Text style={styles.notificationTime}>{n.time}</Text>
                  {!n.read && (
                    <TouchableOpacity style={[styles.smallButton, { marginTop: spacing.xs }]} onPress={() => markNotificationRead(n.id)}>
                      <Text style={styles.smallButtonText}>Mark</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setNotifOpen(false)}>
                <Text style={styles.secondaryButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setNotifOpen(false)}>
                <Text style={styles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modify Price Modal */}
      <Modal visible={priceModalOpen} transparent animationType="fade" onRequestClose={() => setPriceModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Modify Price</Text>
            <Text style={styles.detailText}>Service: {editingService?.name || '—'}</Text>
            <TextInput
              style={styles.searchInput}
              keyboardType="numeric"
              placeholder="Enter new price"
              value={editingPrice}
              onChangeText={setEditingPrice}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setPriceModalOpen(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  const parsed = parseFloat(editingPrice);
                  if (isNaN(parsed) || parsed < 0) {
                    Alert.alert('Invalid price', 'Please enter a valid non-negative number.');
                    return;
                  }
                  // Update services state
                  setServices((prev) => prev.map((srv) => (srv.id === editingService.id ? { ...srv, price: parsed } : srv)));
                  // Optionally reflect price change in orders that reference this service id
                  setOrders((prev) => prev.map((o) => {
                    const has = Array.isArray(o.services) && o.services.some((sv) => sv.id === editingService.id);
                    if (!has) return o;
                    const newTotal = o.services.reduce((sum, sv) => {
                      const match = sv.id && services.find((s) => s.id === sv.id);
                      const newPrice = sv.id === editingService.id ? parsed : (match?.price ?? sv.price ?? 0);
                      return sum + Number(newPrice || 0);
                    }, 0);
                    return { ...o, totalCost: newTotal };
                  }));
                  Alert.alert('Updated', `Price for ${editingService?.name} set to $${parsed.toFixed(2)}`);
                  setPriceModalOpen(false);
                  setEditingService(null);
                  setEditingPrice('');
                }}
              >
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Service Modal */}
      <Modal visible={addServiceOpen} transparent animationType="fade" onRequestClose={() => setAddServiceOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Service</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Service name (e.g. Oil Change)"
              value={newServiceName}
              onChangeText={setNewServiceName}
            />
            <TextInput
              style={styles.searchInput}
              keyboardType="numeric"
              placeholder="Price"
              value={newServicePrice}
              onChangeText={setNewServicePrice}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setAddServiceOpen(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  const name = newServiceName.trim();
                  const price = parseFloat(newServicePrice);
                  if (!name) {
                    Alert.alert('Validation', 'Please enter a service name.');
                    return;
                  }
                  if (isNaN(price) || price < 0) {
                    Alert.alert('Validation', 'Please enter a valid price.');
                    return;
                  }
                  const id = `S${String(Math.floor(Math.random() * 10000)).padStart(2, '0')}`;
                  setServices((prev) => [...prev, { id, name, price }]);
                  setAddServiceOpen(false);
                  setNewServiceName('');
                  setNewServicePrice('');
                }}
              >
                <Text style={styles.primaryButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Invoice Modal */}
      <Modal visible={invoiceModalOpen} transparent animationType="fade" onRequestClose={() => setInvoiceModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Invoice Preview</Text>
            {invoiceOrder ? (
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={styles.detailText}>Contractor</Text>
                    <Text style={[styles.detailText, { fontWeight: fontWeight.semibold }]}>{invoiceOrder.contractor}</Text>
                  </View>
                  <View>
                    <Text style={styles.detailText}>Service Date</Text>
                    <Text style={[styles.detailText, { fontWeight: fontWeight.semibold }]}>{invoiceOrder.startDate || '—'}</Text>
                  </View>
                </View>
                <Text style={[styles.detailText, { fontWeight: fontWeight.semibold, marginTop: spacing.sm }]}>Work order: {invoiceOrder.id}</Text>
                {invoiceOrder?.supply_item ? (
                  <View style={{ marginTop: spacing.xs }}>
                    <Text style={[styles.detailText, { fontWeight: fontWeight.semibold }]}>Supplier Assignment</Text>
                    <Text style={styles.detailText}>Item: {invoiceOrder.supply_item}</Text>
                    {invoiceOrder.item_description ? (
                      <Text style={styles.detailText}>Description: {invoiceOrder.item_description}</Text>
                    ) : null}
                  </View>
                ) : null}
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={[styles.detailText, { fontWeight: fontWeight.semibold }]}>Services</Text>
                  {Array.isArray(invoiceOrder.services) && invoiceOrder.services.length > 0 ? (
                    <View style={{ marginTop: 4 }}>
                      {invoiceOrder.services.map((s) => {
                        const srv = services.find((ss) => ss.id === s.id) || s;
                        return (
                          <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                            <Text style={styles.detailText}>{srv.name}</Text>
                            <Text style={[styles.detailText, { fontWeight: fontWeight.semibold }]}>${Number(srv.price || 0).toFixed(2)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.detailText}>No services attached.</Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end', marginTop: spacing.sm }}>
                  <Text style={[styles.detailText, { fontWeight: fontWeight.semibold }]}>Total due: ${invoiceOrder.totalCost.toFixed(2)}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.detailText}>No order selected.</Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setInvoiceModalOpen(false)}>
                <Text style={styles.secondaryButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={() => Alert.alert('Invoice', 'Download not implemented in mobile preview.')}>
                <Text style={styles.primaryButtonText}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Approve Confirmation Modal */}
      <Modal visible={approveModal.open} transparent animationType="fade" onRequestClose={closeApproveModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Approval</Text>
            <Text style={styles.detailText}>Approve this work order? Your email will be recorded.</Text>
            {approveModal.error ? <Text style={[styles.errorText]}>{approveModal.error}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={closeApproveModal} disabled={approveModal.loading}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={() => performApprove(approveModal.order)} disabled={approveModal.loading}>
                <Text style={styles.primaryButtonText}>{approveModal.loading ? 'Confirming…' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal visible={logoutOpen} transparent animationType="fade" onRequestClose={() => setLogoutOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.detailText}>Are you sure you want to logout? You will need to sign in again.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setLogoutOpen(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={logout}>
                <Text style={styles.primaryButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    backgroundColor: COLORS.background,
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
  notifButton: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...shadow.sm,
  },
  notifText: {
    color: COLORS.text,
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
  orderHeaderRight: {
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  statusChangerWrap: {
    flexDirection: 'column',
    gap: 4,
  },
  statusArrowBtn: {
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  statusArrowText: {
    color: COLORS.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: 18,
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
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  detailText: {
    color: COLORS.text,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
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
  smallButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  smallButtonText: {
    color: COLORS.text,
  },
  servicesSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: COLORS.text,
  },
  servicesGrid: {
    gap: spacing.sm,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadow.sm,
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
  notificationItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: spacing.sm,
  },
  notificationTitle: {
    color: COLORS.text,
  },
  notificationTime: {
    color: COLORS.textSecondary,
    fontSize: fontSize.sm,
  },
  errorText: {
    color: COLORS.error,
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
});

// Helpers
const DEFAULT_SERVICES = [
  { id: 'S01', name: 'Car Washing', price: 29 },
  { id: 'S02', name: 'Steering Repair', price: 45 },
  { id: 'S03', name: 'Engine Repair', price: 199 },
  { id: 'S04', name: 'Clutch', price: 89 },
  { id: 'S05', name: 'Break', price: 49 },
  { id: 'S06', name: 'Tire', price: 179 },
];

function normalizeStatusLabel(raw) {
  const s = String(raw || '').toLowerCase();
  if (s.includes('progress')) return 'In Progress';
  if (s.includes('finish')) return 'Finished';
  if (s.includes('contractor')) return 'Contractor';
  if (s.includes('sent')) return 'Sent';
  return 'Sent';
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function StatusPill({ status }) {
  const map = {
    Sent: { bg: COLORS.primaryLight, text: COLORS.text },
    'In Progress': { bg: '#FEF3C7', text: '#92400E' },
    Finished: { bg: '#DCFCE7', text: '#065F46' },
    Contractor: { bg: '#D1FAE5', text: '#065F46' },
  };
  const c = map[status] || map['Sent'];
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: borderRadius.full, paddingVertical: spacing.xs, paddingHorizontal: spacing.md }}>
      <Text style={{ color: c.text, fontSize: fontSize.sm }}>{status}</Text>
    </View>
  );
}