import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour session auto-logout

function clearStoredSession() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('auth_expires_at');
  localStorage.removeItem('view_mode');
  localStorage.removeItem('active_tab');
  localStorage.removeItem('selected_branch_id');
}

function checkAndGetValidSession() {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      clearStoredSession();
      return { token: null, user: null, expiresAt: null };
    }

    const rawExpiresAt = localStorage.getItem('auth_expires_at');
    if (rawExpiresAt) {
      const expiresAt = Number(rawExpiresAt);
      if (Date.now() >= expiresAt) {
        clearStoredSession();
        return { token: null, user: null, expiresAt: null };
      }
      const rawUser = localStorage.getItem('auth_user');
      const user = rawUser ? JSON.parse(rawUser) : null;
      return { token, user, expiresAt };
    }

    // Existing session without expiry timestamp: start 1-hour session from now
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    localStorage.setItem('auth_expires_at', String(expiresAt));
    const rawUser = localStorage.getItem('auth_user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    return { token, user, expiresAt };
  } catch {
    clearStoredSession();
    return { token: null, user: null, expiresAt: null };
  }
}

export function AppProvider({ children }) {
  const initialSession = checkAndGetValidSession();
  const initialToken = initialSession.token;
  const initialUser = initialSession.user;
  const initialViewMode = initialToken && (localStorage.getItem('view_mode') || 'staff') === 'staff'
    ? 'staff'
    : 'landing';

  const [sessionExpiresAt, setSessionExpiresAt] = useState(initialSession.expiresAt);
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [usersList, setUsersList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    if (!initialUser) return null;
    if (initialUser.role !== 'super_admin') return initialUser.branch_id ?? null;
    const saved = localStorage.getItem('selected_branch_id');
    return saved ? Number(saved) : null;
  });
  const [settings, setSettings] = useState({});
  const [courseTypes, setCourseTypes] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [activeTab, setActiveTabState] = useState(() => {
    const savedTab = localStorage.getItem('active_tab');
    if (savedTab) return savedTab;
    return initialUser?.role === 'instructor' ? 'instructor' : 'dashboard';
  });
  const [toast, setToast] = useState(null);
  const [viewMode, setViewModeState] = useState(initialViewMode);
  const [isNavOpen, setIsNavOpen] = useState(() => {
    const saved = localStorage.getItem('is_nav_open');
    if (saved !== null) return saved === 'true';
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    localStorage.setItem('active_tab', tab);
  }, []);

  const setViewMode = useCallback((mode) => {
    setViewModeState(mode);
    localStorage.setItem('view_mode', mode);
  }, []);

  const handleSetSelectedBranchId = useCallback((branchId) => {
    setSelectedBranchId(branchId);
    if (branchId) {
      localStorage.setItem('selected_branch_id', String(branchId));
    } else {
      localStorage.removeItem('selected_branch_id');
    }
  }, []);

  const toggleNavMenu = useCallback(() => {
    setIsNavOpen(prev => {
      const next = !prev;
      localStorage.setItem('is_nav_open', String(next));
      return next;
    });
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

  // Logout user and clear session state
  const logoutUser = useCallback((customMessage = null, messageType = 'info') => {
    clearStoredSession();
    setSessionExpiresAt(null);
    setCurrentUser(null);
    setViewModeState('landing');
    showToast(customMessage || 'Logged out from staff portal', messageType);
  }, [showToast]);

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

      if (res.status === 401 && !url.includes('/api/auth/login')) {
        logoutUser('Your session has expired (1 hour limit). Please log in again.', 'warning');
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Session expired');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  }, [currentUser, logoutUser]);

  // Load authenticated user session, users, branches, and settings
  const loadInitialData = useCallback(async (explicitUserId = null) => {
    const token = localStorage.getItem('auth_token');
    if (!token && !explicitUserId) return;

    const authHeaders = token
      ? { 'Authorization': `Bearer ${token}` }
      : { 'x-user-id': String(explicitUserId) };

    try {
      // 1. Verify & refresh authenticated user profile
      const authRes = await fetch('/api/auth/me', { headers: authHeaders });
      if (authRes.status === 401) {
        logoutUser('Your session has expired. Please log in again.', 'warning');
        return;
      }

      const authData = await authRes.json();
      if (authData.user) {
        const hydratedUser = {
          ...authData.user,
          permissions: authData.permissions || authData.user.permissions || {}
        };
        setCurrentUser(hydratedUser);
        localStorage.setItem('auth_user', JSON.stringify(hydratedUser));

        if (hydratedUser.role !== 'super_admin') {
          setSelectedBranchId(hydratedUser.branch_id ?? null);
        }

        // Only set a default tab if none is saved yet or instructor logged in on a non-instructor tab
        const savedTab = localStorage.getItem('active_tab');
        if (!savedTab) {
          const defaultTab = hydratedUser.role === 'instructor' ? 'instructor' : 'dashboard';
          setActiveTabState(defaultTab);
          localStorage.setItem('active_tab', defaultTab);
        } else if (hydratedUser.role === 'instructor' && !savedTab.startsWith('instructor')) {
          setActiveTabState('instructor');
          localStorage.setItem('active_tab', 'instructor');
        }
      }

      // 2. Get users list
      const usersRes = await fetch('/api/auth/users', { headers: authHeaders });
      const usersData = await usersRes.json();
      if (usersData.users) setUsersList(usersData.users);

      // 3. Get branches
      const branchesRes = await fetch('/api/branches', { headers: authHeaders });
      const branchesData = await branchesRes.json();
      if (branchesData.branches) setBranches(branchesData.branches);

      // 4. Get system settings
      const settingsRes = await fetch('/api/settings', { headers: authHeaders });
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
    if (localStorage.getItem('auth_token')) {
      loadInitialData();
    }
  }, [loadInitialData]);

  // Switch persona
  const switchPersona = useCallback(async (userId) => {
    try {
      const selected = usersList.find(u => u.id === Number(userId));
      if (selected) {
        setCurrentUser(selected);
        localStorage.setItem('auth_user', JSON.stringify(selected));

        const currentExp = localStorage.getItem('auth_expires_at');
        if (!currentExp || Date.now() >= Number(currentExp)) {
          const newExp = Date.now() + SESSION_DURATION_MS;
          localStorage.setItem('auth_expires_at', String(newExp));
          setSessionExpiresAt(newExp);
        }

        if (selected.role === 'instructor') {
          setActiveTab('instructor');
        } else {
          setActiveTab('dashboard');
        }

        if (selected.role !== 'super_admin') {
          handleSetSelectedBranchId(selected.branch_id);
        } else {
          handleSetSelectedBranchId(null);
        }

        showToast(`Switched active persona to ${selected.name} (${selected.role.replace('_', ' ').toUpperCase()})`, 'info');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [usersList, showToast, setActiveTab, handleSetSelectedBranchId]);

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

    const schoolName = settings.app_name || 'ShivSamarth Motor Driving School';
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

    try {
      await apiFetch(`/api/students/${student.id}/whatsapp-reminder`, { method: 'POST' });
      showToast(`WhatsApp reminder dispatched for ${student.name || student.student_name}!`);
    } catch (e) {
      console.error(e);
    }
  }, [settings, apiFetch, showToast]);

  // Helper to send Google Review request via WhatsApp when course is about to complete
  const triggerGoogleReviewRequest = useCallback(async (student) => {
    const rawPhone = student.phone || student.student_phone || '';
    const phone = String(rawPhone).replace(/\D/g, '');
    if (!phone) {
      showToast('No phone number recorded for this student', 'error');
      return;
    }
    const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;

    const schoolName = settings.app_name || 'ShivSamarth Motor Driving School';
    const branchObj = branches.find(b => b.id === (student.branch_id || Number(student.branch_id)));
    const branchName = student.branch_name || branchObj?.name || 'Main Branch';
    const courseName = student.course_name || 'Driving Course';
    const daysDone = student.days_completed || 0;
    const totalDays = student.total_course_days || 26;
    const reviewLink = student.branch_google_review_url || branchObj?.google_review_url || settings.google_review_url || 'https://g.page/r/shivsamarth-driving-school/review';

    let message = settings.whatsapp_google_review_template ||
      `Namaste {student_name}! 🚗✨ Congratulations on nearing the completion of your driving course (Day {days_completed}/{total_days}) at {school_name} ({branch_name})!\n\nWe hope you had a great experience learning to drive safely with our certified instructors. Could you please take 1 minute to share your feedback and give us a 5-star Google Review here?\n\n⭐ Review Link: {google_review_link}\n\nYour review helps our team grow and guides future learners. Thank you & happy safe driving! 🌟`;

    message = message
      .replaceAll('{student_name}', student.name || student.student_name || 'Student')
      .replaceAll('{school_name}', schoolName)
      .replaceAll('{branch_name}', branchName)
      .replaceAll('{course_name}', courseName)
      .replaceAll('{days_completed}', String(daysDone))
      .replaceAll('{total_days}', String(totalDays))
      .replaceAll('{google_review_link}', reviewLink);

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    try {
      await apiFetch(`/api/students/${student.id}/google-review-request`, { method: 'POST' });
      showToast(`Google Review WhatsApp invite sent to ${student.name || student.student_name}!`);
    } catch (e) {
      console.error(e);
    }
  }, [settings, branches, apiFetch, showToast]);

  const loginUser = useCallback((user, token) => {
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    if (token) localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('auth_expires_at', String(expiresAt));

    setSessionExpiresAt(expiresAt);
    setCurrentUser(user);
    setViewMode('staff');

    const defaultTab = user.role === 'instructor' ? 'instructor' : 'dashboard';
    setActiveTab(defaultTab);
    handleSetSelectedBranchId(user.role !== 'super_admin' ? user.branch_id : null);

    loadInitialData();
    showToast(`Welcome back, ${user.name}!`);
  }, [showToast, setViewMode, setActiveTab, handleSetSelectedBranchId, loadInitialData]);

  // Active session 1-hour auto-logout watchdog
  useEffect(() => {
    if (!currentUser) return;

    const checkSessionExpiration = () => {
      const rawExpiresAt = localStorage.getItem('auth_expires_at');
      if (rawExpiresAt && Date.now() >= Number(rawExpiresAt)) {
        logoutUser('Your session has expired (1 hour limit). Please log in again.', 'warning');
      }
    };

    // Check immediately on user mount
    checkSessionExpiration();

    // Check every 10 seconds while tab is running
    const intervalId = setInterval(checkSessionExpiration, 10000);

    // Check immediately when browser tab regains focus or visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSessionExpiration();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkSessionExpiration);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkSessionExpiration);
    };
  }, [currentUser, logoutUser]);

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
        setSelectedBranchId: handleSetSelectedBranchId,
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
        triggerGoogleReviewRequest,
        loadInitialData,
        sessionExpiresAt
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
