import { useCallback, useEffect, useState } from 'react';

import { CmsListScreen } from '@/components/cms-list-screen';
import { pageList } from '@/lib/cms-list';
import {
  getCmsBundleRequest,
  type CmsListItem,
  type CmsListStat,
} from '@/lib/api';

const FALLBACK_STATS: CmsListStat[] = [
  { value: '4', label: 'Upcoming' },
  { value: '2', label: 'Cities' },
  { value: '1', label: 'Online' },
  { value: 'Free', label: 'Most sessions' },
];

const FALLBACK_ITEMS: CmsListItem[] = [
  {
    slug: 'digital-health-open-day',
    title: 'Digital Health Open Day',
    meta: '12 Dec 2026 · Hargeisa',
    tag: 'Community',
    description:
      'Meet the team and learn how families book care and manage records.',
    content:
      'Join us for a half-day open house in Hargeisa.\n\nTour the platform and ask questions about connected care.',
    image:
      'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    slug: 'hospital-partner-workshop',
    title: 'Hospital Partner Workshop',
    meta: '20 Dec 2026 · Online',
    tag: 'Providers',
    description:
      'Hands-on session for hospital admins on bookings and doctor rosters.',
    image:
      'https://images.pexels.com/photos/1181622/pexels-photo-1181622.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    slug: 'family-wellness-session',
    title: 'Family Wellness Session',
    meta: '05 Jan 2027 · Gabiley',
    tag: 'Patients',
    description:
      'Emergency cards, family profiles, and staying connected to care.',
    image:
      'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    slug: 'clinical-digital-skills-bootcamp',
    title: 'Clinical Digital Skills Bootcamp',
    meta: '18 Jan 2027 · Hargeisa',
    tag: 'Training',
    description:
      'Full-day intensive for clinicians adopting telemedicine tools.',
    image:
      'https://images.pexels.com/photos/1181715/pexels-photo-1181715.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

export default function EventsScreen() {
  const [title, setTitle] = useState('Events');
  const [subtitle, setSubtitle] = useState(
    'Join workshops, community days, and partner sessions across Somaliland.',
  );
  const [hero, setHero] = useState(
    'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1200',
  );
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [items, setItems] = useState(FALLBACK_ITEMS);

  const load = useCallback(async () => {
    try {
      const bundle = await getCmsBundleRequest();
      const { page, list } = pageList(bundle.pages, 'events', {
        stats: FALLBACK_STATS,
        items: FALLBACK_ITEMS,
      });
      if (page?.title) setTitle(page.title);
      if (page?.subtitle) setSubtitle(page.subtitle);
      if (page?.heroImageUrl) setHero(page.heroImageUrl);
      if (list.stats?.length) setStats(list.stats);
      if (list.items?.length) setItems(list.items);
    } catch {
      /* keep fallbacks */
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
