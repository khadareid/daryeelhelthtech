import { FormEvent, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ArrowLeft, Heart, Loader2 } from 'lucide-react'
import { formatNewsDate } from '@/constants/health-news'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  useAddNewsCommentMutation,
  useGetNewsPostQuery,
  useReactToNewsMutation,
  useReportNewsMutation,
} from '@/Redex/service/news/NewsApi'
import type { RootState } from '@/Redex/store/store'

export default function NewsDetailPage() {
  const { id = '' } = useParams()
  const session = useSelector((s: RootState) => s.userInfo)
  const signedIn = Boolean(session.isAuthenticated && session.userId)
  const { data: live, isLoading, isError, refetch } = useGetNewsPostQuery(id, {
    skip: !id,
  })
  const [comment, setComment] = useState('')
  const [addComment, { isLoading: commenting }] = useAddNewsCommentMutation()
  const [react] = useReactToNewsMutation()
  const [report] = useReportNewsMutation()

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !live) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          Article not found
        </h1>
        <Button asChild className="mt-6">
          <Link to="/news">Back to news</Link>
        </Button>
      </div>
    )
  }

  async function onComment(e: FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return
    await addComment({ id, content: comment.trim() }).unwrap()
    setComment('')
    refetch()
  }

  return (
    <div className="bg-brand-bg pb-16">
      <div className="container-page space-y-6 py-8">
        <Link
          to="/news"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> All news
        </Link>
        <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {String(live.category || '').replace(/_/g, ' ')}
            {live.isOfficial ? ' · Official announcement' : ''}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-brand-dark">
            {live.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {live.author?.fullName}
            {live.author?.verifiedProfessional ? ' · Verified professional' : ''}
            {live.publishedAt
              ? ` · ${formatNewsDate(live.publishedAt)}`
              : ''}
          </p>
          <p className="mt-6 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
            {live.content}
          </p>
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
            This is general health information, not an individualized diagnosis.
            Do not share private medical details in comments.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={!signedIn}
              onClick={() => react({ id })}
            >
              <Heart className="h-3.5 w-3.5" />
              {live.reactionCount ?? 0} Like
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!signedIn}
              onClick={() =>
                report({
                  postId: id,
                  reason: 'MISINFORMATION',
                  details: 'User reported from web',
                })
              }
            >
              Report
            </Button>
          </div>
        </article>

        <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-brand-dark">
            Comments
          </h2>
          <div className="mt-3 space-y-2">
            {(live.comments ?? []).map((c: any) => (
              <div key={c.newscommentid} className="rounded-xl bg-brand-bg p-3 text-sm">
                <p className="font-medium text-brand-dark">
                  {c.author?.fullName || 'User'}
                </p>
                <p className="text-muted-foreground">{c.content}</p>
              </div>
            ))}
          </div>
          {signedIn ? (
            <form onSubmit={onComment} className="mt-4 space-y-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a respectful comment…"
                rows={3}
              />
              <Button type="submit" disabled={commenting || !comment.trim()}>
                {commenting ? 'Posting…' : 'Post comment'}
              </Button>
            </form>
          ) : (
            <Button asChild className="mt-4" variant="outline">
              <Link to="/signin">Sign in to comment</Link>
            </Button>
          )}
        </section>
      </div>
    </div>
  )
}

