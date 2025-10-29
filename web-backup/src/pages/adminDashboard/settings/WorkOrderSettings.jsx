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
  const [addingItems, setAddingItems] = useState({});

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

  const handleInputChange = (activityId, value) => {
    setNewItemInputs(prev => ({
      ...prev,
      [activityId]: value
    }));
  };

  const addNewItem = async (activityId, activityName) => {
    const itemName = newItemInputs[activityId]?.trim();
    
    if (!itemName) {
      showToast('Please enter an item name', 'error');
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
          description: ''
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        showToast(result.message);
        // Clear input
        setNewItemInputs(prev => ({
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
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowIcon className="w-4 h-4 rotate-180" />
          Back
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* 4-Column Layout */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activityData.map((activity) => (
            <div key={activity.activity_id} className="bg-white rounded-lg shadow-md border border-gray-200">
              {/* Column Header */}
              <div className="bg-gradient-to-r from-[#29cc6a] to-[#24b85f] text-white p-4 rounded-t-lg">
                <h3 className="text-lg font-semibold text-center">{activity.activity_name}</h3>
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
                        <span className="text-sm text-gray-700 flex-1">{item.item_name}</span>
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
                    <button
                      onClick={() => addNewItem(activity.activity_id, activity.activity_name)}
                      disabled={addingItems[activity.activity_id] || !newItemInputs[activity.activity_id]?.trim()}
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