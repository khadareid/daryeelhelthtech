import { useState } from 'react';

export function useFilters<T extends Record<string, string>>(initial: T) {
  const [filters, setFilters] = useState(initial);
  return { filters, setFilters };
}
