import React from "react";
import { Plus } from "lucide-react";

export default function OngoingWork({ ongoing, onCreateClick }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Ongoing Work</h3>
        <button className="text-sm text-gray-500 cursor-pointer">See all</button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {ongoing.map((o) => (
          <div key={o.id} className="min-w-[140px] bg-white rounded-xl shadow p-3 flex-none">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img src={o.avatar + "&auto=format&fit=crop&w=200&q=60"} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">#{o.id}</div>
                <div className="text-xs text-gray-500">{o.title}</div>
              </div>
            </div>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-400" style={{ width: `${o.progress}%` }} />
            </div>
          </div>
        ))}

        {/* Add new ongoing */}
        <div className="min-w-[140px] flex-none flex items-center justify-center">
          <button
            onClick={onCreateClick}
            className="w-32 h-32 bg-white rounded-full shadow-lg flex flex-col items-center justify-center gap-2 text-green-600 cursor-pointer"
          >
            <Plus size={20} />
            <div className="text-xs">New</div>
          </button>
        </div>
      </div>
    </div>
  );
}
