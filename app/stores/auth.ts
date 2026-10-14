import { defineStore } from "pinia";
import { ref } from "vue";

import { getHttp } from "~/composables/use-api";
import { useStorage } from "~/composables/use-storage";
import { API_ENDPOINTS } from "~/config/constants";

// Cache duration: 5 minutes
const AUTH_CHECK_INTERVAL = 5 * 60 * 1000;
const USER_DATA_KEY = "user_data";

export const useAuthStore = defineStore("auth", () => {
  const http = getHttp();
  const storage = useStorage();
  // State
  const isAuthenticated = ref(false);
  const unAuthorizedError = ref(false);
  const isCheckingAuth = ref(false);
  const lastAuthCheck = ref<number>(0); // Track last check time
  let authCheckPromise: Promise<void> | null = null;

  const user = ref<{
    id: number | null;
    email: string;
    name: string;
    phone: string;
    avatar?: string;
    is_active?: boolean;
    role_id?: number | null;
    last_login_at?: string | null;
  }>({
    id: null,
    email: "",
    name: "",
    phone: "",
    avatar: "",
  });

  const permissions = ref<string[]>([]);

  // Load user data from localStorage on store initialization
  const loadUserFromStorage = () => {
    try {
      const storedUser = localStorage.getItem(USER_DATA_KEY);
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        user.value = { ...user.value, ...parsed };
        // If we have stored user data and tokens, assume authenticated
        // (will be verified on next check)
        if (storage.hasTokens()) {
          isAuthenticated.value = true;
        }
      }
    }
    catch {
      // Ignore errors, just proceed without cached data
    }
  };

  // Save user data to localStorage (profile only; permissions are not persisted)
  const saveUserToStorage = () => {
    try {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify({
        id: user.value.id,
        email: user.value.email,
        name: user.value.name,
        phone: user.value.phone,
        avatar: user.value.avatar,
        is_active: user.value.is_active,
        role_id: user.value.role_id,
        last_login_at: user.value.last_login_at,
      }));
    }
    catch {
      // Ignore storage errors
    }
  };

  // Initialize: Load cached user data if available
  loadUserFromStorage();

  // Actions

  const clearAuthData = () => {
    isAuthenticated.value = false;
    lastAuthCheck.value = 0;
    user.value = {
      id: null,
      email: "",
      name: "",
      phone: "",
      avatar: "",
    };
    permissions.value = [];
    try {
      localStorage.removeItem(USER_DATA_KEY);
    }
    catch {
      // Ignore storage errors
    }
  };

  const clearData = () => {
    clearAuthData();
  };

  const logout = (): void => {
    try {
      storage.removeTokens();
      clearData();
    }
    catch (error: unknown) {
      console.error(error, "Logout Error");
    }
  };

  const performAuthCheck = async (force: boolean): Promise<void> => {
    const now = Date.now();

    // If no tokens, clear auth immediately
    if (!storage.hasTokens()) {
      clearAuthData();
      return;
    }

    // Skip if recently checked (unless forced)
    if (!force && (now - lastAuthCheck.value) < AUTH_CHECK_INTERVAL) {
      return; // Use cached auth state
    }

    isCheckingAuth.value = true;
    try {
      const payload = await http.get<{
        id?: number;
        email?: string;
        fullName?: string;
        phoneNumber?: string;
        adminRole?: { id?: number | null };
        permissions?: string[];
      } | null>(API_ENDPOINTS.AUTH.ME);
      if (!payload) {
        throw new Error("Unable to verify your session. Please try again.");
      }
      isAuthenticated.value = true;
      user.value.id = payload.id ?? null;
      user.value.email = payload.email ?? "";
      user.value.name = payload.fullName ?? "";
      user.value.phone = payload.phoneNumber ?? "";
      user.value.role_id = payload.adminRole?.id ?? null;
      permissions.value = Array.isArray(payload.permissions) ? payload.permissions : [];
      saveUserToStorage();
      lastAuthCheck.value = now;
    }
    catch (error: unknown) {
      console.error(error, "Check Auth Error");
      clearAuthData();
      logout();
      throw error;
    }
    finally {
      isCheckingAuth.value = false;
    }
  };

  const checkAuth = async (force = false): Promise<void> => {
    if (!authCheckPromise) {
      authCheckPromise = performAuthCheck(force).finally(() => {
        authCheckPromise = null;
      });
    }
    await authCheckPromise;
  };

  // Smart check: only checks if needed (cached)
  const checkAuthIfNeeded = async (): Promise<void> => {
    // Always check on first load (no previous check)
    if (lastAuthCheck.value === 0) {
      await checkAuth(true);
      return;
    }

    // Otherwise use cached check
    await checkAuth(false);
  };

  const login = async (payload: { email: string; password: string; rememberMe: boolean }): Promise<void> => {
    try {
      unAuthorizedError.value = false;
      // Let any previous session check finish before storing the new session.
      if (authCheckPromise) {
        await authCheckPromise.catch(() => {});
      }
      const { accessToken, refreshToken } = await http.post<{ accessToken?: string; refreshToken?: string }>(API_ENDPOINTS.AUTH.LOGIN, { email: payload.email, password: payload.password, rememberMe: payload.rememberMe });
      if (!accessToken || !refreshToken) {
        throw new Error("Invalid login response. Please try again.");
      }
      if (!storage.setTokens(accessToken, refreshToken)) {
        logout();
        throw new Error("Unable to save your session. Please try again.");
      }
      await checkAuth(true);
      if (!isAuthenticated.value) {
        throw new Error("Unable to verify your session. Please try again.");
      }
    }
    catch (error: unknown) {
      console.error(error, "Login Error");
      throw error;
    }
  };

  const updatePassword = async (payload: { currentPassword: string; newPassword: string }): Promise<void> => {
    try {
      return await http.patch(API_ENDPOINTS.AUTH.UPDATE_PASSWORD, payload) as any;
    }
    catch (error: unknown) {
      console.error(error, "Update Password Error");
      throw error;
    }
  };

  const setUnAuthorizedError = (value: boolean): void => {
    unAuthorizedError.value = value;
  };

  const updateProfile = async (payload: { fullName: string; phone: string }): Promise<void> => {
    try {
      return await http.patch(API_ENDPOINTS.AUTH.UPDATE_PROFILE, payload) as any;
    }
    catch (error: unknown) {
      console.error(error, "Update Profile Error");
      throw error;
    }
  };

  const forgotPassword = async (payload: { email: string }): Promise<void> => {
    try {
      return await http.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload) as any;
    }
    catch (error: unknown) {
      console.error(error, "Forgot Password Error");
      throw error;
    }
  };

  const verifyResetOtp = async (payload: { email: string; code: string }): Promise<void> => {
    try {
      return await http.post(API_ENDPOINTS.AUTH.VERIFY_OTP, payload) as any;
    }
    catch (error: unknown) {
      console.error(error, "Verify OTP Error");
      throw error;
    }
  };

  const resetPassword = async (payload: { code: string; newPassword: string; email: string }): Promise<void> => {
    try {
      return await http.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload) as any;
    }
    catch (error: unknown) {
      console.error(error, "Reset Password Error");
      throw error;
    }
  };

  return {
    isAuthenticated,
    isCheckingAuth,
    unAuthorizedError,
    user,
    permissions,
    checkAuth,
    checkAuthIfNeeded,
    login,
    logout,
    updatePassword,
    setUnAuthorizedError,
    updateProfile,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
  };
});
