import { useCallback, useEffect, useState } from 'react';

import type { DoctorItem } from '@/constants/content';
import { useAuth } from '@/context/auth-context';
import { getDoctorsRequest } from '@/lib/api';

export function useDoctors() {
  const { accessToken } = useAuth();
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const remote = await getDoctorsRequest(accessToken, { limit: 50 });
    setDoctors(remote);
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { doctors, loading, refresh };
}
