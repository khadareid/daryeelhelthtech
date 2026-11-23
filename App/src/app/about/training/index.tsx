import { useCallback, useEffect, useState } from 'react';

import { CmsListScreen } from '@/components/cms-list-screen';
import { pageList, TRAINING_DEFAULTS } from '@/lib/cms-list';
import { getCmsBundleRequest, type CmsListItem, type CmsListStat } from '@/lib/api';

export default function TrainingScreen() {
  const [title, setTitle] = useState('Training programmes');
  const [subtitle, setSubtitle] = useState(
    'Practical digital health training for clinicians, hospitals, and community partners.',
  );
  const [hero, setHero] = useState(
    'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1200',
  );
  const [stats, setStats] = useState<CmsListStat[]>(TRAINING_DEFAULTS.stats || []);
  const [items, setItems] = useState<CmsListItem[]>(TRAINING_DEFAULTS.items || []);

  const load = useCallback(async () => {
    try {
      const bundle = await getCmsBundleRequest();
      const { page, list } = pageList(bundle.pages, 'training', TRAINING_DEFAULTS);
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
      headerTitle="Training"
      headerSubtitle="Learn with Daryeel"
      heroTitle={title}
      heroSubtitle={subtitle}
      heroImage={hero}
      stats={stats}
      items={items}
      detailBase="/about/training"
    />
  );
}
