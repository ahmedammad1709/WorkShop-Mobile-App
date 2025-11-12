import React, { useEffect, useState } from "react";
import { Plus, Minus } from "lucide-react";

export default function SpareParts({ spareCatalog, partsCart, addPartToCart, changeCartQty }) {
  const [catalog, setCatalog] = useState(spareCatalog || []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/spare-part-prices');
        const data = await res.json();
        if (res.ok && data?.success && Array.isArray(data.items)) {
          const mapped = data.items.map((it) => ({ id: it.id, title: it.name, price: Number(it.price || 0) }));
          if (mounted) setCatalog(mapped);
        }
      } catch (e) {
        console.error('Failed to load spare parts', e);
      }
    })();
    return () => { mounted = false; };
  }, []);
  return (
    <div className="flex flex-col lg:flex-row lg:gap-6">
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-green-600 mb-3">Add Spare Parts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(catalog || []).map((p) => (
            <div key={p.id} className="bg-white rounded-lg p-3 shadow-sm flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-sm font-medium truncate">{p.title}</div>
                <div className="text-xs text-gray-400">${p.price.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => addPartToCart(p)} className="px-3 py-1 bg-green-50 text-green-600 rounded cursor-pointer text-sm">
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-80 mt-6 lg:mt-0">
        <h4 className="text-sm font-semibold mb-2">Parts in Order</h4>
        <div className="space-y-2">
          {partsCart.length === 0 && <div className="text-xs text-gray-400">No parts added yet</div>}
          {partsCart.map((c) => (
            <div key={c.id} className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm">
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-sm font-medium truncate">{c.title}</div>
                <div className="text-xs text-gray-400">${c.price.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => changeCartQty(c.id, -1)} className="p-1 bg-gray-100 rounded cursor-pointer">
                  <Minus size={14} />
                </button>
                <div className="w-6 text-center text-sm">{c.qty}</div>
                <button onClick={() => changeCartQty(c.id, 1)} className="p-1 bg-gray-100 rounded cursor-pointer">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
