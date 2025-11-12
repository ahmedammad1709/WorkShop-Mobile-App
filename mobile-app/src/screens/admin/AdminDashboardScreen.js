import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { COLORS, spacing, borderRadius, commonStyles, fontSize, fontWeight, shadow } from '../../utils/styles';
import { clearUserData } from '../../utils/storage';
import { useNavigation } from '@react-navigation/native';
import { apiGet } from '../../utils/api';

export default function AdminDashboardScreen() {
  const navigation = useNavigation();

  // ---------- Navigation Tabs (mirror Sidebar options) ----------
  const TABS = ['Dashboard', 'Orders', 'User Management', 'User Roles', 'Settings'];
  const [activeTab, setActiveTab] = useState('Dashboard');

  // ---------- KPI Data (mirror web AdminDashboard) ----------
  const [kpi, setKpi] = useState({
    contractors: 0,
    technicians: 0,
    suppliers: 0,
    cancelledOrders: 0,
    completedOrders: 0,
    inProgressOrders: 0,
  });
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiError, setKpiError] = useState('');

  useEffect(() => {
    async function fetchKpi() {
      try {
        setKpiLoading(true);
        setKpiError('');
        const [rolesRes, statusRes] = await Promise.all([
          apiGet('/auth/roles-stats'),
          apiGet('/work-orders/status-stats'),
        ]);
        const roleStats = Array.isArray(rolesRes?.data?.stats) ? rolesRes.data.stats : [];
        const statusStats = Array.isArray(statusRes?.data?.stats) ? statusRes.data.stats : [];
        const roleMap = roleStats.reduce((acc, s) => { acc[s.role] = s.count; return acc; }, {});
        const statusMap = statusStats.reduce((acc, s) => { acc[s.status] = s.count; return acc; }, {});
        setKpi({
          contractors: roleMap.contractor || 0,
          technicians: roleMap.technician || 0,
          suppliers: roleMap.supplier || 0,
          cancelledOrders: statusMap.cancelled || 0,
          completedOrders: statusMap.completed || 0,
          inProgressOrders: statusMap['in_progress'] || statusMap.in_progress || 0,
        });
      } catch (e) {
        setKpiError('Failed to load KPIs');
      } finally {
        setKpiLoading(false);
      }
    }
    fetchKpi();
  }, []);

  // ---------- Orders (mirror OrdersMultiTable simplified) ----------
  const [orders, setOrders] = useState([
    { id: 'ORD-001', title: 'Engine repair and breaks repair', charges: 450, status: 'In Progress', updatedAt: '2024-01-15' },
    { id: 'ORD-002', title: 'Engine repair and breaks repair', charges: 200, status: 'Completed', updatedAt: '2024-01-14' },
    { id: 'ORD-003', title: 'Engine repair and breaks repair', charges: 80, status: 'Pending', updatedAt: '2024-01-13' },
  ]);
  const [search, setSearch] = useState('');
  const STATUS_LIST = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'];
  const [selectedStatus, setSelectedStatus] = useState('All');
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(o => {
      const statusOk = selectedStatus === 'All' ? true : o.status === selectedStatus;
      const searchOk = !q || o.id.toLowerCase().includes(q) || o.title.toLowerCase().includes(q);
      return statusOk && searchOk;
    });
  }, [orders, search, selectedStatus]);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('Pending');

  function openEdit(o) {
    setEditingOrder(o);
    setEditTitle(o.title);
    setEditStatus(o.status);
    setEditOpen(true);
  }
  function saveEdit() {
    if (!editingOrder) return;
    const updated = orders.map(o => o.id === editingOrder.id ? { ...o, title: editTitle.trim(), status: editStatus } : o);
    setOrders(updated);
    setEditOpen(false);
    setEditingOrder(null);
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
          <Text style={styles.appTitle}>Admin Dashboard</Text>
          <Text style={styles.subtitleText}>Manage users, orders, and settings</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs (mirror Sidebar) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}>
            <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content switch */}
      {activeTab === 'Dashboard' && (
        <View style={{ gap: spacing.lg }}>
          {/* KPI Cards */}
          <View style={styles.kpiGrid4}>
            <Kpi title="Contractors" value={kpi.contractors} loading={kpiLoading} />
            <Kpi title="Technicians" value={kpi.technicians} loading={kpiLoading} />
            <Kpi title="Suppliers" value={kpi.suppliers} loading={kpiLoading} />
            <Kpi title="Cancelled Orders" value={kpi.cancelledOrders} loading={kpiLoading} />
          </View>
          <View style={styles.kpiGrid2}>
            <Kpi title="Completed Orders" value={kpi.completedOrders} loading={kpiLoading} />
            <Kpi title="In Progress Orders" value={kpi.inProgressOrders} loading={kpiLoading} />
          </View>
          {/* Annual Sales (Sparkline placeholder) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Annual Sales</Text>
            <Sparkline />
            {kpiError ? <Text style={styles.errorText}>{kpiError}</Text> : null}
          </View>
        </View>
      )}

      {activeTab === 'Orders' && (
        <View style={{ gap: spacing.lg }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Orders</Text>
            <View style={{ gap: spacing.md }}>
              <TextInput
                placeholder="Search orders..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
                {STATUS_LIST.map(s => (
                  <TouchableOpacity key={s} onPress={() => setSelectedStatus(s)} style={[styles.tabButtonSm, selectedStatus === s && styles.tabButtonActive]}>
                    <Text style={[styles.tabButtonTextSm, selectedStatus === s && styles.tabButtonTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={{ marginTop: spacing.md }}>
              {filteredOrders.length === 0 ? (
                <Text style={styles.muted}>No orders found.</Text>
              ) : (
                filteredOrders.map(o => (
                  <View key={o.id} style={styles.orderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderId}>{o.id}</Text>
                      <Text style={styles.orderTitle}>{o.title}</Text>
                      <Text style={styles.orderMeta}>Updated {o.updatedAt}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                      <Text style={[styles.badge, badgeColor(o.status)]}>{o.status}</Text>
                      <Text style={styles.orderCharge}>${o.charges.toFixed(2)}</Text>
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => openEdit(o)}>
                        <Text style={styles.secondaryButtonText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      )}

      {activeTab === 'User Management' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>User Management</Text>
          <Text style={styles.muted}>Manage contractors, technicians, suppliers, and consultants.</Text>
          <TouchableOpacity style={[styles.primaryButton, { marginTop: spacing.md }]} onPress={() => navigation.navigate('UserManagement')}>
            <Text style={styles.primaryButtonText}>Open User Management</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'User Roles' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>User Roles</Text>
          <Text style={styles.muted}>Assign and edit user roles and permissions.</Text>
          <TouchableOpacity style={[styles.primaryButton, { marginTop: spacing.md }]} onPress={() => Alert.alert('Roles', 'Roles management coming soon.')}> 
            <Text style={styles.primaryButtonText}>Manage Roles</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'Settings' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Settings</Text>
          <Text style={styles.muted}>Configure app settings and preferences.</Text>
          <TouchableOpacity style={[styles.primaryButton, { marginTop: spacing.md }]} onPress={() => Alert.alert('Settings', 'Settings coming soon.')}> 
            <Text style={styles.primaryButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Edit Order Modal */}
      <Modal visible={editOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>Edit Order</Text>
            <View style={{ gap: spacing.md }}>
              <TextInput value={editTitle} onChangeText={setEditTitle} style={styles.searchInput} placeholder="Title" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
                {STATUS_LIST.filter(s => s !== 'All').map(s => (
                  <TouchableOpacity key={s} onPress={() => setEditStatus(s)} style={[styles.tabButtonSm, editStatus === s && styles.tabButtonActive]}>
                    <Text style={[styles.tabButtonTextSm, editStatus === s && styles.tabButtonTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
              <TouchableOpacity style={styles.primaryButton} onPress={saveEdit}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setEditOpen(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
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
  tabsScroll: {
    marginTop: spacing.xs,
  },
  tabButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: COLORS.white,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tabButtonText: {
    color: COLORS.textSecondary,
    fontWeight: fontWeight.medium,
  },
  tabButtonTextActive: {
    color: COLORS.primary,
  },
  tabButtonSm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: COLORS.white,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButtonTextSm: {
    color: COLORS.textSecondary,
  },
  kpiGrid4: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  kpiGrid2: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadow.md,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: COLORS.text,
    marginBottom: spacing.md,
  },
  errorText: {
    color: COLORS.error,
    marginTop: spacing.sm,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: COLORS.white,
  },
  muted: {
    color: COLORS.textSecondary,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderId: {
    fontWeight: fontWeight.semibold,
    color: COLORS.text,
  },
  orderTitle: {
    color: COLORS.text,
  },
  orderMeta: {
    color: COLORS.textSecondary,
    fontSize: fontSize.sm,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    color: COLORS.white,
    overflow: 'hidden',
    fontSize: fontSize.sm,
  },
  orderCharge: {
    color: COLORS.text,
    fontWeight: fontWeight.semibold,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: fontWeight.semibold,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: COLORS.white,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontWeight: fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadow.md,
  },
});

// ---------- Helper components ----------
function Kpi({ title, value, loading }) {
  return (
    <View style={[styles.card, { flex: 1 }]}> 
      <Text style={styles.muted}>{title}</Text>
      <Text style={{ fontSize: fontSize['xl'], fontWeight: fontWeight.semibold, color: COLORS.text }}>
        {loading ? '…' : value}
      </Text>
    </View>
  );
}

function Sparkline() {
  // Simple placeholder sparkline using bars
  const data = [12, 8, 10, 14, 9, 11, 15, 13, 16, 12, 18, 20];
  const max = Math.max(...data);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
      {data.map((v, i) => (
        <View key={i} style={{ width: 12, height: Math.max(8, (v / max) * 80), backgroundColor: COLORS.primary, borderRadius: 4 }} />
      ))}
    </View>
  );
}

function badgeColor(status) {
  switch (status) {
    case 'Completed':
      return { backgroundColor: '#16a34a' };
    case 'In Progress':
      return { backgroundColor: '#3b82f6' };
    case 'Pending':
      return { backgroundColor: '#f59e0b' };
    case 'Cancelled':
      return { backgroundColor: '#ef4444' };
    default:
      return { backgroundColor: COLORS.textSecondary };
  }
}