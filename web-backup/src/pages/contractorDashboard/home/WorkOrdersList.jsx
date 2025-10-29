import React from "react";
import { Download } from "lucide-react";

export default function WorkOrdersList({ workOrders, selectedWorkOrder, setSelectedWorkOrder, onDownloadInvoice, onOrdersClick }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">List Of Work Orders</h3>
        <button className="text-sm text-green-600 hover:underline cursor-pointer">See all</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {workOrders.map((wo) => (
          <div
            key={wo.id}
            onClick={() => { setSelectedWorkOrder(wo); if (onOrdersClick) onOrdersClick(); }}
            className={`bg-white rounded-xl shadow p-3 cursor-pointer hover:shadow-lg transition ${selectedWorkOrder?.id === wo.id ? "ring-2 ring-green-100" : ""}`}
          >
            <div className="w-full h-32 sm:h-36 overflow-hidden rounded-md mb-3">
              <img src={wo.image + "&auto=format&fit=crop&w=800&q=60"} alt={`#${wo.id}`} className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">#{wo.id}</div>
                <div className="text-xs text-gray-500 truncate">{wo.make} · {wo.year}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-xs text-gray-400">Open</div>
                {onDownloadInvoice && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadInvoice(wo);
                    }}
                    className="p-1 text-gray-500 hover:text-green-600 transition-colors cursor-pointer"
                    title="Download Invoice"
                  >
                    <Download size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
