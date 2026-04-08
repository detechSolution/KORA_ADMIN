import { onMounted, onUnmounted, ref } from "vue";

/**
 * Composable for responsive breakpoint detection
 * @param breakpoint - The breakpoint in pixels (default: 768px for md)
 * @returns A reactive ref that indicates if the screen width is above the breakpoint
 */
export function useBreakpoint(breakpoint: number = 768) {
  const isAboveBreakpoint = ref(false);

  // Check if screen is above the breakpoint
  function checkBreakpoint(): void {
    if (typeof window !== "undefined") {
      isAboveBreakpoint.value = window.matchMedia(`(min-width: ${breakpoint}px)`).matches;
    }
  }

  // Handle window resize
  function handleResize(): void {
    checkBreakpoint();
  }

  onMounted(() => {
    checkBreakpoint();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
    }
  });

  onUnmounted(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", handleResize);
    }
  });

  return isAboveBreakpoint;
}
