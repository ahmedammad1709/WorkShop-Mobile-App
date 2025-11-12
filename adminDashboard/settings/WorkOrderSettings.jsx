import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Arrow icon for back button
 */
function ArrowIcon({ className = "w-4 h-4" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
    );
}

/**
 * WorkOrderSettings.jsx
 * Dynamic Activity Types and Item Types management component
 * Displays 4 columns: Inspection, Repair, Maintenance, Diagnostics
 * Allows adding/deleting item types for each activity category
 */
export default function WorkOrderSettings({ onBack }) {
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [newItemInputs, setNewItemInputs] = useState({});
  const [newItemPriceInputs, setNewItemPriceInputs] = useState({});
  const [addingItems, setAddingItems] = useState({});
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [addingActivity, setAddingActivity] = useState(false);
  const [confirmDeleteActivityModal, setConfirmDeleteActivityModal] = useState({ open: false, activityId: null, activityName: '' });

  // Fetch activity items on component mount
  useEffect(() => {
    fetchActivityItems();
  }, []);

  const fetchActivityItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/activity-items`);
      const result = await response.json();
      
      if (result.success) {
        setActivityData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch activity items');
      }
    } catch (err) {
      console.error('Error fetching activity items:', err);
      setError(err.message);
      showToast('Failed to load activity items', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAddActivityModal = () => {
    setNewActivityName('');
    setShowAddActivityModal(true);
  };

  const closeAddActivityModal = () => {
    setShowAddActivityModal(false);
    setNewActivityName('');
  };

  const addActivityType = async () => {
    const name = newActivityName.trim();
    if (!name) {
      showToast('Please enter an activity type name', 'error');
      return;
    }
    try {
      setAddingActivity(true);
      const response = await fetch(`${API_URL}/activity-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (result.success) {
        showToast(result.message || 'Activity type added');
        closeAddActivityModal();
        await fetchActivityItems();
      } else {
        showToast(result.error || 'Failed to add activity type', 'error');
      }
    } catch (err) {
      console.error('Error adding activity type:', err);
      showToast('Failed to add activity type', 'error');
    } finally {
      setAddingActivity(false);
    }
  };

  const handleInputChange = (activityId, value) => {
    setNewItemInputs(prev => ({
      ...prev,
      [activityId]: value
    }));
  };

  const handlePriceInputChange = (activityId, value) => {
    setNewItemPriceInputs(prev => ({
      ...prev,
      [activityId]: value
    }));
  };

  const addNewItem = async (activityId, activityName) => {
    const itemName = newItemInputs[activityId]?.trim();
    const priceRaw = (newItemPriceInputs[activityId] ?? '').toString().trim();

    if (!itemName) {
      showToast('Please enter an item name', 'error');
      return;
    }
    if (priceRaw === '') {
      showToast('Please enter a price', 'error');
      return;
    }
    const price = parseFloat(priceRaw);
    if (Number.isNaN(price)) {
      showToast('Price must be a valid number', 'error');
      return;
    }

    try {
      setAddingItems(prev => ({ ...prev, [activityId]: true }));

      const response = await fetch(`${API_URL}/activity-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_id: activityId,
          item_name: itemName,
          price,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message);
        // Clear inputs
        setNewItemInputs(prev => ({
          ...prev,
          [activityId]: ''
        }));
        setNewItemPriceInputs(prev => ({
          ...prev,
          [activityId]: ''
        }));
        // Refresh data
        await fetchActivityItems();
      } else {
        throw new Error(result.error || 'Failed to add item');
      }
    } catch (err) {
      console.error('Error adding item:', err);
      showToast('Failed to add item', 'error');
    } finally {
      setAddingItems(prev => ({ ...prev, [activityId]: false }));
    }
  };

  const deleteItem = async (itemId, itemName, activityName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/activity-items/${itemId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        showToast(result.message);
        // Refresh data
        await fetchActivityItems();
      } else {
        throw new Error(result.error || 'Failed to delete item');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      showToast('Failed to delete item', 'error');
    }
  };

  const deleteActivityType = async (activityId, activityName) => {
    // Open themed confirmation modal instead of native confirm
    setConfirmDeleteActivityModal({ open: true, activityId, activityName });
  };

  const closeConfirmDeleteActivity = () => {
    setConfirmDeleteActivityModal({ open: false, activityId: null, activityName: '' });
  };

  const confirmDeleteActivity = async () => {
    const { activityId, activityName } = confirmDeleteActivityModal;
    if (!activityId) return;
    try {
      const response = await fetch(`${API_URL}/activity-types/${activityId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        showToast(result.message || 'Activity type deleted');
        await fetchActivityItems();
      } else {
        throw new Error(result.error || 'Failed to delete activity type');
      }
    } catch (err) {
      console.error('Error deleting activity type:', err);
      showToast('Failed to delete activity type', 'error');
    } finally {
      closeConfirmDeleteActivity();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border-t-2 border-[#29cc6a] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Activity Types Management</h2>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowIcon className="w-4 h-4 rotate-180" />
            Back
          </button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#29cc6a]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow border-t-2 border-[#29cc6a] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Activity Types Management</h2>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowIcon className="w-4 h-4 rotate-180" />
            Back
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-800">
              <h3 className="text-sm font-medium">Error loading activity items</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchActivityItems}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border-t-2 border-[#29cc6a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Activity Types Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage activity item types for work orders</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAddActivityModal}
            className="bg-[#29cc6a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#24b85f] transition-colors flex items-center cursor-pointer"
            title="Add Activity Type"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
            </svg>
            Add Activity Type
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
          >
            <ArrowIcon className="w-4 h-4 rotate-180" />
            Back
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Add Activity Type Modal */}
      {showAddActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md border border-gray-200">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add Activity Type</h3>
            </div>
            <div className="p-4 space-y-3">
              <input
                type="text"
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                placeholder="Enter activity type name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#29cc6a] focus:border-transparent"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeAddActivityModal}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={addingActivity}
                >
                  Cancel
                </button>
                <button
                  onClick={addActivityType}
                  disabled={addingActivity || !newActivityName.trim()}
                  className="px-4 py-2 text-sm rounded-md bg-[#29cc6a] text-white hover:bg-[#24b85f] disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {addingActivity ? 'Adding...' : 'Add activity type'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Activity Type Modal */}
      {confirmDeleteActivityModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md border border-gray-200">
            <div className="p-4 border-b bg-gradient-to-r from-[#29cc6a] to-[#24b85f] text-white rounded-t-lg">
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-700">
                Delete activity type "{confirmDeleteActivityModal.activityName}"? This will remove all its item types.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeConfirmDeleteActivity}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteActivity}
                  className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4-Column Layout */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activityData.map((activity) => (
            <div key={activity.activity_id} className="bg-white rounded-lg shadow-md border border-gray-200">
              {/* Column Header */}
              <div className="bg-gradient-to-r from-[#29cc6a] to-[#24b85f] text-white p-4 rounded-t-lg flex items-center justify-between">
                <h3 className="text-lg font-semibold">{activity.activity_name}</h3>
                <button
                  onClick={() => deleteActivityType(activity.activity_id, activity.activity_name)}
                  className="text-white/90 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-md transition-colors"
                  title="Delete Activity Type"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Items List */}
              <div className="p-4">
                <div className="space-y-2 mb-4 min-h-[200px]">
                  {activity.items.length > 0 ? (
                    activity.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm text-gray-700 flex-1">
                          {item.item_name}
                          {item.price !== undefined && item.price !== null && (
                            <span className="text-gray-500"> ({`$${Number(item.price).toFixed(2)}`})</span>
                          )}
                        </span>
                        <button
                          onClick={() => deleteItem(item.id, item.item_name, activity.activity_name)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p className="text-sm">No items yet</p>
                    </div>
                  )}
                </div>

                {/* Add New Item Form */}
                <div className="border-t pt-4">
                  <div className="flex flex-col space-y-2">
                    <input
                      type="text"
                      placeholder="Enter new item name"
                      value={newItemInputs[activity.activity_id] || ''}
                      onChange={(e) => handleInputChange(activity.activity_id, e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addNewItem(activity.activity_id, activity.activity_name);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#29cc6a] focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Enter price"
                      value={newItemPriceInputs[activity.activity_id] ?? ''}
                      onChange={(e) => handlePriceInputChange(activity.activity_id, e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addNewItem(activity.activity_id, activity.activity_name);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#29cc6a] focus:border-transparent"
                    />
                    <button
                      onClick={() => addNewItem(activity.activity_id, activity.activity_name)}
                      disabled={
                        addingItems[activity.activity_id] ||
                        !newItemInputs[activity.activity_id]?.trim() ||
                        (newItemPriceInputs[activity.activity_id] ?? '').toString().trim() === ''
                      }
                      className="w-full bg-[#29cc6a] text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-[#24b85f] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {addingItems[activity.activity_id] ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Item
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activityData.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Types Found</h3>
              <p className="text-gray-500">Activity types will appear here once they are configured in the database.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}