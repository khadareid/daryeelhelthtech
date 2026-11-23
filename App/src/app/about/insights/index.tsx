import { useCallback, useEffect, useState } from 'react';

import { CmsListScreen } from '@/components/cms-list-screen';
import { INSIGHTS_DEFAULTS, pageList } from '@/lib/cms-list';
import { getCmsBundleRequest, type CmsListItem, type CmsListStat } from '@/lib/api';

export default function InsightsScreen() {
  const [title, setTitle] = useState('Insights');
  const [subtitle, setSubtitle] = useState(
    'Practical articles on digital health, family care, and hospital operations.',
  );
  const [hero, setHero] = useState(
    'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1200',
  );
  const [stats, setStats] = useState<CmsListStat[]>(INSIGHTS_DEFAULTS.stats || []);
  const [items, setItems] = useState<CmsListItem[]>(INSIGHTS_DEFAULTS.items || []);

  const load = useCallback(async () => {
    try {
      const bundle = await getCmsBundleRequest();
      const { page, list } = pageList(bundle.pages, 'insights', INSIGHTS_DEFAULTS);
      if (page?.title) setTitle(page.title);
      if (page?.subtitle) setSubtitle(page.subtitle);
      if (page?.heroImageUrl) setHero(page.heroImageUrl);
      if (list.stats?.length) setStats(list.stats);
      if (list.items?.length) setItems(list.items);
    } catch {
      /* keep defaults */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <CmsListScreen
      headerTitle="Insights"
      headerSubtitle="Guides & articles"
      heroTitle={title}
      heroSubtitle={subtitle}
      heroImage={hero}
      stats={stats}
      items={items}
      detailBase="/about/insights"
    />
  );
}
