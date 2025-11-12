import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal, ActivityIndicator, Alert } from 'react-native';
import { COLORS, spacing, borderRadius, commonStyles, fontSize, fontWeight } from '../../utils/styles';
import { clearUserData, getUserEmail } from '../../utils/storage';
import { apiGet, apiPut } from '../../utils/api';
import { useNavigation } from '@react-navigation/native';

export default function TechnicianDashboardScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'in_progress' | 'finished'

  const [pendingOrders, setPendingOrders] = useState([]);
  const [inProgressOrders, setInProgressOrders] = useState([]);
  const [finishedOrders, setFinishedOrders] = useState([]);

  const [confirmModal, setConfirmModal] = useState({ visible: false, mode: 'accept', order: null });
  const [detailsModal, setDetailsModal] = useState({ visible: false, order: null });
  const [logoutModal, setLogoutModal] = useState(false);

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      try {
        const e = await getUserEmail();
        setEmail(e || '');
        await refreshAll();
      } catch (err) {
        console.error('Technician boot error', err);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  async function refreshAll() {
    try {
      const [pending, progress, finished] = await Promise.all([
        apiGet('/work-orders?status=pending'),
        apiGet('/work-orders?status=in_progress'),
        apiGet('/work-orders?status=finished'),
      ]);
      setPendingOrders(Array.isArray(pending) ? pending : pending?.orders || []);
      setInProgressOrders(Array.isArray(progress) ? progress : progress?.orders || []);
      setFinishedOrders(Array.isArray(finished) ? finished : finished?.orders || []);
    } catch (err) {
      console.error('Failed loading work orders', err);
    }
  }

  const counts = useMemo(() => ({
    new: pendingOrders.length,
    in_progress: inProgressOrders.length,
    finished: finishedOrders.length,
  }), [pendingOrders, inProgressOrders, finishedOrders]);

  const listForTab = useMemo(() => {
    const base = activeTab === 'new' ? pendingOrders : activeTab === 'in_progress' ? inProgressOrders : finishedOrders;
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(o => (
      String(o.id || o.workOrderId || '').toLowerCase().includes(q) ||
      String(o.title || o.vehicle || '').toLowerCase().includes(q) ||
      String(o.customer?.name || o.customerName || '').toLowerCase().includes(q)
    ));
  }, [activeTab, pendingOrders, inProgressOrders, finishedOrders, search]);

  function openDetails(order) { setDetailsModal({ visible: true, order }); }
  function closeDetails() { setDetailsModal({ visible: false, order: null }); }
  function requestAccept(order) { setConfirmModal({ visible: true, mode: 'accept', order }); }
  function requestDecline(order) { setConfirmModal({ visible: true, mode: 'decline', order }); }
  function closeConfirm() { setConfirmModal({ visible: false, mode: 'accept', order: null }); }

  async function confirmAction() {
    const { order, mode } = confirmModal;
    if (!order) return;
    try {
      setLoading(true);
      if (mode === 'accept') {
        await apiPut(`/work-orders/${order.id || order.workOrderId}/status`, { status: 'in_progress', accepted_by: email || null });
        Alert.alert('Accepted', `Work order #${order.id || order.workOrderId} accepted.`);
      } else {
        await apiPut(`/work-orders/${order.id || order.workOrderId}/status`, { status: 'rejected', accepted_by: null });
        Alert.alert('Declined', `Work order #${order.id || order.workOrderId} declined.`);
      }
      await refreshAll();
    } catch (err) {
      console.error('Update status failed', err);
      Alert.alert('Error', 'Could not update work order status.');
    } finally {
      setLoading(false);
      closeConfirm();
    }
  }

  async function logout() {
    await clearUserData();
    if (typeof global !== 'undefined' && typeof global.updateAuthState === 'function') {
      await global.updateAuthState();
    }
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  }

  const renderOrder = ({ item }) => {
    const id = item.id || item.workOrderId;
    const status = item.status || 'pending';
    const canAccept = status === 'pending';
    const canDecline = status === 'pending';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>WO #{id}</Text>
          <View style={styles.badgeWrap}>
            <Text style={[styles.badge, badgeColor(status)]}>{String(status).replace('_', ' ')}</Text>
          </View>
        </View>
        <Text style={styles.cardSub}>{item.title || item.vehicle || 'Work order'}</Text>
        {(item.customer?.name || item.customerName) && (
          <Text style={styles.cardMeta}>Customer: {item.customer?.name || item.customerName}</Text>
        )}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => openDetails(item)}>
            <Text style={styles.btnText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, canAccept ? styles.btnSuccess : styles.btnDisabled]}
            onPress={() => canAccept && requestAccept(item)}
            disabled={!canAccept}
          >
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, canDecline ? styles.btnDanger : styles.btnDisabled]}
            onPress={() => canDecline && requestDecline(item)}
            disabled={!canDecline}
          >
            <Text style={styles.btnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[commonStyles.container, styles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Technician Dashboard</Text>
        <View style={styles.headerRight}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search work orders..."
            style={styles.searchInput}
          />
          <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={refreshAll}>
            <Text style={[styles.btnText, styles.btnTextDark]}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => setLogoutModal(true)}>
            <Text style={[styles.btnText, styles.btnTextDark]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Row */}
      <View style={styles.kpiRow}>
        <Kpi label="New" value={counts.new} color="#0ea5e9" />
        <Kpi label="In Progress" value={counts.in_progress} color="#f59e0b" />
        <Kpi label="Finished" value={counts.finished} color="#22c55e" />
      </View>

      {/* Status Tabs */}
      <View style={styles.tabsRow}>
        {['new', 'in_progress', 'finished'].map(k => (
          <TouchableOpacity
            key={k}
            style={[styles.tab, activeTab === k && styles.tabActive]}
            onPress={() => setActiveTab(k)}
          >
            <Text style={[styles.tabText, activeTab === k && styles.tabTextActive]}>
              {k === 'new' ? 'New' : k === 'in_progress' ? 'In Progress' : 'Finished'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <View style={styles.listWrap}>
        {loading ? (
          <ActivityIndicator size="small" />
        ) : (
          <FlatList
            data={listForTab}
            keyExtractor={(item) => String(item.id || item.workOrderId)}
            renderItem={renderOrder}
            ListEmptyComponent={(
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No work orders found.</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Confirm Modal */}
      <Modal visible={confirmModal.visible} transparent animationType="fade" onRequestClose={closeConfirm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {confirmModal.mode === 'accept' ? 'Accept work order?' : 'Decline work order?'}
            </Text>
            {confirmModal.order && (
              <Text style={styles.modalText}>WO #{confirmModal.order.id || confirmModal.order.workOrderId}</Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={closeConfirm}>
                <Text style={[styles.btnText, styles.btnTextDark]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={confirmAction}>
                <Text style={styles.btnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal visible={detailsModal.visible} transparent animationType="slide" onRequestClose={closeDetails}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>        
            {detailsModal.order ? (
              <View>
                <Text style={styles.modalTitle}>Work Order Details</Text>
                <Text style={styles.modalText}>ID: {detailsModal.order.id || detailsModal.order.workOrderId}</Text>
                <Text style={styles.modalText}>Status: {(detailsModal.order.status || 'pending').replace('_', ' ')}</Text>
                {(detailsModal.order.title || detailsModal.order.vehicle) && (
                  <Text style={styles.modalText}>Title: {detailsModal.order.title || detailsModal.order.vehicle}</Text>
                )}
                {(detailsModal.order.customer?.name || detailsModal.order.customerName) && (
                  <Text style={styles.modalText}>Customer: {detailsModal.order.customer?.name || detailsModal.order.customerName}</Text>
                )}
                {(detailsModal.order.service_date || detailsModal.order.date) && (
                  <Text style={styles.modalText}>Date: {detailsModal.order.service_date || detailsModal.order.date}</Text>
                )}
                {Array.isArray(detailsModal.order.services) && detailsModal.order.services.length > 0 && (
                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={styles.modalSubtitle}>Services</Text>
                    {detailsModal.order.services.map((s, idx) => (
                      <View key={idx} style={styles.serviceRow}>
                        <Text style={styles.serviceName}>{s.name || s.service}</Text>
                        <Text style={styles.servicePrice}>{s.price ? `$${s.price}` : ''}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <ActivityIndicator />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={closeDetails}>
                <Text style={[styles.btnText, styles.btnTextDark]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Modal */}
      <Modal visible={logoutModal} transparent animationType="fade" onRequestClose={() => setLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Logout?</Text>
            <Text style={styles.modalText}>You will return to role selection.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => setLogoutModal(false)}>
                <Text style={[styles.btnText, styles.btnTextDark]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={logout}>
                <Text style={styles.btnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const Kpi = ({ label, value, color }) => (
  <View style={[styles.kpiCard, { borderLeftColor: color }]}> 
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={styles.kpiValue}>{value}</Text>
  </View>
);

const badgeColor = (status) => {
  switch (status) {
    case 'pending':
      return { backgroundColor: '#e0f2fe', color: '#0284c7' };
    case 'in_progress':
      return { backgroundColor: '#fff7ed', color: '#d97706' };
    case 'finished':
      return { backgroundColor: '#dcfce7', color: '#16a34a' };
    case 'rejected':
      return { backgroundColor: '#fee2e2', color: '#dc2626' };
    default:
      return { backgroundColor: '#e5e7eb', color: '#374151' };
  }
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    color: COLORS.text,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchInput: {
    flexGrow: 1,
    minWidth: 160,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  kpiRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  kpiLabel: { fontSize: fontSize.xs, color: COLORS.textSecondary, marginBottom: 4 },
  kpiValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: COLORS.text },
  tabsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  tabActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  tabText: { color: COLORS.text, fontWeight: fontWeight.semibold },
  tabTextActive: { color: '#ffffff' },
  listWrap: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { color: COLORS.textSecondary },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: COLORS.text },
  badgeWrap: {},
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, overflow: 'hidden' },
  cardSub: { color: COLORS.text, marginTop: 4 },
  cardMeta: { color: COLORS.textSecondary, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#ffffff', fontWeight: fontWeight.semibold },
  btnPrimary: { backgroundColor: COLORS.text },
  btnSuccess: { backgroundColor: '#16a34a' },
  btnDanger: { backgroundColor: '#dc2626' },
  btnDisabled: { backgroundColor: '#9ca3af' },
  btnOutline: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb' },
  btnTextDark: { color: COLORS.text },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: COLORS.text },
  modalSubtitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: COLORS.text, marginBottom: spacing.xs },
  modalText: { color: COLORS.text, marginTop: spacing.xs },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  serviceName: { color: COLORS.text },
  servicePrice: { color: COLORS.text, fontWeight: fontWeight.semibold },
});