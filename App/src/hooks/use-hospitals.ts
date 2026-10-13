import { useCallback, useEffect, useState } from 'react';

import {
  getPublicHospitalRequest,
  getPublicHospitalsRequest,
} from '@/lib/api';
import type {
  HospitalsPagination,
  PublicHospital,
} from '@/types/hospital';

const DEFAULT_LIMIT = 9;

export function useHospitals(limit = DEFAULT_LIMIT, search?: string) {
  const [hospitals, setHospitals] = useState<PublicHospital[]>([]);
  const [pagination, setPagination] = useState<HospitalsPagination | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (nextSearch?: string, page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getPublicHospitalsRequest({
          search: (nextSearch ?? search)?.trim() || undefined,
          page,
          limit,
        });
        setHospitals(result.hospitals);
        setPagination(result.pagination);
      } catch (err) {
        setHospitals([]);
        setPagination(null);
        setError(
          err instanceof Error ? err.message : 'Failed to load hospitals',
        );
      } finally {
        setLoading(false);
      }
    },
    [limit, search],
  );

  useEffect(() => {
    void refresh(search, 1);
  }, [refresh, search]);

  return { hospitals, pagination, loading, error, refresh };
}

export function useHospital(tenantId?: string) {
  const [hospital, setHospital] = useState<PublicHospital | null>(null);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!tenantId) {
      setHospital(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await getPublicHospitalRequest(tenantId);
      setHospital(next);
    } catch (err) {
      setHospital(null);
      setError(
        err instanceof Error ? err.message : 'Failed to load hospital',
      );
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { hospital, loading, error, refresh };
}
