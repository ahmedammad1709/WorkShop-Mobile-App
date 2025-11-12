import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


/**
 * Arrow icon for back navigation
 */
function ArrowIcon({ className = "" }) {
    return (
        <svg
            className={className}
            viewBox="0 0 14 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M0.599866 19.9999L8.59989 11.9999L0.599868 3.9999L2.19987 0.799886L13.3999 11.9999L2.19987 23.2L0.599866 19.9999Z"
                fill="currentColor"
            />
        </svg>
    );
}

/**
 * ProfileSettings.jsx
 * Beautiful profile management section with account information and password change
 * Accent color: #29cc6a
 */
export default function ProfileSettings({ onBack }) {
    const [user, setUser] = useState({ name: "Loading...", email: "" });
    const [userLoading, setUserLoading] = useState(true);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [toast, setToast] = useState(null);
    
    // Profile form state
    const [profileForm, setProfileForm] = useState({
        name: "",
        email: ""
    });
    
    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    
    // Password verification modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [verificationPassword, setVerificationPassword] = useState("");
    const [showVerificationPassword, setShowVerificationPassword] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'profile' or 'password'
    
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // Fetch admin user data on component mount
    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const response = await fetch(`${API_URL}/api/auth/admin`);

                const data = await response.json();

                if (data.success && data.admin) {
                    setUser({
                        name: data.admin.name,
                        email: data.admin.email
                    });
                    setProfileForm({
                        name: data.admin.name,
                        email: data.admin.email
                    });
                } else {
                    console.error('Failed to fetch admin data:', data.error);
                    setUser({ name: "Admin User", email: "" });
                }
            } catch (error) {
                console.error('Error fetching admin data:', error);
                setUser({ name: "Admin User", email: "" });
            } finally {
                setUserLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    // Show toast notification
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Handle profile update - now requires password verification
    const handleProfileUpdate = () => {
        setPendingAction('profile');
        setShowPasswordModal(true);
    };

    // Verify password and proceed with profile update
    const verifyPasswordAndUpdateProfile = async () => {
        try {
           const response = await fetch(`${API_URL}/api/auth/verify-admin-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: verificationPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                // Password verified, now update admin profile
                const updateResponse = await fetch(`${API_URL}/api/auth/update-admin-profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: profileForm.name,
                        email: profileForm.email,
                        password: verificationPassword
                    })
                });

                const updateData = await updateResponse.json();

                if (updateData.success) {
                    setUser({
                        name: profileForm.name,
                        email: profileForm.email
                    });
                    setIsEditingProfile(false);
                    setShowPasswordModal(false);
                    setVerificationPassword("");
                    showToast("Admin profile updated successfully!");
                } else {
                    showToast(updateData.error || "Failed to update admin profile", "error");
                }
            } else {
                showToast("Incorrect admin password. Please try again.", "error");
            }
        } catch (error) {
            console.error('Error updating admin profile:', error);
            showToast("Error updating admin profile", "error");
        }
    };

    // Handle password change - now requires 8 characters minimum
    const handlePasswordChange = () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showToast("New passwords do not match", "error");
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            showToast("New password must be at least 8 characters", "error");
            return;
        }

        setPendingAction('password');
        setShowPasswordModal(true);
    };

    // Verify password and proceed with password change
    const verifyPasswordAndChangePassword = async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/verify-admin-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: verificationPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                // Password verified, now change admin password
                const changeResponse = await fetch(`${API_URL}/api/auth/change-admin-password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        currentPassword: verificationPassword,
                        newPassword: passwordForm.newPassword
                    })
                });

                const changeData = await changeResponse.json();

                if (changeData.success) {
                    setPasswordForm({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: ""
                    });
                    setIsChangingPassword(false);
                    setShowPasswordModal(false);
                    setVerificationPassword("");
                    showToast("Admin password changed successfully!");
                } else {
                    showToast(changeData.error || "Failed to change admin password", "error");
                }
            } else {
                showToast("Incorrect admin password. Please try again.", "error");
            }
        } catch (error) {
            console.error('Error changing admin password:', error);
            showToast("Error changing admin password", "error");
        }
    };

    // Toggle password visibility
    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow border-t-2 border-[#29cc6a] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                        title="Go back"
                    >
                        <ArrowIcon className="w-4 h-4 text-gray-600 rotate-180" />
                    </button>
                    <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Account Information Block */}
                <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                        {!isEditingProfile && (
                            <button
                                onClick={() => setIsEditingProfile(true)}
                                className="px-4 py-2 bg-[#29cc6a] text-white rounded-md hover:bg-green-600 transition-colors cursor-pointer"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {userLoading ? (
                        <div className="text-center py-8">
                            <div className="text-gray-500">Loading profile information...</div>
                        </div>
                    ) : isEditingProfile ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29cc6a] focus:border-transparent"
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29cc6a] focus:border-transparent"
                                    placeholder="Enter your email address"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleProfileUpdate}
                                    className="px-4 py-2 bg-[#29cc6a] text-white rounded-md hover:bg-green-600 transition-colors cursor-pointer"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingProfile(false);
                                        setProfileForm({
                                            name: user.name,
                                            email: user.email
                                        });
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#29cc6a] rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                                </div>
                                <div>
                                    <div className="text-lg font-medium text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Password Change Block */}
                <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
                            <p className="text-sm text-red-700">Change your password to keep your account secure</p>
                        </div>
                        {!isChangingPassword && (
                            <button
                                onClick={() => setIsChangingPassword(true)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer"
                            >
                                Change Password
                            </button>
                        )}
                    </div>

                    {isChangingPassword && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        placeholder="Enter new password (minimum 8 characters)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('new')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        {showPasswords.new ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        {showPasswords.confirm ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handlePasswordChange}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer"
                                >
                                    Change Password
                                </button>
                                <button
                                    onClick={() => {
                                        setIsChangingPassword(false);
                                        setPasswordForm({
                                            currentPassword: "",
                                            newPassword: "",
                                            confirmPassword: ""
                                        });
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Password Verification Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="text-center">
                            {/* Icon */}
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            
                            {/* Title */}
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {pendingAction === 'profile' ? 'Verify Password' : 'Verify Current Password'}
                            </h3>
                            
                            {/* Message */}
                            <p className="text-sm text-gray-600 mb-6">
                                {pendingAction === 'profile' 
                                    ? 'Please enter your current password to update your profile information.'
                                    : 'Please enter your current password to change your password.'
                                }
                            </p>
                            
                            {/* Password Input */}
                            <div className="mb-6">
                                <div className="relative">
                                    <input
                                        type={showVerificationPassword ? "text" : "password"}
                                        value={verificationPassword}
                                        onChange={(e) => setVerificationPassword(e.target.value)}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29cc6a] focus:border-transparent"
                                        placeholder="Enter your current password"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowVerificationPassword(!showVerificationPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        {showVerificationPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Buttons */}
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setVerificationPassword("");
                                        setPendingAction(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (pendingAction === 'profile') {
                                            verifyPasswordAndUpdateProfile();
                                        } else if (pendingAction === 'password') {
                                            verifyPasswordAndChangePassword();
                                        }
                                    }}
                                    className="px-4 py-2 bg-[#29cc6a] text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
                                >
                                    Verify & Continue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-4 right-4 z-50">
                    <div className={`px-4 py-2 rounded-md shadow-lg ${
                        toast.type === 'error' 
                            ? 'bg-red-600 text-white' 
                            : 'bg-green-600 text-white'
                    }`}>
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}
