// WorkOrder.jsx
import React from "react";
import WorkOrderSettings from "./WorkOrderSettings";

/**
 * WorkOrder.jsx
 * Directly renders the Activity Types Management component
 * Removes all sub-options and shows WorkOrderSettings immediately
 * Accent color: #29cc6a
 */

export default function WorkOrder({ settingsState, setSettingsState, onBack }) {
    // Directly render the WorkOrderSettings component (Activity Types Management)
    return <WorkOrderSettings onBack={onBack} />;
}
