import React, { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";

export default function ActivityDetails({ activity, setActivity, paintCodes, setPaintCodes }) {
  const [showPaintCode, setShowPaintCode] = useState(false);
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableRepairTypes, setAvailableRepairTypes] = useState([]);

  // Fetch activity items on component mount
  useEffect(() => {
    fetchActivityItems();
  }, []);

  // Update available repair types when activity type changes
  useEffect(() => {
    updateAvailableRepairTypes();
  }, [activity.type, activityData]);

  const fetchActivityItems = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/activity-items`);

      const data = await response.json();

      if (data.success) {
        setActivityData(data.data);
      } else {
        console.error('Failed to fetch activity items:', data.error);
      }
    } catch (error) {
      console.error('Error fetching activity items:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailableRepairTypes = () => {
    const selectedActivity = activityData.find(
      act => act.activity_name === activity.type
    );

    if (selectedActivity && selectedActivity.items.length > 0) {
      setAvailableRepairTypes(selectedActivity.items);
    } else {
      setAvailableRepairTypes([]);
    }

    // Reset selected repair types when activity type changes
    setActivity(prev => ({
      ...prev,
      selectedRepairTypes: []
    }));
  };

  const handleActivityChange = (field, value) => {
    setActivity(prev => ({ ...prev, [field]: value }));
  };

  const handleRepairChange = (itemId, itemName, checked) => {
    setActivity(prev => {
      const currentSelected = prev.selectedRepairTypes || [];

      if (checked) {
        // Add to selected repair types
        return {
          ...prev,
          selectedRepairTypes: [...currentSelected, { id: itemId, name: itemName }]
        };
      } else {
        // Remove from selected repair types
        return {
          ...prev,
          selectedRepairTypes: currentSelected.filter(item => item.id !== itemId)
        };
      }
    });
  };

  const togglePaintCode = () => {
    setShowPaintCode(!showPaintCode);
  };

  const addPaintCode = () => {
    setPaintCodes(prev => [...prev, { id: Date.now(), code: "", quantity: 1, triStage: false }]);
  };

  const updatePaintCode = (id, field, value) => {
    setPaintCodes(prev => prev.map(pc =>
      pc.id === id ? { ...pc, [field]: value } : pc
    ));
  };

  const removePaintCode = (id) => {
    setPaintCodes(prev => prev.filter(pc => pc.id !== id));
  };

  const changePaintCodeQuantity = (id, delta) => {
    setPaintCodes(prev => prev.map(pc =>
      pc.id === id ? { ...pc, quantity: Math.max(1, pc.quantity + delta) } : pc
    ));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Activity Details</h3>

      {/* Activity Type Dropdown - Modern Design */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Activity Type</label>
        <div className="relative">
          <select
            value={activity.type}
            onChange={(e) => handleActivityChange("type", e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none text-gray-700 font-medium transition-all duration-200 hover:border-gray-300"
          >
            <option value="Inspection">Inspection</option>
            <option value="Repair">Repair</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Diagnostics">Diagnostics</option>
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Short Quote Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Short Quote</label>
        <input
          type="text"
          placeholder="Brief description of the work"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      {/* Activity Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Activity Description</label>
        <textarea
          value={activity.description}
          onChange={(e) => handleActivityChange("description", e.target.value)}
          placeholder="Detailed description of the activity..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all duration-200"
        />
      </div>

      {/* Repair Types - Dynamic Checkbox Styling */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Repair Types</h4>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#29cc6a]"></div>
            <span className="ml-2 text-sm text-gray-500">Loading repair types...</span>
          </div>
        ) : availableRepairTypes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {availableRepairTypes.map((repairType) => {
              const isSelected = (activity.selectedRepairTypes || []).some(
                selected => selected.id === repairType.id
              );

              return (
                <label key={repairType.id} className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleRepairChange(repairType.id, repairType.item_name, e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${isSelected
                        ? 'bg-[#29cc6a] border-[#29cc6a]'
                        : 'border-gray-300 group-hover:border-gray-400'
                      }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                    {repairType.item_name}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">No repair types available for this activity.</p>
          </div>
        )}
      </div>

      {/* Add Paint Code Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <h4 className="text-sm font-medium text-gray-700">Add Paint Code</h4>
          <button
            onClick={togglePaintCode}
            className="w-8 h-8 rounded-full bg-[#29cc6a] text-white flex items-center justify-center hover:bg-[#22b85a] transition-colors duration-200 shadow-sm cursor-pointer"
          >
            {showPaintCode ? <Minus size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {showPaintCode && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            {/* Add Paint Code Button */}
            <button
              onClick={addPaintCode}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#29cc6a] hover:text-[#29cc6a] transition-colors duration-200 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Paint Code</span>
            </button>

            {/* Paint Code Entries */}
            {paintCodes.map((paintCode) => (
              <div key={paintCode.id} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                {/* Code Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Code</label>
                  <input
                    type="text"
                    value={paintCode.code}
                    onChange={(e) => updatePaintCode(paintCode.id, "code", e.target.value)}
                    placeholder="Enter paint code"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Quantity Counter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => changePaintCodeQuantity(paintCode.id, -1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-12 text-center font-medium">{paintCode.quantity}</span>
                    <button
                      onClick={() => changePaintCodeQuantity(paintCode.id, 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Tri Stage Checkbox */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={paintCode.triStage}
                        onChange={(e) => updatePaintCode(paintCode.id, "triStage", e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${paintCode.triStage
                          ? 'bg-[#29cc6a] border-[#29cc6a]'
                          : 'border-gray-300 group-hover:border-gray-400'
                        }`}>
                        {paintCode.triStage && (
                          <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">Tri Stage</span>
                  </label>

                  {/* Remove Paint Code Button */}
                  <button
                    onClick={() => removePaintCode(paintCode.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors duration-200 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
