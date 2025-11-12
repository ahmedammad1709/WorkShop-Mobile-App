import React, { useEffect, useState } from 'react';

function ArrowIcon({ className = '' }) {
  return (
    <svg
      width="13"
      height="8"
      viewBox="0 0 13 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M5.23748 7.47826L0.55106 2.95652C-0.0197223 2.4058 -0.147097 1.77565 0.168937 1.06609C0.48497 0.356522 1.04794 0.00115942 1.85785 0H11.1406C11.9517 0 12.5153 0.355362 12.8313 1.06609C13.1473 1.77681 13.0194 2.40696 12.4474 2.95652L7.76094 7.47826C7.5807 7.65217 7.38543 7.78261 7.17514 7.86956C6.96485 7.95652 6.73954 8 6.49921 8C6.25888 8 6.03358 7.95652 5.82329 7.86956C5.613 7.78261 5.41773 7.65217 5.23748 7.47826Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function LaborRates() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const formatCurrency = (val) => `$${(Number(val) || 0).toFixed(2)}`;

  const openForm = () => {
    setShowForm(true);
    setError('');
  };

  const cancelForm = () => {
    setShowForm(false);
    setNewName('');
    setNewPrice('');
    setError('');
  };

  const createItem = () => {
    const name = (newName || '').trim();
    const priceNum = parseFloat(String(newPrice).trim());
    if (!name) {
      setError('Name is required.');
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Enter a valid non-negative price.');
      return;
    }
    setLoading(true);
    fetch('/api/spare-part-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price: +priceNum.toFixed(2) }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.success) throw new Error(data.error || 'Failed to create');
        setItems((prev) => [data.item, ...prev]);
        cancelForm();
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const startEdit = (it) => {
    setEditingId(it.id);
    setEditName(it.name);
    setEditPrice(String(it.price));
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPrice('');
  };

  const saveEdit = (id) => {
    const name = (editName || '').trim();
    const priceNum = parseFloat(String(editPrice).trim());
    if (!name) {
      setError('Name is required.');
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Enter a valid non-negative price.');
      return;
    }
    setLoading(true);
    fetch(`/api/spare-part-prices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price: +priceNum.toFixed(2) }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.success) throw new Error(data.error || 'Failed to update');
        setItems((prev) => prev.map((it) => (it.id === id ? data.item : it)));
        cancelEdit();
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const deleteItem = (id) => {
    setLoading(true);
    fetch(`/api/spare-part-prices/${id}`, { method: 'DELETE' })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok || data.success === false) throw new Error(data.error || 'Failed to delete');
        setItems((prev) => prev.filter((it) => it.id !== id));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetch('/api/spare-part-prices')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.success) throw new Error(data.error || 'Failed to load items');
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-lg shadow border-t-2 border-[#29cc6a]">
      {/* Header with action */}
      <div className="flex items-center justify-between px-6 py-5">
        <span className="text-base text-gray-800 font-semibold">Spare Parts</span>
        <button
          type="button"
          onClick={openForm}
          className="px-3 py-2 rounded border border-[#29cc6a] bg-[#29cc6a] text-white text-sm font-medium hover:bg-[#22b85f]"
        >
          Add Spare Parts
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="px-6 pb-4">
          <div className="bg-gray-50 rounded p-4 border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Air Filter"
                  className="w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-[#29cc6a]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="e.g., 49.99"
                  className="w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-[#29cc6a]"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={createItem}
                  className="px-4 py-2 rounded bg-[#29cc6a] text-white text-sm font-medium hover:bg-[#22b85f]"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
            {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
            {loading && <div className="mt-2 text-xs text-gray-500">Working...</div>}
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="divide-y divide-gray-200">
        {items.length === 0 && !loading && (
          <div className="px-6 py-5 text-sm text-gray-500">No Spare parts yet. Click "Add Spare Parts" to create one.</div>
        )}
        {loading && (
          <div className="px-6 py-5 text-sm text-gray-500">Loading...</div>
        )}
        {items.map((it) => (
          <div key={it.id} className="px-6 py-5 flex items-center justify-between">
            <div className="flex-1">
              {editingId === it.id ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-[#29cc6a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-[#29cc6a]"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(it.id)}
                      className="px-4 py-2 rounded bg-[#29cc6a] text-white text-xs font-medium hover:bg-[#22b85f]"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="text-base text-gray-800 font-semibold">{it.name}</span>
                  <span className="text-xs text-gray-500">Unit: {formatCurrency(it.price)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {editingId !== it.id && (
                <button
                  type="button"
                  onClick={() => startEdit(it)}
                  className="px-3 py-2 rounded bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 border border-blue-200"
                >
                  Edit
                </button>
              )}
              <span className="text-sm font-medium text-gray-800">Total: {formatCurrency(it.price)}</span>
              <button
                type="button"
                onClick={() => deleteItem(it.id)}
                className="px-3 py-2 rounded bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 border border-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
