import { FormEvent, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useGetCmsQuery,
  useUpsertCmsMutation,
} from '@/Redex/service/admin/AdminApi'
import type { RootState } from '@/Redex/store/store'

type HomepageData = {
  brand?: string
  headline?: string
  subheadline?: string
  heroImageUrl?: string
  ctaPrimary?: { label?: string; href?: string }
  ctaSecondary?: { label?: string; href?: string }
  servicesTitle?: string
  services?: { title: string; desc: string }[]
}

export default function AdminCms() {
  const role = String(
    useSelector((s: RootState) => s.userInfo.role) || '',
  ).toUpperCase()
  const isSuper = role === 'SUPER_ADMIN'
  const { data, isLoading, isError } = useGetCmsQuery('homepage', {
    skip: !isSuper,
  })
  const [upsert, { isLoading: saving }] = useUpsertCmsMutation()

  const [brand, setBrand] = useState('Daryeel')
  const [headline, setHeadline] = useState('')
  const [subheadline, setSubheadline] = useState('')
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [ctaPrimaryLabel, setCtaPrimaryLabel] = useState('Find a doctor')
  const [ctaPrimaryHref, setCtaPrimaryHref] = useState('/doctors')
  const [ctaSecondaryLabel, setCtaSecondaryLabel] = useState('Browse hospitals')
  const [ctaSecondaryHref, setCtaSecondaryHref] = useState('/hospitals')
  const [servicesTitle, setServicesTitle] = useState('Care services')
  const [servicesText, setServicesText] = useState(
    'General Medicine | Primary care\nMaternity | Midwifery care',
  )
  const [published, setPublished] = useState(true)

  useEffect(() => {
    const d = (data?.data || {}) as HomepageData
    if (!data) return
    setBrand(d.brand || 'Daryeel')
    setHeadline(d.headline || '')
    setSubheadline(d.subheadline || '')
    setHeroImageUrl(d.heroImageUrl || '')
    setCtaPrimaryLabel(d.ctaPrimary?.label || 'Find a doctor')
    setCtaPrimaryHref(d.ctaPrimary?.href || '/doctors')
    setCtaSecondaryLabel(d.ctaSecondary?.label || 'Browse hospitals')
    setCtaSecondaryHref(d.ctaSecondary?.href || '/hospitals')
    setServicesTitle(d.servicesTitle || 'Care services')
    setServicesText(
      (d.services || [])
        .map((s) => `${s.title} | ${s.desc}`)
        .join('\n') || servicesText,
    )
    setPublished(data.published !== false)
  }, [data])

  if (!isSuper) {
    return (
      <p className="rounded-3xl border border-blue-100 bg-white p-6 text-sm text-muted-foreground">
        Homepage CMS requires SUPER_ADMIN.
      </p>
    )
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    const services = servicesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, ...rest] = line.split('|')
        return {
          title: (title || '').trim(),
          desc: rest.join('|').trim() || '',
        }
      })

    const payload: HomepageData = {
      brand,
      headline,
      subheadline,
      heroImageUrl,
      ctaPrimary: { label: ctaPrimaryLabel, href: ctaPrimaryHref },
      ctaSecondary: { label: ctaSecondaryLabel, href: ctaSecondaryHref },
      servicesTitle,
      services,
    }

    try {
      await upsert({
        key: 'homepage',
        body: { title: 'Homepage', data: payload, published },
      }).unwrap()
      toast.success('Homepage CMS saved — live on /')
    } catch (err: any) {
      toast.error(err?.data?.message || 'Save failed')
    }
  }

  return (
    <div className="space-y-4">
      <header className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          Homepage CMS
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit public landing content. Changes publish to the website home page.
        </p>
      </header>

      {isLoading ? <Skeleton className="h-48 rounded-2xl" /> : null}
      {isError ? (
        <p className="text-sm text-muted-foreground">
          No CMS row yet — fill the form and save to create homepage content.
        </p>
      ) : null}

      <form
        onSubmit={onSave}
        className="space-y-3 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            required
          />
          <Input
            placeholder="Hero image URL"
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
          />
        </div>
        <Input
          placeholder="Headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          required
        />
        <Textarea
          placeholder="Supporting sentence"
          value={subheadline}
          onChange={(e) => setSubheadline(e.target.value)}
          rows={3}
          required
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Primary CTA label"
            value={ctaPrimaryLabel}
            onChange={(e) => setCtaPrimaryLabel(e.target.value)}
          />
          <Input
            placeholder="Primary CTA href"
            value={ctaPrimaryHref}
            onChange={(e) => setCtaPrimaryHref(e.target.value)}
          />
          <Input
            placeholder="Secondary CTA label"
            value={ctaSecondaryLabel}
            onChange={(e) => setCtaSecondaryLabel(e.target.value)}
          />
          <Input
            placeholder="Secondary CTA href"
            value={ctaSecondaryHref}
            onChange={(e) => setCtaSecondaryHref(e.target.value)}
          />
        </div>
        <Input
          placeholder="Services section title"
          value={servicesTitle}
          onChange={(e) => setServicesTitle(e.target.value)}
        />
        <Textarea
          placeholder={'Services — one per line: Title | Description'}
          value={servicesText}
          onChange={(e) => setServicesText(e.target.value)}
          rows={6}
        />
        <label className="flex items-center gap-2 text-sm text-brand-dark">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Published on public site
        </label>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save homepage'}
        </Button>
      </form>
    </div>
  )
}
