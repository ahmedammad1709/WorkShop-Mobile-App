import React, { useState } from "react";
import EditWorkCategory from "./EditWorkCategory";

/* -------------------------
   Icons
   ------------------------- */
function IconChevronDown({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function IconSort({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 6h6v2H3V6zm0 5h10v2H3v-2zm0 5h14v2H3v-2z" />
    </svg>
  );
}

/* -------------------------
   Sample activities data
   ------------------------- */
const ACTIVITIES = [
  { id: 1, name: "Engine Checkup" },
  { id: 2, name: "Air Conditioning" },
  { id: 3, name: "Brake" },
  { id: 4, name: "Oil Change" },
];

export default function EditWorkOrder({ settingsState, setSettingsState, onBack }) {
  const [search, setSearch] = useState("");
  const [fieldOpen, setFieldOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  const filtered = ACTIVITIES.filter((a) =>
    a.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  // If editing an activity, show the EditCategory component
  if (editingActivity) {
    return (
      <EditWorkCategory 
        activity={editingActivity} 
        onBack={() => {
          setEditingActivity(null);
          setSettingsState(prev => ({ ...prev, editingActivity: null }));
        }} 
      />
    );
  }

  return (
    <div className="w-full bg-white rounded-lg border-t-2 border-[#29cc6a]">
      {/* Controls */}
      <div className="p-4 flex gap-3 items-center">
        {/* Search */}
        <div className="flex-1 relative">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#29cc6a] focus:border-[#29cc6a]"
          />
        </div>

        {/* Created At Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setFieldOpen((v) => !v);
              setSortOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-white text-sm text-gray-700 hover:shadow-sm"
          >
            <span>Created at</span>
            <IconChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          {fieldOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-20">
              <button
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50"
                onClick={() => setFieldOpen(false)}
              >
                Created at
              </button>
              <button
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50"
                onClick={() => setFieldOpen(false)}
              >
                Name
              </button>
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setSortOpen((v) => !v);
              setFieldOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-white text-sm font-medium text-gray-700 hover:shadow-sm"
          >
            <IconSort className="w-4 h-4 text-gray-600" />
            <span>Sort</span>
          </button>
          {sortOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-20 p-2">
              <div className="text-xs text-gray-500 px-2 pb-2">Order</div>
              <button
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50"
                onClick={() => setSortOpen(false)}
              >
                Newest first
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50"
                onClick={() => setSortOpen(false)}
              >
                Oldest first
              </button>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-200">
        {filtered.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center justify-between px-4 py-4 hover:bg-gray-50"
          >
            <span className="text-sm font-semibold text-gray-900 text-base">{activity.name}</span>
            <button 
              className="text-sm font-medium text-[#29cc6a] hover:underline"
              onClick={() => {
                setEditingActivity(activity);
                setSettingsState(prev => ({ ...prev, editingActivity: activity }));
              }}
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
