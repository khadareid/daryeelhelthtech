import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Phone, Send, Stethoscope, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import {
  useCreateMessageMutation,
  useGetConversationsQuery,
  useGetThreadQuery,
} from '@/Redex/service/messages/MessagesApi'
import { useGetUserProfileQuery } from '@/Redex/service/users/UsersApi'
import { cn } from '@/lib/utils'

function initials(name?: string | null) {
  const n = String(name || '').trim()
  if (!n || n === 'User' || n === 'Chat' || n === 'Contact' || n === 'Conversation') {
    return '?'
  }
  return n
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatWhen(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function isPlaceholderName(name?: string | null) {
  const t = String(name || '').trim().toLowerCase()
  return (
    !t ||
    t === 'user' ||
    t === 'chat' ||
    t === 'contact' ||
    t === 'conversation' ||
    t === 'unknown'
  )
}

function resolveName(...candidates: Array<string | null | undefined>): string {
  for (const c of candidates) {
    const t = String(c || '').trim()
    if (!isPlaceholderName(t)) return t
  }
  return ''
}

export default function MessagesSection() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const peerId = params.get('peer') || ''
  const nameFromUrl = params.get('name') || ''
  const { user } = useAuth()
  const myId = user?.userId || ''
  const myName = user?.name || 'You'

  const {
    data: conversations = [],
    isLoading: inboxLoading,
    refetch: refetchList,
  } = useGetConversationsQuery()

  const {
    data: threadRes,
    isLoading: threadLoading,
    refetch: refetchThread,
  } = useGetThreadQuery(peerId, {
    skip: !peerId,
    pollingInterval: peerId ? 8000 : 0,
  })

  const { data: peerProfile } = useGetUserProfileQuery(peerId, {
    skip: !peerId,
  })

  const [sendMessage, { isLoading: sending }] = useCreateMessageMutation()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const thread = threadRes?.messages ?? []

  const peerDisplayName = useMemo(() => {
    const fromList = conversations.find((c) => c.peerId === peerId)?.name
    const fromMsg =
      thread.find((m) => m.senderId !== myId)?.sender?.fullName ||
      thread.find((m) => m.senderId === myId)?.recipient?.fullName
    return (
      resolveName(
        threadRes?.peer?.name,
        peerProfile?.fullName,
        fromList,
        fromMsg,
        nameFromUrl,
      ) || 'Conversation'
    )
  }, [
    conversations,
    peerId,
    thread,
    myId,
    threadRes?.peer?.name,
    peerProfile?.fullName,
    nameFromUrl,
  ])

  const peerImage =
    threadRes?.peer?.image ||
    peerProfile?.avatarUrl ||
    peerProfile?.picture ||
    conversations.find((c) => c.peerId === peerId)?.image ||
    null

  const threads = useMemo(() => {
    const map = new Map(
      conversations.map((c) => [
        c.peerId,
        {
          peerId: c.peerId,
          name: resolveName(c.name) || 'Contact',
          image: c.image,
          preview: c.preview,
          at: c.at,
        },
      ]),
    )

    if (peerId) {
      const existing = map.get(peerId)
      map.set(peerId, {
        peerId,
        name: resolveName(peerDisplayName, existing?.name) || 'Contact',
        image: peerImage || existing?.image,
        preview: existing?.preview || 'Start a conversation',
        at: existing?.at || new Date().toISOString(),
      })
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    )
  }, [conversations, peerId, peerDisplayName, peerImage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.length, peerId])

  // Keep URL name in sync once we resolve the real name
  useEffect(() => {
    if (!peerId || isPlaceholderName(peerDisplayName)) return
    if (decodeURIComponent(nameFromUrl) === peerDisplayName) return
    navigate(
      `/dashboard?section=messages&peer=${encodeURIComponent(peerId)}&name=${encodeURIComponent(peerDisplayName)}`,
      { replace: true },
    )
  }, [peerId, peerDisplayName, nameFromUrl, navigate])

  const openChat = (id: string, name: string) => {
    navigate(
      `/dashboard?section=messages&peer=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`,
    )
  }

  async function onSend(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim() || !peerId || !myId) return
    try {
      await sendMessage({
        senderId: myId,
        recipientId: peerId,
        body: draft.trim(),
        recipientType: 'USER',
      }).unwrap()
      setDraft('')
      await Promise.all([refetchThread(), refetchList()])
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
        <h1 className="font-heading text-xl font-bold text-brand-dark sm:text-2xl">
          Messages
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chat with patients and professionals. Calls are coming soon.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Card className="overflow-hidden border-blue-100">
          <CardContent className="space-y-1 p-2 sm:p-3">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Conversations
            </p>
            {inboxLoading ? (
              <div className="space-y-2 p-1">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            ) : null}
            {!inboxLoading && threads.length === 0 ? (
              <div className="space-y-3 p-3 text-sm text-muted-foreground">
                <p>No chats yet.</p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/dashboard?section=doctors">
                    <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
                    Message a doctor
                  </Link>
                </Button>
              </div>
            ) : null}
            {threads.map((t) => {
              const active = peerId === t.peerId
              return (
                <button
                  key={t.peerId}
                  type="button"
                  onClick={() => openChat(t.peerId, t.name)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition',
                    active
                      ? 'bg-primary/10 ring-1 ring-primary/25'
                      : 'hover:bg-slate-50',
                  )}
                >
                  <Avatar className="h-11 w-11 shrink-0 border border-blue-100">
                    {t.image ? <AvatarImage src={t.image} alt={t.name} /> : null}
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                      {initials(t.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-heading text-sm font-semibold text-brand-dark">
                        {t.name}
                      </p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatWhen(t.at)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {t.preview}
                    </p>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-blue-100">
          <CardContent className="flex h-[min(70vh,640px)] flex-col p-0">
            {!peerId ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <UserRound className="h-7 w-7 text-primary" />
                </div>
                <p className="font-heading text-base font-semibold text-brand-dark">
                  Pick a conversation
                </p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Select someone on the left, or open a doctor profile and tap
                  Message.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-blue-50 bg-white px-4 py-3">
                  <Avatar className="h-12 w-12 border border-blue-100">
                    {peerImage ? (
                      <AvatarImage src={peerImage} alt={peerDisplayName} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                      {initials(peerDisplayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-lg font-bold text-brand-dark">
                      {peerDisplayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Chatting with{' '}
                      <span className="font-semibold text-brand-dark">
                        {peerDisplayName}
                      </span>
                      {' · '}
                      You are {myName}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex max-w-[11rem] flex-col items-start gap-0.5 rounded-xl border border-dashed border-slate-200 px-3 py-2 text-left text-xs font-semibold text-muted-foreground"
                    onClick={() =>
                      toast.message(`Call ${peerDisplayName} — coming soon`)
                    }
                    title={`Call ${peerDisplayName}`}
                  >
                    <span className="inline-flex items-center gap-1.5 text-brand-dark">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      Call
                    </span>
                    <span className="w-full truncate text-[10px] font-medium text-primary">
                      {peerDisplayName}
                    </span>
                  </button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto bg-[#F5F8FC] px-3 py-4 sm:px-5">
                  {threadLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="ml-auto h-12 w-2/3 rounded-2xl" />
                      <Skeleton className="h-12 w-1/2 rounded-2xl" />
                    </div>
                  ) : null}
                  {!threadLoading && thread.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      No messages with{' '}
                      <span className="font-semibold text-brand-dark">
                        {peerDisplayName}
                      </span>{' '}
                      yet. Say hello.
                    </p>
                  ) : null}
                  {thread.map((msg) => {
                    const mine = Boolean(myId) && msg.senderId === myId
                    const senderName = mine
                      ? 'You'
                      : resolveName(
                          msg.sender?.fullName,
                          peerDisplayName,
                        ) || peerDisplayName
                    return (
                      <div
                        key={msg.messageid}
                        className={cn(
                          'flex gap-2',
                          mine ? 'flex-row-reverse' : 'flex-row',
                        )}
                      >
                        {!mine ? (
                          <Avatar className="mt-1 h-8 w-8 shrink-0 border border-white">
                            {peerImage ? (
                              <AvatarImage src={peerImage} alt={senderName} />
                            ) : null}
                            <AvatarFallback className="bg-white text-[10px] font-semibold text-primary">
                              {initials(senderName)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-8 shrink-0" />
                        )}
                        <div
                          className={cn(
                            'max-w-[min(85%,28rem)] rounded-2xl px-3.5 py-2.5 shadow-sm',
                            mine
                              ? 'rounded-br-md bg-primary text-white'
                              : 'rounded-bl-md border border-blue-50 bg-white text-brand-dark',
                          )}
                        >
                          <p
                            className={cn(
                              'mb-1 text-[11px] font-semibold',
                              mine ? 'text-white/80' : 'text-primary',
                            )}
                          >
                            {senderName}
                          </p>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {msg.body}
                          </p>
                          <p
                            className={cn(
                              'mt-1.5 text-[10px]',
                              mine ? 'text-white/65' : 'text-muted-foreground',
                            )}
                          >
                            {formatWhen(String(msg.createdAt))}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                <form
                  className="flex items-end gap-2 border-t border-blue-50 bg-white p-3"
                  onSubmit={onSend}
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Message ${peerDisplayName}…`}
                    className="min-h-11 flex-1 rounded-2xl border border-blue-100 bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none ring-primary focus:ring-2"
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="h-11 shrink-0 rounded-2xl px-4"
                  >
                    <Send className="mr-1.5 h-4 w-4" />
                    Send
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
