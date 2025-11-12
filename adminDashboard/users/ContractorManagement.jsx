// src/components/ContractorManagement.jsx
import React from 'react';

export default function ContractorManagement({ onBack }) {
  return (
    <div className="p-4 bg-gray-50 h-full">
      <div className="flex items-center gap-2 mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <span>←</span> Back
        </button>
        <h2 className="text-2xl font-bold">Contractor Management</h2>
      </div>
      {/* Add your contractor management content here */}
    </div>
  );
}