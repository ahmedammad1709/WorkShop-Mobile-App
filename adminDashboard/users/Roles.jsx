import React, { useState } from "react";
import EditUser from './EditUser';
import RoleDetails from "./RoleDetails";

/* -------------------------
   Icons
   ------------------------- */
function IconSearch({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
    </svg>
  );
}
function IconChevronRight({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
function IconChevronDown({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function IconSort({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 6h6v2H3V6zm0 5h10v2H3v-2zm0 5h14v2H3v-2z" />
    </svg>
  );
}

/* -------------------------
   Sample roles data
   ------------------------- */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Roles({ userRolesState, setUserRolesState }) {
  const [search, setSearch] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [sortField, setSortField] = useState("createdAt"); // demo only
  const [page, setPage] = useState(1);
  const pageSize = 4;

  // dynamic roles state
  const [roles, setRoles] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    async function fetchRoleStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/auth/roles-stats`);
        const data = await res.json();
        if (!data?.success) throw new Error("Failed to load roles stats");
        const nameMap = {
          contractor: "Contractor",
          technician: "Technician",
          supplier: "Supplier",
          consultant: "Consultant",
        };
        const stats = (data.stats || [])
          .filter((s) => nameMap[s.role])
          .map((s) => ({ name: nameMap[s.role], users: s.count }));
        const allRoles = ["Contractor", "Technician", "Supplier", "Consultant"].map((n) => {
          const found = stats.find((x) => x.name === n);
          return found || { name: n, users: 0 };
        });
        setRoles(allRoles);
      } catch (e) {
        console.error(e);
        setError(e.message || "Unknown error");
        setRoles([
          { name: "Contractor", users: 0 },
          { name: "Technician", users: 0 },
          { name: "Supplier", users: 0 },
          { name: "Consultant", users: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchRoleStats();
  }, []);


  // filter roles
  const filtered = roles.filter((role) =>
    role.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  // If editing a role, show the EditRole component
  if (userRolesState.editingRole) {
    return (
      <RoleDetails 
        role={userRolesState.editingRole} 
        onBack={() => setUserRolesState({ editingRole: null })} 
      />
    );
  }

  return (
    <div className="w-full rounded-lg border-t-2 border-[#29cc6a]">
      {/* controls */}
      <div className="p-4 flex gap-3 items-center">
        {/* search - removed the icon div */}
        <div className="flex-1 relative">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-200 focus:border-green-300"
          />
        </div>

        {/* Created At dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setFieldOpen((v) => !v);
              setSortOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-white text-sm text-gray-700 hover:shadow-sm cursor-pointer"
          >
            <span>Created at</span>
            <IconChevronDown className="w-4 h-4 text-blue-500" />
          </button>
          {fieldOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-20">
              <button
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 cursor-pointer"
                onClick={() => setFieldOpen(false)}
              >
                Created at
              </button>
              <button
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 cursor-pointer"
                onClick={() => setFieldOpen(false)}
              >
                Name
              </button>
            </div>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setSortOpen((v) => !v);
              setFieldOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-white text-sm font-medium text-gray-700 hover:shadow-sm cursor-pointer"
          >
            <IconSort className="w-4 h-4 text-gray-600" />
            <span>Sort</span>
          </button>
          {sortOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border rounded-md shadow-lg z-20 p-2">
              <div className="text-xs text-gray-500 px-2 pb-2">Order</div>
              <button
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => setSortOpen(false)}
              >
                Newest first
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => setSortOpen(false)}
              >
                Oldest first
              </button>
            </div>
          )}
        </div>
      </div>

      {/* list */}
      <div className="divide-y divide-gray-100 w-full">
        {pageData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No roles found</div>
        ) : (
          pageData.map((role) => (
            <button
              key={role.name}
              className="w-full flex items-center px-4 py-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setUserRolesState({ editingRole: role })}
            >
              <div className="flex-1 grid grid-cols-2">
                <span className="text-gray-900 font-semibold text-base text-left">
                  {role.name}
                </span>
                <span className="text-gray-900 font-medium text-base text-center">
                  {role.users} assigned users
                </span>
              </div>
              <IconChevronRight className="w-5 h-5 text-gray-400 ml-4" />
            </button>
          ))
        )}
      </div>

      {/* pagination */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium">
              {(page - 1) * pageSize + 1}
            </span>
            -
            <span className="font-medium">
              {Math.min(page * pageSize, filtered.length)}
            </span>{" "}
            of <span className="font-medium">{filtered.length}</span>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className={`px-3 py-2 rounded-md border text-sm ${
                page <= 1
                  ? "text-gray-300 border-gray-100 cursor-not-allowed bg-white"
                  : "text-gray-700 border-gray-200 bg-white hover:shadow-sm cursor-pointer"
              }`}
            >
              Previous
            </button>
            <div className="text-sm text-gray-600">
              {page} / {totalPages}
            </div>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className={`px-3 py-2 rounded-md border text-sm ${
                page >= totalPages
                  ? "text-gray-300 border-gray-100 cursor-not-allowed bg-white"
                  : "text-gray-700 border-gray-200 bg-white hover:shadow-sm cursor-pointer"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
