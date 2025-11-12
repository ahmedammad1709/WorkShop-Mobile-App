function UserPanel({ show, onClose }) {
  const users = [
    { name: "John Smith", email: "johnsmith@trt.com", role: "Admin" },
    { name: "William Jonas", email: "demo@trt.com", role: "Technician" },
    { name: "Kimberly", email: "demo2@trt.com", role: "Contractor" },
  ];

  return (
    <aside className={`fixed right-0 top-0 h-screen w-96 bg-white border-l transform ${show ? "translate-x-0" : "translate-x-full"} transition-transform z-50`}>
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <div className="font-semibold">User Management</div>
          <div className="text-xs text-gray-500">Manage users & roles</div>
        </div>
        <button onClick={onClose} className="text-gray-500">Close</button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm">Admins</div>
          <div className="text-xs text-gray-500">1 assigned users</div>
        </div>

        <div className="space-y-3">
          {users.map(u => (
            <div key={u.email} className="flex items-center justify-between p-3 rounded border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#29cc6a] rounded-full flex items-center justify-center text-white font-semibold">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">{u.role}</div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <button 
            className="w-full bg-green-600 text-white py-2 rounded-lg" 
            onClick={() => alert("Add User — demo")}
          >
            Add User
          </button>
          <div className="text-xs text-gray-400 mt-2">
            User role management and permissions can be edited here.
          </div>
        </div>
      </div>
    </aside>
  );
}

export default UserPanel;
