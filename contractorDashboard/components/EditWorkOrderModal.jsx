import React, { useEffect, useState } from "react";

export default function EditWorkOrderModal({ workOrderId, open, onClose, onSaved, setWorkOrders, setSelectedWorkOrder }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [vehicle, setVehicle] = useState({ make: '', model: '', year: '', vin: '', odometer: '', trim: '' });
  const [activity, setActivity] = useState({ type: 'Inspection', description: '', selectedRepairTypes: [] });
  const [items, setItems] = useState([]); // {description, qty, unit_price}
  const [workTypes, setWorkTypes] = useState([]); // {id, title}
  const [photos, setPhotos] = useState([]); // {url, name}

  const subtotal = items.reduce((s, it) => s + (Number(it.qty || 0) * Number(it.unit_price || 0)), 0);
  const tax = +(subtotal * 0.12).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const base = (API_URL || '').replace(/\/+$/, '');
  const getEndpoint = (id) => (/\/api\/?$/.test(base) ? `${base}/work-orders/${id}` : `${base}/api/work-orders/${id}`);

  useEffect(() => {
    if (!open || !workOrderId) return;
    let mounted = true;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const path = (/\/api\/?$/.test(base) ? `${base}/work-orders/${workOrderId}` : `${base}/api/work-orders/${workOrderId}`);
        const res = await fetch(path);
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to load work order');
        const o = data.order || {};
        if (mounted) {
          setCustomer({ name: o.customer_name || '', phone: o.customer_phone || '' });
          setVehicle({
            make: o.vehicle_make || '',
            model: o.vehicle_model || '',
            year: o.vehicle_year || '',
            vin: o.vehicle_vin || '',
            odometer: o.vehicle_odometer || '',
            trim: o.vehicle_trim || '',
          });
          setActivity({ type: o.activity_type || 'Inspection', description: o.activity_description || '', selectedRepairTypes: o.repairs_json || [] });
          setItems((data.items || []).map((it) => ({ description: it.description, qty: Number(it.qty || 1), unit_price: Number(it.unit_price || 0) })));
          setWorkTypes((data.work_types || []).map((wt) => ({ id: wt.work_type_id || wt.id || 'unknown', title: wt.work_type_title || wt.title || '' })));
          setPhotos((data.photos || []).map((ph) => ({ url: ph.url || '', name: ph.name || '' })));
        }
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load work order');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, workOrderId]);

  const addItem = () => setItems((prev) => [...prev, { description: '', qty: 1, unit_price: 0 }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx, patch) => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));

  // Work Types editing removed from UI per request; keeping state for payload persistence

  const clearError = (key) => setFieldErrors(prev => {
    const { [key]: _ignored, ...rest } = prev;
    return rest;
  });

  const validate = () => {
    const fe = {};
    const isEmptyStr = (s) => !String(s ?? '').trim();

    // Customer
    if (isEmptyStr(customer.name)) fe['customer.name'] = true;
    if (isEmptyStr(customer.phone)) fe['customer.phone'] = true;

    // Vehicle
    ['make','model','year','vin','odometer','trim'].forEach((f) => {
      if (isEmptyStr(vehicle[f])) fe[`vehicle.${f}`] = true;
    });

    // Activity
    if (isEmptyStr(activity.type)) fe['activity.type'] = true;
    if (isEmptyStr(activity.description)) fe['activity.description'] = true;

    // Items
    if (!items.length) {
      fe['items.none'] = true;
    }
    items.forEach((it, idx) => {
      if (isEmptyStr(it.description)) fe[`items.${idx}.description`] = true;
      const qty = Number(it.qty);
      const price = Number(it.unit_price);
      if (!Number.isFinite(qty) || qty <= 0) fe[`items.${idx}.qty`] = true;
      if (!Number.isFinite(price) || price <= 0) fe[`items.${idx}.unit_price`] = true;
    });

    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const saveChanges = async () => {
    if (!workOrderId) return;
    try {
      if (!validate()) {
        setError('Please fill all required fields (highlighted).');
        return;
      }
      setSaving(true);
      setError('');
      const payload = {
        customer,
        vehicle,
        activity,
        quote: { subtotal, tax, total },
        items,
        work_types: workTypes,
        photos,
      };
      const res = await fetch(getEndpoint(workOrderId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Save failed');
      // Refresh selected order client-side
      const updated = {
        id: workOrderId,
        make: vehicle.make,
        year: vehicle.year,
        status: (typeof setSelectedWorkOrder === 'function' ? undefined : undefined),
      };
      if (typeof setWorkOrders === 'function') {
        setWorkOrders((prev) => prev.map((o) => o.id === workOrderId ? { ...o, customer_name: customer.name, customer_phone: customer.phone, vehicle_make: vehicle.make, vehicle_model: vehicle.model, vehicle_year: vehicle.year, vehicle_vin: vehicle.vin, quote_total: total } : o));
      }
      if (typeof setSelectedWorkOrder === 'function') {
        setSelectedWorkOrder((prev) => prev && prev.id === workOrderId ? { ...prev, make: vehicle.make, year: vehicle.year, customer_name: customer.name, customer_phone: customer.phone, quote_total: total } : prev);
      }
      onSaved && onSaved();
      onClose && onClose();
    } catch (e) {
      setError(e.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
      <div className="relative z-[1001] bg-white rounded-xl w-full max-w-2xl p-4 sm:p-6 shadow-lg mx-4 sm:mx-6 max-h-[85vh] overflow-y-auto" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold">Edit Work Order</h3>
          <button onClick={onClose} className="px-3 py-1 rounded border cursor-pointer">Close</button>
        </div>
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : (
          <div className="space-y-4">
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div>
              <div className="text-sm font-medium mb-2">Customer</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={customer.name} onChange={(e)=>{clearError('customer.name'); setCustomer(s=>({...s, name:e.target.value}));}} className={`p-2 border rounded ${fieldErrors['customer.name'] ? 'border-red-500' : ''}`} placeholder="Name" />
                <input value={customer.phone} onChange={(e)=>{clearError('customer.phone'); setCustomer(s=>({...s, phone:e.target.value}));}} className={`p-2 border rounded ${fieldErrors['customer.phone'] ? 'border-red-500' : ''}`} placeholder="Phone" />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Vehicle</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={vehicle.make} onChange={(e)=>{clearError('vehicle.make'); setVehicle(s=>({...s, make:e.target.value}));}} className={`p-2 border rounded ${fieldErrors['vehicle.make'] ? 'border-red-500' : ''}`} placeholder="Make" />
                <input value={vehicle.model} onChange={(e)=>{clearError('vehicle.model'); setVehicle(s=>({...s, model:e.target.value}));}} className={`p-2 border rounded ${fieldErrors['vehicle.model'] ? 'border-red-500' : ''}`} placeholder="Model" />
                <input value={vehicle.year} onChange={(e)=>{clearError('vehicle.year'); setVehicle(s=>({...s, year:e.target.value}));}} className={`p-2 border rounded ${fieldErrors['vehicle.year'] ? 'border-red-500' : ''}`} placeholder="Year" />
                <input value={vehicle.vin} onChange={(e)=>{clearError('vehicle.vin'); setVehicle(s=>({...s, vin:e.target.value}));}} className={`p-2 border rounded ${fieldErrors['vehicle.vin'] ? 'border-red-500' : ''}`} placeholder="VIN" />
                <input value={vehicle.odometer} onChange={(e)=>{clearError('vehicle.odometer'); setVehicle(s=>({...s, odometer:e.target.value}));}} className={`p-2 border rounded ${fieldErrors['vehicle.odometer'] ? 'border-red-500' : ''}`} placeholder="Odometer" />
                <input value={vehicle.trim} onChange={(e)=>{clearError('vehicle.trim'); setVehicle(s=>({...s, trim:e.target.value}));}} className={`p-2 border rounded ${fieldErrors['vehicle.trim'] ? 'border-red-500' : ''}`} placeholder="Trim" />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Activity</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={activity.type} onChange={(e)=>{clearError('activity.type'); setActivity(s=>({...s, type:e.target.value}));}} className={`p-2 border rounded ${fieldErrors['activity.type'] ? 'border-red-500' : ''}`} placeholder="Type" />
                <input value={activity.description} onChange={(e)=>{clearError('activity.description'); setActivity(s=>({...s, description:e.target.value}));}} className={`p-2 border rounded ${fieldErrors['activity.description'] ? 'border-red-500' : ''}`} placeholder="Description" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Items</div>
                <button onClick={addItem} className="px-2 py-1 text-sm rounded border cursor-pointer">Add Item</button>
              </div>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <input value={it.description} onChange={(e)=>{clearError(`items.${idx}.description`); updateItem(idx,{description:e.target.value});}} className={`col-span-1 sm:col-span-6 p-2 border rounded ${fieldErrors[`items.${idx}.description`] ? 'border-red-500' : ''}`} placeholder="Description" />
                    <input type="number" value={it.qty} onChange={(e)=>{clearError(`items.${idx}.qty`); updateItem(idx,{qty:Number(e.target.value)});}} className={`col-span-1 sm:col-span-2 p-2 border rounded ${fieldErrors[`items.${idx}.qty`] ? 'border-red-500' : ''}`} placeholder="Qty" />
                    <input type="number" step="0.01" value={it.unit_price} onChange={(e)=>{clearError(`items.${idx}.unit_price`); updateItem(idx,{unit_price:Number(e.target.value)});}} className={`col-span-1 sm:col-span-3 p-2 border rounded ${fieldErrors[`items.${idx}.unit_price`] ? 'border-red-500' : ''}`} placeholder="Unit Price" />
                    <button onClick={()=>removeItem(idx)} className="col-span-1 sm:col-span-1 px-2 py-1 rounded border text-red-600 cursor-pointer w-full sm:w-auto">Del</button>
                  </div>
                ))}
                {fieldErrors['items.none'] && (
                  <div className="text-xs text-red-600">Please add at least one item.</div>
                )}
              </div>
            </div>
            {/* Work Types section removed per request */}
            <div className="flex flex-wrap justify-end gap-2 sm:gap-6">
              <div className="text-sm text-gray-500">Subtotal</div>
              <div className="text-sm font-medium">${subtotal.toFixed(2)}</div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 sm:gap-6">
              <div className="text-sm text-gray-500">Tax (12%)</div>
              <div className="text-sm font-medium">${tax.toFixed(2)}</div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 sm:gap-6 border-t pt-2">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-lg font-semibold">${total.toFixed(2)}</div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
              <button onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50 cursor-pointer w-full sm:w-auto">Cancel</button>
              <button onClick={saveChanges} disabled={saving} className="px-4 py-2 rounded-md bg-green-600 text-white cursor-pointer disabled:opacity-50 w-full sm:w-auto">{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}