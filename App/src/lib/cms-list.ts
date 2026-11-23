import type { CmsListBody, CmsListItem, CmsPage } from '@/lib/api';

export type { CmsListBody, CmsListItem };

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

export function parseCmsListBody(body: unknown): CmsListBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  const raw = body as CmsListBody;
  return {
    stats: Array.isArray(raw.stats) ? raw.stats : [],
    items: Array.isArray(raw.items)
      ? raw.items.map((item, i) => ({ ...item, slug: itemSlug(item, i) }))
      : [],
  };
}

export function pageList(
  pages: CmsPage[] | undefined,
  slug: string,
  fallback: CmsListBody,
): { page?: CmsPage; list: CmsListBody } {
  const page = pages?.find((p) => p.slug === slug);
  const parsed = parseCmsListBody(page?.body);
  if (parsed.items?.length) return { page, list: parsed };
  return { page, list: fallback };
}

export function findItem(list: CmsListBody, slug: string): CmsListItem | undefined {
  return list.items?.find((item, i) => itemSlug(item, i) === slug || item.id === slug);
}
