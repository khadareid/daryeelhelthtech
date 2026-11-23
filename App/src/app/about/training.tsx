import { useCallback, useEffect, useState } from 'react';

import { CmsListScreen } from '@/components/cms-list-screen';
import { pageList } from '@/lib/cms-list';
import {
  getCmsBundleRequest,
  type CmsListItem,
  type CmsListStat,
} from '@/lib/api';

const FALLBACK_STATS: CmsListStat[] = [
  { value: '12+', label: 'Programmes' },
  { value: '500+', label: 'Learners' },
  { value: '40+', label: 'Partners' },
  { value: '4', label: 'Tracks' },
];

const FALLBACK_ITEMS: CmsListItem[] = [
  {
    slug: 'clinical-digital-skills',
    title: 'Clinical Digital Skills',
    meta: '2 weeks · Clinicians',
    tag: 'Clinicians',
    description: 'EHR basics, appointments, referrals, and patient privacy.',
    content:
      'This programme equips clinicians with practical digital skills for everyday care.\n\nYou will learn EHR workflows, bookings, referrals, and privacy basics.',
    image:
      'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    slug: 'hospital-system-onboarding',
    title: 'Hospital System Onboarding',
    meta: '1 week · Operations',
    tag: 'Hospitals',
    description: 'Partner setup, doctor rosters, scheduling, and visit tracking.',
    image:
      'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    slug: 'community-health-facilitator',
    title: 'Community Health Facilitator',
    meta: '3 days · Outreach',
    tag: 'Outreach',
    description: 'Health education, family onboarding, and emergency awareness.',
    image:
      'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    slug: 'leadership-in-digital-health',
    title: 'Leadership in Digital Health',
    meta: '4 days · Managers',
    tag: 'Leadership',
    description: 'Strategy, quality oversight, and partner network growth.',
    image:
      'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

export default function TrainingScreen() {
  const [title, setTitle] = useState('Training programmes');
  const [subtitle, setSubtitle] = useState(
    'Practical digital health training for clinicians, hospitals, and community partners.',
  );
  const [hero, setHero] = useState(
    'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1200',
  );
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [items, setItems] = useState(FALLBACK_ITEMS);

  const load = useCallback(async () => {
    try {
      const bundle = await getCmsBundleRequest();
      const { page, list } = pageList(bundle.pages, 'training', {
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
