import { useCallback, useEffect, useState } from 'react';

import { CmsListScreen } from '@/components/cms-list-screen';
import { EVENTS_DEFAULTS, pageList } from '@/lib/cms-list';
import { getCmsBundleRequest, type CmsListItem, type CmsListStat } from '@/lib/api';

export default function EventsScreen() {
  const [title, setTitle] = useState('Events');
  const [subtitle, setSubtitle] = useState(
    'Join workshops, community days, and partner sessions across Somaliland.',
  );
  const [hero, setHero] = useState(
    'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1200',
  );
  const [stats, setStats] = useState<CmsListStat[]>(EVENTS_DEFAULTS.stats || []);
  const [items, setItems] = useState<CmsListItem[]>(EVENTS_DEFAULTS.items || []);

  const load = useCallback(async () => {
    try {
      const bundle = await getCmsBundleRequest();
      const { page, list } = pageList(bundle.pages, 'events', EVENTS_DEFAULTS);
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
      headerTitle="Events"
      headerSubtitle="Upcoming sessions"
      heroTitle={title}
      heroSubtitle={subtitle}
      heroImage={hero}
      stats={stats}
      items={items}
      detailBase="/about/events"
    />
  );
}
