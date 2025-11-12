import React from "react";

export default function Quote({ quoteItems, subtotal, tax, grandTotal }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-green-600 mb-3">Quote</h3>

      <div className="bg-gray-50 rounded p-3">
        <div className="grid grid-cols-6 gap-2 text-xs text-gray-500 font-medium mb-2">
          <div className="col-span-3">Description</div>
          <div className="text-right">Qty</div>
          <div className="text-right">Unit</div>
          <div className="text-right">Total</div>
        </div>

        <div className="space-y-2">
          {quoteItems.length === 0 && (
            <div className="text-xs text-gray-400">No items yet. Add parts or work types to build the quote.</div>
          )}
          {quoteItems.map((it) => (
            <div key={it.id} className="grid grid-cols-6 gap-2 items-center bg-white rounded p-2 shadow-sm">
              <div className="col-span-3 text-sm">{it.title}</div>
              <div className="text-right">{it.qty}</div>
              <div className="text-right">${it.unit?.toFixed(2)}</div>
              <div className="text-right font-medium">${(it.total || 0).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-6 pr-2">
          <div className="text-sm text-gray-500">Subtotal</div>
          <div className="text-sm font-medium">${subtotal.toFixed(2)}</div>
        </div>
        <div className="mt-1 flex justify-end gap-6 pr-2">
          <div className="text-sm text-gray-500">Tax (12%)</div>
          <div className="text-sm font-medium">${tax.toFixed(2)}</div>
        </div>
        <div className="mt-2 flex justify-end gap-6 pr-2 pb-2 border-t pt-2">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-lg font-semibold">${grandTotal.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
