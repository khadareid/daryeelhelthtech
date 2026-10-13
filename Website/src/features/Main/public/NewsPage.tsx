import { Link } from 'react-router-dom'
import { BadgeCheck, Clock, Loader2, Newspaper, Plus } from 'lucide-react'
import { useSelector } from 'react-redux'
import {
  useCreateNewsPostMutation,
  useGetNewsFeedQuery,
} from '@/Redex/service/news/NewsApi'
import { formatNewsDate } from '@/constants/health-news'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/config/site'
import type { RootState } from '@/Redex/store/store'
import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function NewsPage() {
  const session = useSelector((s: RootState) => s.userInfo)
  const signedIn = Boolean(session.isAuthenticated && session.userId)
  const { data, isLoading, isError, refetch } = useGetNewsFeedQuery({
    page: 1,
    limit: 20,
  })
  const live = data?.data ?? []
  const [composer, setComposer] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [createPost, { isLoading: publishing }] = useCreateNewsPostMutation()

  async function onPublish(e: FormEvent) {
    e.preventDefault()
    await createPost({
      title,
      content,
      status: 'PUBLISHED',
      category: 'HEALTH_NEWS',
    }).unwrap()
    setTitle('')
    setContent('')
    setComposer(false)
    refetch()
  }

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <div className="container-page py-10 sm:py-12">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Newspaper className="h-3.5 w-3.5" />
            {siteConfig.appName}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
            Health news feed
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Community and professional updates. Do not post private patient
            information. Verified clinicians show a badge after admin approval.
          </p>
          {signedIn ? (
            <Button
              className="mt-4 gap-2"
              variant="outline"
              onClick={() => setComposer((v) => !v)}
            >
              <Plus className="h-4 w-4" />
              {composer ? 'Close composer' : 'Create post'}
            </Button>
          ) : (
            <Button asChild className="mt-4">
              <Link to="/signin">Sign in to post</Link>
            </Button>
          )}
        </div>

        {composer ? (
          <form
            onSubmit={onPublish}
            className="mt-6 space-y-3 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
          >
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Share a health tip or announcement…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
            />
            <Button type="submit" disabled={publishing}>
              {publishing ? 'Publishing…' : 'Publish'}
            </Button>
          </form>
        ) : null}

        {isLoading ? (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : null}

        {live.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((post) => (
              <Link
                key={post.newspostid}
                to={`/news/${post.newspostid}`}
                className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {post.category.replace(/_/g, ' ')}
                  {post.isOfficial ? ' · Official' : ''}
                </p>
                <h2 className="mt-2 font-heading text-lg font-semibold text-brand-dark">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {post.content}
                </p>
                <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  {post.author?.fullName || 'Author'}
                  {post.author?.verifiedProfessional ? (
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                  ) : null}
                  <span className="mx-1">·</span>
                  <Clock className="h-3 w-3" />
                  {post.publishedAt
                    ? formatNewsDate(post.publishedAt)
                    : 'Draft'}
                </p>
              </Link>
            ))}
          </div>
        ) : null}

        {!isLoading && (isError || live.length === 0) ? (
          <p className="mt-8 rounded-3xl border border-blue-100 bg-white p-6 text-sm text-muted-foreground shadow-sm">
            {isError
              ? 'Could not load the news feed. Try again later.'
              : 'No published posts yet.'}
          </p>
        ) : null}
      </div>
    </div>
  )
}
