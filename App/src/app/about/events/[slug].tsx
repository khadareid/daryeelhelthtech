import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { CmsListDetailScreen } from '@/components/cms-list-screen';
import { resolveListItem } from '@/lib/cms-list';
import { getCmsBundleRequest, type CmsListItem } from '@/lib/api';

export default function EventsDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [item, setItem] = useState<CmsListItem | null | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      const bundle = await getCmsBundleRequest();
      setItem(resolveListItem(bundle.pages, 'events', slug));
    } catch {
      setItem(resolveListItem([], 'events', slug));
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <CmsListDetailScreen
      headerTitle="Events"
      item={item}
      fallbackTitle="Event not found"
    />
  );
}
