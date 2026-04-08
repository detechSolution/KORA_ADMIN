import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const authStore = useAuthStore();

  try {
    // Only check auth if needed (cached check)
    await authStore.checkAuthIfNeeded();

    // If route requires auth (protected)
    if (to.meta.auth === true) {
      // If not authenticated, redirect to login
      if (!authStore.isAuthenticated) {
        return navigateTo({ name: "login" });
      }
      // Check page permission when meta.permission is set
      const permission = to.meta.permission as string | undefined;
      if (typeof permission === "string" && permission.length > 0) {
        if (!authStore.permissions.includes(permission)) {
          throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
        }
      }
      return;
    }

    // If route doesn't require auth (auth: false, like login/register)
    if (to.meta.auth === false) {
      // If authenticated, redirect away from login to home
      if (authStore.isAuthenticated) {
        return navigateTo({ name: "index" });
      }
      // If not authenticated, allow access to non-protected routes
    }

    // If auth meta is not set, allow access (default behavior)
  }
  catch (error) {
    console.error(error, "Auth Global Middleware Error");
    if (to.name !== "login") {
      return navigateTo({ name: "login" });
    }
  }
});
