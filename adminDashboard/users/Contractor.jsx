// src/components/Contractor.jsx
import React, { useMemo, useState } from "react";
import PersonalInformation from "./PersonalInformation";
import ChangePassword from "./ChangePassword";

/* -------------------------
   Icons (use fill="currentColor")
   ------------------------- */
function IconSearch({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="none" />
    </svg>
  );
}
function IconChevronRight({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="none" />
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
function IconChevronDown({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* -------------------------
   Sample data (replace with your API)
   ------------------------- */
const SAMPLE = [
  {
    id: 1,
    name: "John Smith",
    email: "johnsmith@trt.com",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    createdAt: "2024-07-10T09:24:00Z",
  },
  {
    id: 2,
    name: "William Jonas",
    email: "demo@trt.com",
    avatar: "https://randomuser.me/api/portraits/men/65.jpg",
    createdAt: "2024-07-08T10:12:00Z",
  },
  {
    id: 3,
    name: "Kimberly",
    email: "demo2@trt.com",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    createdAt: "2024-06-30T14:42:00Z",
  },
  // add more for pagination testing
  {
    id: 4,
    name: "Alice Doe",
    email: "alice@trt.com",
    avatar: "https://randomuser.me/api/portraits/women/21.jpg",
    createdAt: "2024-05-20T11:00:00Z",
  },
  {
    id: 5,
    name: "Bob Harris",
    email: "bob@trt.com",
    avatar: "https://randomuser.me/api/portraits/men/80.jpg",
    createdAt: "2024-04-11T08:05:00Z",
  },
];

/* -------------------------
   Contractor Component
   ------------------------- */
export default function Contractor({
  data = SAMPLE,
  pageSizeOptions = [3, 5, 10],
  defaultPageSize = 3,
  userManagementState,
  setUserManagementState,
  onBack
}) {

  // UI state
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("createdAt"); // createdAt | name | email
  const [sortDirection, setSortDirection] = useState("desc"); // asc | desc
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // dropdown visibility
  const [createdAtOpen, setCreatedAtOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  // Filter + sort the list
  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    let arr = data.filter(
      (c) =>
        c.name.toLowerCase().includes(normalized) ||
        c.email.toLowerCase().includes(normalized)
    );

    arr.sort((a, b) => {
      if (sortField === "name") {
        const A = a.name.toLowerCase();
        const B = b.name.toLowerCase();
        if (A < B) return sortDirection === "asc" ? -1 : 1;
        if (A > B) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }
      if (sortField === "email") {
        const A = a.email.toLowerCase();
        const B = b.email.toLowerCase();
        if (A < B) return sortDirection === "asc" ? -1 : 1;
        if (A > B) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }
      // createdAt default
      const A = new Date(a.createdAt).getTime();
      const B = new Date(b.createdAt).getTime();
      return sortDirection === "asc" ? A - B : B - A;
    });

    return arr;
  }, [data, search, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  // handlers
  function toggleSortDirection() {
    setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
  }
  function changeSort(field) {
    if (field === sortField) {
      toggleSortDirection();
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }
  function gotoPage(p) {
    const next = Math.max(1, Math.min(totalPages, p));
    setPage(next);
  }

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [search, pageSize, sortField, sortDirection]);

  // If a contractor is selected, show their information
  if (userManagementState.selectedContractor) {
    return (
      <>
        <PersonalInformation 
          contractor={userManagementState.selectedContractor}
          onBack={() => setUserManagementState(prev => ({ ...prev, selectedContractor: null }))}
        />
        <ChangePassword />
      </>
    );
  }

  /* -------------------------
     Render
     ------------------------- */
  return (
    <div className="w-full"> {/* Changed from max-w-4xl mx-auto to w-full */}
      {/* Card container */}
      <div className="bg-white rounded-lg shadow border-t-2 border-[#29cc6a]"> {/* Updated border styling */}
        
        {/* Controls area */}
        <div className="p-4">
          <div className="flex gap-3 items-center">
            {/* Search - removed icon and updated border color */}
            <div className="flex-1">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-200 focus:border-green-300"
              />
            </div>

            {/* Created at dropdown - updated border color */}
            <div className="relative">
              <button
                onClick={() => {
                  setCreatedAtOpen((v) => !v);
                  setSortMenuOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-md bg-white text-sm text-gray-700 hover:shadow-sm cursor-pointer"
                aria-expanded={createdAtOpen}
              >
                <span className="text-sm font-medium capitalize">
                  {sortField === "createdAt"
                    ? "Created at"
                    : sortField === "name"
                    ? "Name"
                    : "Email"}
                </span>
                <IconChevronDown className="w-4 h-4 text-blue-500" />
              </button>

              {/* dropdown panel */}
              {createdAtOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-20">
                  <button
                    onClick={() => {
                      changeSort("createdAt");
                      setCreatedAtOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer ${
                      sortField === "createdAt" ? "font-semibold" : ""
                    }`}
                  >
                    Created at {sortField === "createdAt" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
                  </button>
                  <button
                    onClick={() => {
                      changeSort("name");
                      setCreatedAtOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer ${
                      sortField === "name" ? "font-semibold" : ""
                    }`}
                  >
                    Name {sortField === "name" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
                  </button>
                  <button
                    onClick={() => {
                      changeSort("email");
                      setCreatedAtOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer ${
                      sortField === "email" ? "font-semibold" : ""
                    }`}
                  >
                    Email {sortField === "email" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
                  </button>
                </div>
              )}
            </div>

            {/* Sort button - updated border color */}
            <div className="relative">
              <button
                onClick={() => {
                  setSortMenuOpen((v) => !v);
                  setCreatedAtOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-md bg-white text-sm font-medium text-gray-700 hover:shadow-sm cursor-pointer"
              >
                <IconSort className="w-4 h-4 text-gray-600" />
                <span>Sort</span>
              </button>

              {sortMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg z-20 p-2">
                  <div className="text-xs text-gray-500 px-2 pb-2">Order</div>
                  <div className="flex gap-2 px-2 pb-2">
                    <button
                      onClick={() => {
                        setSortDirection("desc");
                        setSortMenuOpen(false);
                      }}
                      className={`flex-1 text-sm px-3 py-2 rounded-md border cursor-pointer ${
                        sortDirection === "desc" ? "bg-gray-100" : ""
                      }`}
                    >
                      Newest first
                    </button>
                    <button
                      onClick={() => {
                        setSortDirection("asc");
                        setSortMenuOpen(false);
                      }}
                      className={`flex-1 text-sm px-3 py-2 rounded-md border cursor-pointer ${
                        sortDirection === "asc" ? "bg-gray-100" : ""
                      }`}
                    >
                      Oldest first
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 px-2 pb-2">Page size</div>
                  <div className="flex gap-2 px-2">
                    {pageSizeOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setPageSize(opt);
                          setSortMenuOpen(false);
                        }}
                        className={`text-sm px-3 py-2 rounded-md border cursor-pointer ${
                          pageSize === opt ? "bg-gray-100" : ""
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider under controls */}
        <div className="border-t border-gray-100" />

        {/* List */}
        <div className="divide-y divide-gray-100">
          {pageData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No contractors found</div>
          ) : (
            pageData.map((c) => (
              <button
                key={c.id}
                onClick={() => setUserManagementState(prev => ({ ...prev, selectedContractor: c }))}
                className="w-full text-left flex items-center justify-between gap-4 px-4 py-4 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-10 h-10 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div>
                    <div className="text-gray-900 font-semibold">{c.name}</div>
                    <div className="text-gray-500 text-sm">{c.email}</div>
                  </div>
                </div>

                <div className="text-gray-400">
                  <IconChevronRight className="w-5 h-5" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer / pagination */}
        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span>-
            <span className="font-medium">{Math.min(page * pageSize, filtered.length)}</span>{" "}
            of <span className="font-medium">{filtered.length}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => gotoPage(page - 1)}
              disabled={page <= 1}
              className={`px-3 py-2 rounded-md border text-sm ${
                page <= 1
                  ? "text-gray-300 border-gray-100 cursor-not-allowed bg-white"
                  : "text-gray-700 border-gray-200 bg-white hover:shadow-sm cursor-pointer"
              }`}
            >
              Previous
            </button>

            <div className="text-sm text-gray-600 px-2">
              {page} / {totalPages}
            </div>

            <button
              onClick={() => gotoPage(page + 1)}
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


