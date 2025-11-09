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

  // ---------- UI State ----------
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('All');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Price modal
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingPrice, setEditingPrice] = useState('');

  // Invoice modal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  // Status changer highlight
  const [activeStatusChanger, setActiveStatusChanger] = useState(null);

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
      const supplierEmail = (user?.email || (await getUserEmail()) || '').trim();
      const { ok, data } = await apiPut(`/work-orders/${order.id}/approve`, { supplier_email: supplierEmail });
      if (!ok || !data?.success) throw new Error(data?.error || 'Approval failed');
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'In Progress', supplier_email: supplierEmail } : o)));
      Alert.alert('Approved', `Order ${order.id} moved to In Progress.`);
    } catch (e) {
      Alert.alert('Error', e.message || 'Approval failed');
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
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
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
                  <StatusPill status={o.status} />
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
                  {o.item_description ? (
                    <Text style={styles.detailText}>Item: {o.item_description}</Text>
                  ) : null}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => performApprove(o)}>
                      <Text style={styles.primaryButtonText}>Approve</Text>
                    </TouchableOpacity>
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
        <Text style={styles.sectionTitle}>Services / Price List</Text>
        <View style={styles.servicesGrid}>
          {DEFAULT_SERVICES.map((s) => (
            <View key={s.id} style={styles.serviceItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{s.name}</Text>
                <Text style={styles.servicePrice}>${s.price}</Text>
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
            <Text style={styles.modalTitle}>Notifications</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {notifications.map((n) => (
                <View key={n.id} style={styles.notificationItem}>
                  <Text style={styles.notificationTitle}>{n.title}</Text>
                  <Text style={styles.notificationTime}>{n.time}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setNotifOpen(false)}>
                <Text style={styles.secondaryButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                  setNotifOpen(false);
                }}
              >
                <Text style={styles.primaryButtonText}>Mark All Read</Text>
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
                  Alert.alert('Updated', `Price for ${editingService?.name} set to $${editingPrice}`);
                  setPriceModalOpen(false);
                }}
              >
                <Text style={styles.primaryButtonText}>Save</Text>
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
                <Text style={styles.detailText}>Order: {invoiceOrder.id}</Text>
                <Text style={styles.detailText}>Title: {invoiceOrder.title}</Text>
                <Text style={styles.detailText}>Total: ${invoiceOrder.totalCost.toFixed(2)}</Text>
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