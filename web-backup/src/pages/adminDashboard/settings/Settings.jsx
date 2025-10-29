// Settings.jsx
import React, { useState } from "react";
import LaborRates from "./LaborRates";
import PriceManagement from "./PriceManagement";
import WorkOrder from "./WorkOrder";
import ProfileSettings from "./ProfileSettings";

/**
 * Arrow icon as specified
 */
function ArrowIcon({ className = "" }) {
    return (
        <svg
            className={className}
            viewBox="0 0 14 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M0.599866 19.9999L8.59989 11.9999L0.599868 3.9999L2.19987 0.799886L13.3999 11.9999L2.19987 23.2L0.599866 19.9999Z"
                fill="currentColor"
            />
        </svg>
    );
}

/**
 * Settings.jsx
 * React + Vite + Tailwind component that matches the Settings list design.
 * Accent color: #29cc6a
 */

export default function Settings({ settingsState, setSettingsState }) {

    const items = [
        "Profile Settings",
        "Work Order Settings",
        "Price/Margin Management",
        "Labor Rates",
        "Language",
    ];

    // If Profile Settings is selected, show ProfileSettings
    if (settingsState.selectedSetting === "Profile Settings") {
        return <ProfileSettings onBack={() => setSettingsState(prev => ({ ...prev, selectedSetting: null }))} />;
    }
    // If Labor Rates is selected, show LaborRates
    if (settingsState.selectedSetting === "Labor Rates") {
        return <LaborRates onBack={() => setSettingsState(prev => ({ ...prev, selectedSetting: null }))} />;
    }
    if (settingsState.selectedSetting === "Price/Margin Management") {
        return <PriceManagement onBack={() => setSettingsState(prev => ({ ...prev, selectedSetting: null }))} />;
    }
    if (settingsState.selectedSetting === "Work Order Settings") {
        return <WorkOrder 
          settingsState={settingsState}
          setSettingsState={setSettingsState}
          onBack={() => setSettingsState(prev => ({ ...prev, selectedSetting: null }))} 
        />;
    }

    return (
        <div className="bg-white rounded-lg shadow border-t-2 border-[#29cc6a] shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-200">
                {items.map((item, idx) => (
                    <li key={idx}>
                        <button
                            type="button"
                            onClick={() => setSettingsState({ selectedSetting: item })}
                            className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold hover:bg-gray-50 focus:outline-none"
                        >
                            <span className="text-base text-gray-900">{item}</span>
                            <ArrowIcon className="w-3.5 h-3.5 text-gray-800" />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
