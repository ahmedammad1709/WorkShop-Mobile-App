import React from 'react';

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
  return (
    <div className="bg-white rounded-lg shadow border-t-2 border-[#29cc6a]">
      {/* Dropdown */}
      <div className="flex items-center justify-between px-6 py-5">
        <span className="text-base text-gray-500 font-semibold">Select Service</span>
        <ArrowIcon className="text-black" />
      </div>

      {/* Divider List */}
      <div className="divide-y divide-gray-200">
        <div className="px-6 py-5 text-base text-gray-500 font-semibold hover:bg-gray-50 cursor-pointer">
          Regular Work Price
        </div>
        <div className="px-6 py-5 text-base text-gray-500 font-semibold hover:bg-gray-50 cursor-pointer">
          Special Work Price
        </div>
        <div className="px-6 py-5 text-base text-gray-500 font-semibold hover:bg-gray-50 cursor-pointer">
          Regular Work Margin
        </div>
        <div className="px-6 py-5 text-base text-gray-500 font-semibold hover:bg-gray-50 cursor-pointer">
          Special Work Margin
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 px-6 py-4">
        <button className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200">
          Cancel
        </button>
        <button className="px-4 py-2 rounded border border-[#29cc6a] bg-[#29cc6a] text-white text-sm font-medium hover:bg-[#22b85f]">
          Update
        </button>
      </div>
    </div>
  );
}
