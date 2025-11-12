import React, { useEffect, useState } from "react";
import { Plus, Minus } from "lucide-react";

export default function WorkTypes({ workTypes = [], toggleWorkTypeSelection, otherText = '', onOtherTextChange }) {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/work-type-prices');
        const data = await res.json();
        if (res.ok && data?.success && Array.isArray(data.items)) {
          const mapped = data.items.map((it) => ({ id: it.id, title: it.name, price: Number(it.price || 0) }));
          if (mounted) setCatalog(mapped);
        } else {
          throw new Error(data?.error || 'Failed to load work types');
        }
      } catch (e) {
        console.error('Failed to load work types', e);
        if (mounted) setError(e.message || 'Failed to load work types');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const resolveParentMatch = (item) => {
    const lower = String(item.title || '').toLowerCase();
    return workTypes.find((w) => {
      const wTitle = String(w.title || '').toLowerCase();
      return wTitle === lower || String(w.id) === String(item.id);
    });
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-green-600 mb-3">Add Work Type</h3>
      {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(catalog || []).map((item) => {
          const match = resolveParentMatch(item);
          const selected = Boolean(match?.selected);
          const idToToggle = match?.id;
          return (
            <div
              key={item.id}
              className={`rounded-lg p-3 flex flex-col gap-3 transition-colors ${
                selected ? 'bg-green-50 border-2 border-green-400' : 'bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium flex-1 min-w-0 truncate pr-2">{item.title}</div>
                <div className="text-xs text-gray-500 mr-2">${Number(item.price || 0).toFixed(2)}</div>
                <button
                  onClick={() => {
                    if (idToToggle !== undefined) {
                      toggleWorkTypeSelection(idToToggle);
                    } else {
                      // Fallback: use "others" with prefilled text when no parent mapping exists
                      onOtherTextChange && onOtherTextChange(item.title);
                      toggleWorkTypeSelection && toggleWorkTypeSelection('others');
                    }
                  }}
                  className={`p-2 rounded-md border transition-colors cursor-pointer flex-shrink-0 ${
                    selected ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {selected ? <Minus size={16} /> : <Plus size={16} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {workTypes.find((w) => w.id === 'others')?.selected && (
        <div className="mt-4">
          <input
            type="text"
            value={otherText}
            onChange={(e) => onOtherTextChange && onOtherTextChange(e.target.value)}
            placeholder="Please specify the work type"
            className={`w-full p-2 rounded border ${
              (otherText || '').trim() ? 'border-green-400' : 'border-red-400'
            } focus:outline-none focus:ring-2 focus:ring-green-300`}
          />
          <p className="text-xs mt-1 ${ (otherText || '').trim() ? 'text-gray-500' : 'text-red-600' }">{(otherText || '').trim() ? 'Provide more details if needed.' : 'This field is required when selecting Other.'}</p>
        </div>
      )}
    </div>
  );
}
