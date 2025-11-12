import React from "react";
import { Check, Trash2 } from "lucide-react";

export default function Notifications({ notifications = [], onMarkRead, onClearAll, onClearOne }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={onMarkRead} 
            className="text-xs text-gray-600 hover:text-green-600 flex items-center gap-1 cursor-pointer"
          >
            <Check size={14} /> Mark all as read
          </button>
          <button 
            onClick={onClearAll} 
            className="text-xs text-gray-600 hover:text-red-600 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 size={14} /> Clear all
          </button>
        </div>
      </div>
      
      {notifications.length === 0 ? (
        <div className="text-sm text-gray-500 py-8 text-center">You have no notifications.</div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-3 border border-gray-200 rounded-lg flex items-start justify-between ${notification.read ? 'bg-white' : 'bg-green-50'}`}
            >
              <div>
                <div className="text-sm font-medium">{notification.text}</div>
                <div className="text-xs text-gray-400 mt-1">{notification.time}</div>
              </div>
              <div className="flex items-center gap-2">
                {!notification.read && (
                  <button 
                    onClick={() => onMarkRead(notification.id)} 
                    className="p-1 text-gray-400 hover:text-green-600 cursor-pointer"
                    title="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                )}
                <button 
                  onClick={() => onClearOne(notification.id)} 
                  className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                  title="Remove notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
