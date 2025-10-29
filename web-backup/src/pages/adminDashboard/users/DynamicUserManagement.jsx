import React, { useState, useEffect, useMemo } from "react";
import PersonalInformation from "./PersonalInformation";
import ChangePassword from "./ChangePassword";
// at the top of your file
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* -------------------------
   Icons (use fill="currentColor")
   ------------------------- */
// function IconSearch({ className = "w-5 h-5" }) {
//   return (
//     <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
//       {/* <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="none" /> */}
//     </svg>
//   );
// }
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

function IconBack({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

/* -------------------------
   API Functions
   ------------------------- */
const fetchUsersByRole = async (role) => {
  try {
    const response = await fetch(`${API_URL}/auth/users/${role}`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

const fetchBannedUsersByRole = async (role) => {
  try {
    const response = await fetch(`${API_URL}/auth/users/${role}/banned`);
    if (!response.ok) {
      throw new Error('Failed to fetch banned users');
    }
    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error('Error fetching banned users:', error);
    return [];
  }
};

const banUserById = async (userId) => {
  try {
     const response = await fetch(`${API_URL}/auth/users/${userId}/ban`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to ban user');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
};

const unbanUserById = async (userId) => {
  try {
     const response = await fetch(`${API_URL}/auth/users/${userId}/unban`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to unban user');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw error;
  }
};

/* -------------------------
   Main Component
   ------------------------- */
export default function DynamicUserManagement({
  userManagementState,
  setUserManagementState,
  onBack,
  pageSizeOptions = [5, 10, 20],
  defaultPageSize = 10
}) {
  const [users, setUsers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [showUnbanConfirm, setShowUnbanConfirm] = useState(false);
  const [userToUnban, setUserToUnban] = useState(null);
  const [showBannedList, setShowBannedList] = useState(false);

  const currentRole = userManagementState.activeSection;

  // Fetch users when role changes
  useEffect(() => {
    const loadUsers = async () => {
      if (!currentRole || currentRole === 'main') return;
      
      setLoading(true);
      setError(null);
      try {
        const [fetchedUsers, fetchedBannedUsers] = await Promise.all([
          fetchUsersByRole(currentRole),
          fetchBannedUsersByRole(currentRole)
        ]);
        setUsers(fetchedUsers);
        setBannedUsers(fetchedBannedUsers);
      } catch (err) {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [currentRole]);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "created_at") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredAndSortedUsers.slice(startIndex, startIndex + pageSize);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder, pageSize]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setShowSortDropdown(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleDisplayName = (role) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleBanUser = (user) => {
    setUserToBan(user);
    setShowBanConfirm(true);
  };

  const confirmBanUser = async () => {
    if (userToBan) {
      try {
        // Call API to ban user in database
        await banUserById(userToBan.id);
        
        // Update local state immediately
        const bannedUser = { ...userToBan, isban: 1 };
        setBannedUsers(prev => [...prev, bannedUser]);
        setUsers(prev => prev.filter(u => u.id !== userToBan.id));
        
        setShowBanConfirm(false);
        setUserToBan(null);
      } catch (error) {
        console.error('Failed to ban user:', error);
        setError('Failed to ban user. Please try again.');
      }
    }
  };

  const cancelBanUser = () => {
    setShowBanConfirm(false);
    setUserToBan(null);
  };

  const handleUnbanUser = (user) => {
    setUserToUnban(user);
    setShowUnbanConfirm(true);
  };
  
  const confirmUnbanUser = async () => {
    if (userToUnban) {
      try {
        // Call API to unban user in database
        await unbanUserById(userToUnban.id);
        
        // Update local state immediately
        const unbannedUser = { ...userToUnban, isBan: 0 };
        setUsers(prev => [...prev, unbannedUser]);
        setBannedUsers(prev => prev.filter(u => u.id !== userToUnban.id));
        
        setShowUnbanConfirm(false);
        setUserToUnban(null);
      } catch (error) {
        console.error('Failed to unban user:', error);
        setError('Failed to unban user. Please try again.');
      }
    }
  };

  const cancelUnbanUser = () => {
    setShowUnbanConfirm(false);
    setUserToUnban(null);
  };

  // Handle user selection for detailed view
  if (userManagementState.selectedContractor) {
    return (
      <PersonalInformation
        user={userManagementState.selectedContractor}
        onBack={() => setUserManagementState(prev => ({ ...prev, selectedContractor: null }))}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#29cc6a]"></div>
          <div className="text-lg text-gray-600">Loading users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <IconBack className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {filteredAndSortedUsers.length} {filteredAndSortedUsers.length === 1 ? 'user' : 'users'}
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            {/* <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /> */}
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#29cc6a] focus:border-transparent"
            />
          </div>

          {/* Sort and Page Size */}
          <div className="flex gap-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <IconSort className="w-4 h-4" />
                <span className="text-sm">Sort</span>
                <IconChevronDown className="w-4 h-4" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleSort("name")}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                    >
                      Name
                      {sortBy === "name" && (
                        <span className="text-[#29cc6a]">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleSort("email")}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                    >
                      Email
                      {sortBy === "email" && (
                        <span className="text-[#29cc6a]">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleSort("created_at")}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                    >
                      Date Created
                      {sortBy === "created_at" && (
                        <span className="text-[#29cc6a]">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Page Size */}
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#29cc6a] focus:border-transparent"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="divide-y divide-gray-200">
        {paginatedUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No users found matching your search.' : `No ${currentRole}s found.`}
          </div>
        ) : (
          paginatedUsers.map((user) => (
            <div
              key={user.id}
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setUserManagementState(prev => ({ ...prev, selectedContractor: user }))}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold bg-[#29cc6a]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Joined {formatDate(user.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBanUser(user);
                    }}
                    className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    Ban User
                  </button>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <IconChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border rounded text-sm ${
                    currentPage === page
                      ? 'bg-[#29cc6a] text-white border-[#29cc6a]'
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banned Users List */}
      {bannedUsers.length > 0 && (
        <div className="mt-8">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Banned Users</h3>
              <div className="text-sm text-gray-500">
                {bannedUsers.length} {bannedUsers.length === 1 ? 'user' : 'users'} banned
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {bannedUsers.map((user) => (
              <div key={user.id} className="p-6 bg-red-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold bg-red-500">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Joined {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnbanUser(user);
                      }}
                      className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full hover:bg-green-600 transition-colors cursor-pointer"
                    >
                      Unban User
                    </button>
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      Banned
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ban Confirmation Dialog */}
      {showBanConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Ban User</h3>
            <p className="text-gray-600 mb-6">
              This user will not be allowed to login. Do you want to continue and ban this user?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelBanUser}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBanUser}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Confirmation Dialog */}
      {showUnbanConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Unban User</h3>
            <p className="text-gray-600 mb-6">
              This user will be allowed to login again. Do you want to continue and unban this user?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelUnbanUser}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnbanUser}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
              >
                Unban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}