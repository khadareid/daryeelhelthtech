import type { CmsListBody, CmsListItem, CmsListStat, CmsPage } from '@/lib/api';

export type { CmsListBody, CmsListItem };
export type ListPageSlug = 'training' | 'events' | 'insights';

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function itemSlug(item: CmsListItem, index = 0): string {
  return item.slug || item.id || `${slugifyTitle(item.title || 'item')}-${index}`;
}

function asObject(body: unknown): Record<string, unknown> | null {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
    return null;
  }
  if (typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }
  return null;
}

export function parseCmsListBody(body: unknown): CmsListBody {
  const raw = asObject(body);
  if (!raw) return {};
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  return {
    stats: Array.isArray(raw.stats) ? (raw.stats as CmsListStat[]) : [],
    items: itemsRaw.map((item, i) => {
      const row = (item || {}) as CmsListItem;
      return { ...row, slug: itemSlug(row, i) };
    }),
  };
}

export const TRAINING_DEFAULTS: CmsListBody = {
  stats: [
    { value: '12+', label: 'Programmes' },
    { value: '500+', label: 'Learners' },
    { value: '40+', label: 'Partners' },
    { value: '4', label: 'Tracks' },
  ],
  items: [
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
      points: ['Records', 'Bookings', 'Consent'],
    },
    {
      slug: 'hospital-system-onboarding',
      title: 'Hospital System Onboarding',
      meta: '1 week · Operations',
      tag: 'Hospitals',
      description: 'Partner setup, doctor rosters, scheduling, and visit tracking.',
      image:
        'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
      points: ['Rosters', 'Ops', 'Payments'],
    },
    {
      slug: 'community-health-facilitator',
      title: 'Community Health Facilitator',
      meta: '3 days · Outreach',
      tag: 'Outreach',
      description: 'Health education, family onboarding, and emergency awareness.',
      image:
        'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800',
      points: ['Outreach', 'Families', 'Safety'],
    },
    {
      slug: 'leadership-in-digital-health',
      title: 'Leadership in Digital Health',
      meta: '4 days · Managers',
      tag: 'Leadership',
      description: 'Strategy, quality oversight, and partner network growth.',
      image:
        'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800',
      points: ['Strategy', 'Quality', 'Growth'],
    },
  ],
};

export const EVENTS_DEFAULTS: CmsListBody = {
  stats: [
    { value: '4', label: 'Upcoming' },
    { value: '2', label: 'Cities' },
    { value: '1', label: 'Online' },
    { value: 'Free', label: 'Most sessions' },
  ],
  items: [
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
  ],
};

export const INSIGHTS_DEFAULTS: CmsListBody = {
  stats: [
    { value: '5', label: 'Articles' },
    { value: '4', label: 'Topics' },
    { value: '5', label: 'Min avg' },
    { value: 'New', label: 'Weekly' },
  ],
  items: [
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
  ],
};

export function defaultsForSlug(slug: ListPageSlug): CmsListBody {
  if (slug === 'events') return EVENTS_DEFAULTS;
  if (slug === 'insights') return INSIGHTS_DEFAULTS;
  return TRAINING_DEFAULTS;
}

export function pageList(
  pages: CmsPage[] | undefined,
  slug: ListPageSlug | string,
  fallback?: CmsListBody,
): { page?: CmsPage; list: CmsListBody } {
  const page = pages?.find((p) => p.slug === slug);
  const parsed = parseCmsListBody(page?.body);
  const defaults =
    fallback ||
    (slug === 'training' || slug === 'events' || slug === 'insights'
      ? defaultsForSlug(slug)
      : { items: [] });
  if (parsed.items?.length) return { page, list: parsed };
  return {
    page,
    list: {
      stats: parsed.stats?.length ? parsed.stats : defaults.stats,
      items: defaults.items || [],
    },
  };
}

export function normalizeParamSlug(slug: string | string[] | undefined): string {
  const raw = Array.isArray(slug) ? slug[0] : slug;
  if (!raw) return '';
  try {
    return decodeURIComponent(String(raw)).trim();
  } catch {
    return String(raw).trim();
  }
}

export function findItem(
  list: CmsListBody,
  slug: string,
): CmsListItem | undefined {
  const target = normalizeParamSlug(slug);
  if (!target) return undefined;
  const items = list.items || [];

  const exact = items.find(
    (item, i) =>
      itemSlug(item, i) === target ||
      item.slug === target ||
      item.id === target,
  );
  if (exact) return exact;

  // CMS seed often has no slug → generated as "title-0"; home may use clean slug
  const byTitle = items.find((item) => slugifyTitle(item.title || '') === target);
  if (byTitle) return byTitle;

  // "item-0" style from older home preview links
  const itemIndex = /^item-(\d+)$/.exec(target);
  if (itemIndex) {
    const i = Number(itemIndex[1]);
    if (items[i]) return items[i];
  }

  // Strip trailing -N index suffix and match slugify(title)
  const stripped = target.replace(/-\d+$/, '');
  if (stripped && stripped !== target) {
    return items.find(
      (item, i) =>
        slugifyTitle(item.title || '') === stripped ||
        item.slug === stripped ||
        itemSlug(item, i).replace(/-\d+$/, '') === stripped,
    );
  }

  return undefined;
}

/** Load list + resolve one item for detail screens. */
export function resolveListItem(
  pages: CmsPage[] | undefined,
  kind: ListPageSlug,
  slug: string | string[] | undefined,
): CmsListItem | null {
  const { list } = pageList(pages, kind, defaultsForSlug(kind));
  return findItem(list, normalizeParamSlug(slug)) || null;
}
