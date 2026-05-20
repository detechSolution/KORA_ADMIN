export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    try {
      const key = "nuxt-color-mode";
      const val = localStorage.getItem(key);
      if (val === "system") {
        localStorage.setItem(key, "light");
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      }
    }
    catch {}
  }
});
