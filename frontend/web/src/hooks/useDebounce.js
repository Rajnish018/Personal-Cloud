import { useState, useEffect } from "react";

/**
 * Custom hook to debounce rapid value changes (like text inputs).
 * @param {any} value - The rapid-changing value (e.g., search state)
 * @param {number} delay - Delay in milliseconds before updating (default: 500ms)
 * @returns {any} - The debounced steady value
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // 1. Set up a timer to update the value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 2. Cleanup: If the value changes again before the delay finishes, 
    // cancel the previous timer. This prevents rapid API calls.
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};