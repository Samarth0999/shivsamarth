import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null); // null means All Branches (for super_admin)
  const [settings, setSettings] = useState({});
  const [courseTypes, setCourseTypes] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState('landing'); // 'landing' (public) | 'staff' (management portal)
  const [isNavOpen, setIsNavOpen] = useState(true); // Navigation menu open / close toggle

  const toggleNavMenu = useCallback(() => {
    setIsNavOpen(prev => !prev);
  }, []);

  // Universal Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Quick toast notification helper
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Centralized API fetch helper that attaches JWT and/or user ID
  const apiFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(currentUser ? { 'x-user-id': String(currentUser.id) } : {}),
      ...(options.headers || {})
    };

    try {
      const res = await fetch(url, {
        ...options,
        headers
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  }, [currentUser]);

  // Load initial settings and users
  const loadInitialData = useCallback(async (userId = 1) => {
    try {
      // 1. Get current user
      const authRes = await fetch('/api/auth/me', {
        headers: { 'x-user-id': String(userId) }
      });
      const authData = await authRes.json();
      if (authData.user) {
        setCurrentUser(authData.user);
        // If instructor, set activeTab to 'instructor'
        if (authData.user.role === 'instructor') {
          setActiveTab('instructor');
        } else {
          setActiveTab('dashboard');
        }
      }

      // 2. Get users list for persona switcher
      const usersRes = await fetch('/api/auth/users', {
        headers: { 'x-user-id': String(userId) }
      });
      const usersData = await usersRes.json();
      if (usersData.users) setUsersList(usersData.users);

      // 3. Get branches
      const branchesRes = await fetch('/api/branches', {
        headers: { 'x-user-id': String(userId) }
      });
      const branchesData = await branchesRes.json();
      if (branchesData.branches) setBranches(branchesData.branches);

      // 4. Get system settings
      const settingsRes = await fetch('/api/settings', {
        headers: { 'x-user-id': String(userId) }
      });
      const settingsData = await settingsRes.json();
      if (settingsData.settings) setSettings(settingsData.settings);
      if (settingsData.courseTypes) setCourseTypes(settingsData.courseTypes);
      if (settingsData.paymentModes) setPaymentModes(settingsData.paymentModes);
      if (settingsData.expenseCategories) setExpenseCategories(settingsData.expenseCategories);

    } catch (err) {
      console.error('Initialization error:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData(1); // Start with Super Admin Vikram Deshmukh
  }, [loadInitialData]);

  // Switch persona (Super Admin, Branch Manager, Instructor, Office Staff)
  const switchPersona = useCallback(async (userId) => {
    try {
      const selected = usersList.find(u => u.id === Number(userId));
      if (selected) {
        setCurrentUser(selected);
        if (selected.role === 'instructor') {
          setActiveTab('instructor');
        } else {
          setActiveTab('dashboard');
        }

        // Adjust branch filter
        if (selected.role !== 'super_admin') {
          setSelectedBranchId(selected.branch_id);
        } else {
          setSelectedBranchId(null);
        }

        showToast(`Switched active persona to ${selected.name} (${selected.role.replace('_', ' ').toUpperCase()})`, 'info');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [usersList, showToast]);

  // Perform Universal Global Search
  const performSearch = useCallback(async (term) => {
    setSearchQuery(term);
    if (!term || term.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await apiFetch(`/api/search?q=${encodeURIComponent(term)}`);
      setSearchResults(res.results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [apiFetch]);

  // Helper to open WhatsApp with pre-filled message
  const triggerWhatsAppReminder = useCallback(async (student) => {
    const phone = String(student.phone || student.student_phone).replace(/\D/g, '');
    const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;

    const schoolName = settings.app_name || 'Apex Pro Driving Academy';
    const branchName = student.branch_name || 'Main Branch';
    const daysDone = student.days_completed;
    const totalDays = student.total_course_days;
    const balance = student.pending_balance;

    let message = settings.whatsapp_fee_reminder_template || 
      `Namaste {student_name}, Greetings from {school_name} ({branch_name}). You have completed Day {days_completed}/{total_days} of your driving course. Your pending fee balance is Rs. {pending_balance}. Please settle this balance at the branch office to ensure smooth RTO test scheduling. Thank you!`;

    message = message
      .replace('{student_name}', student.name || student.student_name)
      .replace('{school_name}', schoolName)
      .replace('{branch_name}', branchName)
      .replace('{days_completed}', String(daysDone))
      .replace('{total_days}', String(totalDays))
      .replace('{pending_balance}', Number(balance).toLocaleString('en-IN'));

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    // Log reminder in backend
    try {
      await apiFetch(`/api/students/${student.id}/whatsapp-reminder`, { method: 'POST' });
      showToast(`WhatsApp reminder dispatched for ${student.name || student.student_name}!`);
    } catch (e) {
      console.error(e);
    }
  }, [settings, apiFetch, showToast]);

  const loginUser = useCallback((user, token) => {
    setCurrentUser(user);
    setViewMode('staff');
    if (user.role === 'instructor') {
      setActiveTab('instructor');
    } else {
      setActiveTab('dashboard');
    }
    showToast(`Welcome back, ${user.name}!`);
  }, [showToast]);

  const logoutUser = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setViewMode('landing');
    showToast('Logged out from staff portal', 'info');
  }, [showToast]);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const hasPermission = useCallback((key) => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    return Boolean(currentUser.permissions?.[key]);
  }, [currentUser]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isSuperAdmin,
        hasPermission,
        isNavOpen,
        setIsNavOpen,
        toggleNavMenu,
        usersList,
        branches,
        setBranches,
        selectedBranchId,
        setSelectedBranchId,
        settings,
        setSettings,
        courseTypes,
        paymentModes,
        expenseCategories,
        activeTab,
        setActiveTab,
        viewMode,
        setViewMode,
        loginUser,
        logoutUser,
        toast,
        showToast,
        apiFetch,
        switchPersona,
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        isSearching,
        performSearch,
        triggerWhatsAppReminder,
        loadInitialData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
