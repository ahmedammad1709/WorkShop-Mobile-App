import React, { useState } from "react";
import EditWorkOrderModal from "./EditWorkOrderModal";

export default function WorkOrderPreview({ selectedWorkOrder, setWorkOrders, setSelectedWorkOrder }) {
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null }); // type: 'cancel' | 'complete'
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const base = (API_URL || '').replace(/\/+$/, '');
  const statusEndpoint = (id) => (/\/api\/?$/.test(base) ? `${base}/work-orders/${id}/status` : `${base}/api/work-orders/${id}/status`);

  const openCancel = () => setConfirmModal({ open: true, type: 'cancel' });
  const openComplete = () => setConfirmModal({ open: true, type: 'complete' });
  const closeConfirm = () => { setConfirmModal({ open: false, type: null }); setConfirmError(''); };
  const openEdit = () => setEditOpen(true);
  const closeEdit = () => setEditOpen(false);

  const performConfirm = async () => {
    const type = confirmModal.type;
    if (!type || !selectedWorkOrder?.id) { closeConfirm(); return; }
    const status = type === 'cancel' ? 'cancelled' : 'completed';
    try {
      setConfirming(true);
      setConfirmError('');
      const res = await fetch(statusEndpoint(selectedWorkOrder.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error || res.statusText);
      const displayStatus = status === 'cancelled' ? 'Cancelled' : 'Completed';
      if (typeof setWorkOrders === 'function') {
        setWorkOrders(prev => prev.map(o => o.id === selectedWorkOrder.id ? { ...o, status: displayStatus, status_raw: status } : o));
      }
      if (typeof setSelectedWorkOrder === 'function') {
        setSelectedWorkOrder(prev => (prev && prev.id === selectedWorkOrder.id) ? { ...prev, status: displayStatus, status_raw: status } : prev);
      }
      closeConfirm();
    } catch (e) {
      setConfirmError(e.message || 'Status update failed');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold">Work Order Preview</div>
          <div className="text-xs text-gray-400">Select a work order to view details</div>
        </div>
      </div>

      {selectedWorkOrder ? (
        <div className="mt-3">
          <div className="h-36 rounded-md overflow-hidden mb-3">
            <img
              src={(selectedWorkOrder.image || '') + "&auto=format&fit=crop&w=800&q=60"}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-sm font-medium">#{selectedWorkOrder.id}</div>
          <div className="text-xs text-gray-500">{selectedWorkOrder.make} · {selectedWorkOrder.year}</div>

          <div className="mt-3 flex gap-2">
            <button onClick={openCancel} className="flex-1 px-3 py-2 bg-gray-100 rounded cursor-pointer">Cancel</button>
            <button onClick={openComplete} className="flex-1 px-3 py-2 bg-green-600 text-white rounded cursor-pointer">Mark as Completed</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 text-xs text-gray-400">No selection</div>
      )}

      {confirmModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 flex items-center justify-center rounded-full ${confirmModal.type === 'cancel' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {confirmModal.type === 'cancel' ? '✕' : '✔'}
              </div>
              <h3 className="text-lg font-semibold text-black">
                {confirmModal.type === 'cancel' ? 'Cancel Work Order' : 'Mark as Completed'}
              </h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              {confirmModal.type === 'cancel'
                ? 'This work order will be cancelled. This action cannot be undone.'
                : 'This work order will be marked as completed. This action cannot be undone.'}
            </p>
            {confirmError && <div className="text-sm text-red-600 mb-3">{confirmError}</div>}
            <div className="flex justify-end gap-3">
              <button onClick={closeConfirm} disabled={confirming} className="px-4 py-2 border rounded-md hover:bg-gray-50 cursor-pointer disabled:opacity-50">No, keep</button>
              <button
                onClick={performConfirm}
                disabled={confirming}
                className={`px-4 py-2 rounded-md text-white cursor-pointer ${confirmModal.type === 'cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-50`}
              >
                {confirming ? 'Please wait…' : (confirmModal.type === 'cancel' ? 'Confirm Cancel' : 'Confirm Complete')}
              </button>
            </div>
          </div>
        </div>
      )}
      {editOpen && selectedWorkOrder && (
        <EditWorkOrderModal
          workOrderId={selectedWorkOrder.id}
          open={editOpen}
          onClose={closeEdit}
          onSaved={() => { /* noop: handled inside modal via setWorkOrders/setSelectedWorkOrder */ }}
          setWorkOrders={setWorkOrders}
          setSelectedWorkOrder={setSelectedWorkOrder}
        />
      )}
    </div>
  );
}
