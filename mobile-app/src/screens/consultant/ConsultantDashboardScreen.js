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
} from 'react-native';
import { COLORS, spacing, borderRadius, commonStyles, fontSize, fontWeight, shadow } from '../../utils/styles';
import { clearUserData, getUserEmail } from '../../utils/storage';
import { useNavigation } from '@react-navigation/native';
import { apiGet, apiPost, authAPI } from '../../utils/api';

export default function ConsultantDashboardScreen() {
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

  // ---------- Reports ----------
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('Summary');
  const [vendor, setVendor] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [vinFilter, setVinFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      try {
        setHistoryLoading(true);
        const { ok, data } = await apiGet('/reports/history');
        if (ok && data?.success && Array.isArray(data.history)) {
          setHistory(
            data.history.map((h) => ({
              id: h.id || h._id || String(Math.random()),
              type: h.type || 'Summary',
              createdAt: h.createdAt || h.date || new Date().toISOString(),
              range: h.range || h.period || '—',
            }))
          );
        } else {
          setHistory([]);
        }
      } catch (e) {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    }
    loadHistory();
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

  async function generateReport() {
    try {
      if (!startDate || !endDate) {
        Alert.alert('Missing Dates', 'Please provide start and end date.');
        return;
      }
      const params = new URLSearchParams();
      if (vendor && vendor.trim() !== '') params.set('supplier_email', vendor.trim());
      if (orderNumber && String(orderNumber).trim() !== '') params.set('order_number', String(orderNumber).trim());
      if (vinFilter && vinFilter.trim() !== '') params.set('vin', vinFilter.trim());
      params.set('date_from', startDate);
      params.set('date_to', endDate);
      const { ok, data } = await apiGet(`/work-orders/search?${params.toString()}`);
      if (!ok || !data?.success) throw new Error(data?.error || 'Report generation failed');
      const ordersData = Array.isArray(data.orders) ? data.orders : [];
      const newReport = {
        id: String(Date.now()),
        type: reportType,
        createdAt: new Date().toISOString(),
        range: `${startDate} → ${endDate}`,
        data: ordersData,
      };
      setHistory((prev) => [newReport, ...prev]);
      setSelectedReport(newReport);
      setReportModalOpen(false);
      setViewModalOpen(true);
    } catch (e) {
      Alert.alert('Error', e.message || 'Report generation failed');
    }
  }

  function exportReportPDF() {
    if (!selectedReport) {
      Alert.alert('No Report', 'Select or generate a report first.');
      return;
    }
    setLoadingExport(true);
    setTimeout(() => {
      setLoadingExport(false);
      Alert.alert('Export PDF', 'PDF export is not available on mobile yet.');
    }, 300);
  }

  function exportReportExcel() {
    if (!selectedReport) {
      Alert.alert('No Report', 'Select or generate a report first.');
      return;
    }
    setLoadingExport(true);
    setTimeout(() => {
      setLoadingExport(false);
      Alert.alert('Export Excel', 'Excel export is not available on mobile yet.');
    }, 300);
  }

  function printReport() {
    Alert.alert('Print', 'Use Export PDF to print from your device.');
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
          <Text style={styles.appTitle}>Consultant Dashboard</Text>
          <Text style={styles.subtitleText}>{userLoading ? 'Loading user…' : `Welcome, ${user.name}`}</Text>
        </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setReportModalOpen(true)}>
          <Text style={styles.primaryButtonText}>Generate Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="In Progress" value={stats.inProgress} />
        <StatCard label="Finished" value={stats.finished} />
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

      {/* Report History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Report History</Text>
        {historyLoading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : history.length === 0 ? (
          <Text style={styles.emptyText}>No reports yet.</Text>
        ) : (
          history.map((h) => (
            <View key={h.id} style={styles.historyItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle}>{h.type}</Text>
                <Text style={styles.historySub}>{h.range}</Text>
              </View>
              <TouchableOpacity onPress={() => { setSelectedReport(h); setViewModalOpen(true); }}>
                <Text style={[styles.historyDate, { color: COLORS.primary }]}>Open</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Report Modal */}
      <Modal visible={reportModalOpen} transparent animationType="fade" onRequestClose={() => setReportModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Generate Report</Text>
            <TextInput
              placeholder="Report type (e.g., Summary)"
              value={reportType}
              onChangeText={setReportType}
              style={styles.searchInput}
            />
            <TextInput placeholder="Vendor email" value={vendor} onChangeText={setVendor} style={styles.searchInput} />
            <TextInput placeholder="Order number" value={orderNumber} onChangeText={setOrderNumber} style={styles.searchInput} />
            <TextInput placeholder="VIN" value={vinFilter} onChangeText={setVinFilter} style={styles.searchInput} />
            <TextInput placeholder="Start date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} style={styles.searchInput} />
            <TextInput placeholder="End date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} style={styles.searchInput} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity style={styles.primaryButton} onPress={generateReport}>
                <Text style={styles.primaryButtonText}>Generate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setReportModalOpen(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report View Modal */}
      <Modal visible={viewModalOpen} transparent animationType="fade" onRequestClose={() => setViewModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalCard}>
            <Text style={styles.modalTitle}>Report Preview</Text>
            {selectedReport ? (
              <View style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.sectionTitle}>Records: {Array.isArray(selectedReport.data) ? selectedReport.data.length : 0}</Text>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <TouchableOpacity onPress={exportReportPDF} style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>{loadingExport ? 'Processing…' : 'Export PDF'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={exportReportExcel} style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>{loadingExport ? 'Processing…' : 'Export Excel'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={printReport} style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>Print</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.historySub}>Type: {selectedReport.type}</Text>
                <Text style={styles.historySub}>Range: {selectedReport.range}</Text>
                <View style={{ gap: spacing.sm }}>
                  {Array.isArray(selectedReport.data) && selectedReport.data.length > 0 ? (
                    selectedReport.data.map((o) => (
                      <View key={String(o.id || Math.random())} style={styles.orderCard}>
                        <View style={styles.orderHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.orderTitle}>{String(o.title || `${o.vehicle_year ? o.vehicle_year + ' ' : ''}${o.vehicle_make || ''} ${o.vehicle_model || ''}`).trim()}</Text>
                            <Text style={styles.orderSub}>Supplier: {String(o.supplier_email || '—')}</Text>
                          </View>
                          <StatusPill status={normalizeStatusLabel(o.status || o.status_raw || 'pending')} />
                        </View>
                        <View style={styles.orderDetails}>
                          <Text style={styles.detailText}>Customer: {String(o.customer_name || '—')}</Text>
                          <Text style={styles.detailText}>Phone: {String(o.customer_phone || '—')}</Text>
                          <Text style={styles.detailText}>VIN: {String(o.vehicle_vin || '—')}</Text>
                          <Text style={styles.detailText}>Total: ${Number(o.quote_total || 0).toFixed(2)}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No data for selected report.</Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md }}>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => setViewModalOpen(false)}>
                    <Text style={styles.primaryButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyText}>No report selected.</Text>
            )}
          </ScrollView>
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
  historyItem: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.sm,
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