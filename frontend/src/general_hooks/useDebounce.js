import { useEffect, useState } from 'react';

// Returns a debounced copy of `value` that only updates after `delay` ms of quiet.
// Shared across pages (e.g. user/product search), so it lives in general_hooks.
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
