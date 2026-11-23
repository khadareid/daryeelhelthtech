import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { CmsListDetailScreen } from '@/components/cms-list-screen';
import { findItem, pageList } from '@/lib/cms-list';
import { getCmsBundleRequest, type CmsListItem } from '@/lib/api';

export default function InsightsDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [item, setItem] = useState<CmsListItem | null | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      const bundle = await getCmsBundleRequest();
      const { list } = pageList(bundle.pages, 'insights', { items: [] });
      setItem(findItem(list, String(slug || '')) || null);
    } catch {
      setItem(null);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <CmsListDetailScreen
      headerTitle="Insights"
      item={item}
      fallbackTitle="Article not found"
    />
  );
}
