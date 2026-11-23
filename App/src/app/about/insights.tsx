import { useCallback, useEffect, useState } from 'react';

import { CmsListScreen } from '@/components/cms-list-screen';
import { pageList } from '@/lib/cms-list';
import {
  getCmsBundleRequest,
  type CmsListItem,
  type CmsListStat,
} from '@/lib/api';

const FALLBACK_STATS: CmsListStat[] = [
  { value: '5', label: 'Articles' },
  { value: '4', label: 'Topics' },
  { value: '5', label: 'Min avg' },
  { value: 'New', label: 'Weekly' },
];

const FALLBACK_ITEMS: CmsListItem[] = [
  {
    slug: 'why-one-health-identity-matters',
    title: 'Why digital health records matter in Somaliland',
    meta: 'Health systems · 8 min',
    tag: 'Digital Health',
    description:
      'How unified records reduce wait times and improve continuity of care.',
    content:
      'When families visit different clinics, history is easy to lose.\n\nA shared digital identity keeps allergies, medications, and visits with the patient.',
    image:
      'https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    slug: 'family-emergency-cards',
    title: 'Five tips for safer family emergency cards',
    meta: 'Family care · 5 min',
    tag: 'Family',
    description:
      'Keep blood type, allergies, and contacts ready when minutes matter.',
    image:
      'https://images.pexels.com/photos/4226119/pexels-photo-4226119.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    slug: 'hospital-partner-networks',
    title: 'How hospitals grow with partner networks',
    meta: 'Operations · 6 min',
    tag: 'Hospitals',
    description:
      'Digital bookings and doctor visibility expand reach without new buildings.',
    image:
      'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    slug: 'telemedicine-local-workflows',
    title: 'Telemedicine that fits local workflows',
    meta: 'Innovation · 7 min',
    tag: 'Innovation',
    description:
      'Designing remote consults that clinicians and families actually use.',
    image:
      'https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    slug: 'emergency-cards-every-second',
    title: 'Emergency cards that work when every second counts',
    meta: 'Product · 3 min',
    tag: 'Product',
    description:
      'Quick access to blood type, allergies, and emergency contacts.',
    image:
      'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

export default function InsightsScreen() {
  const [title, setTitle] = useState('Insights');
  const [subtitle, setSubtitle] = useState(
    'Practical articles on digital health, family care, and hospital operations.',
  );
  const [hero, setHero] = useState(
    'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1200',
  );
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [items, setItems] = useState(FALLBACK_ITEMS);

  const load = useCallback(async () => {
    try {
      const bundle = await getCmsBundleRequest();
      const { page, list } = pageList(bundle.pages, 'insights', {
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
