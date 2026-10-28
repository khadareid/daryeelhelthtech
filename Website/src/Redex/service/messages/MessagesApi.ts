import { createApi } from '@reduxjs/toolkit/query/react';
import { apiBaseQuery } from '@/lib/apiBaseQuery';
import type { Message, MessageInput } from '@/Redex/types/Types';

/* ==================================================================
   RESPONSE SHAPES
================================================================== */

interface MessageResponse {
  isSuccess: boolean;
  message?: string;
  result?: Message;
  data?: Message;
}

interface PaginatedMessagesResult {
  isSuccess: boolean;
  data: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UnreadCountResponse {
  isSuccess: boolean;
  unreadCount: number;
}

/* ==================================================================
   FILTERS
================================================================== */

export interface MessageListFilters {
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
  isRead?: boolean;
  recipientId?: string;
  recipientType?: string;
  senderId?: string;
}

/* ==================================================================
   API
================================================================== */

export const MessagesApi = createApi({
  reducerPath: 'MessagesApi',
  baseQuery: apiBaseQuery,
  tagTypes: ['Messages', 'UnreadMessages'],
  endpoints: (builder) => ({
    /* ---------- CREATE ---------- */

    createMessage: builder.mutation<MessageResponse, MessageInput>({
      query: (body) => ({
        url: '/messages',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Messages', 'UnreadMessages'],
    }),

    /* ---------- ALL (sent + inbox) ---------- */

    getMessages: builder.query<PaginatedMessagesResult, MessageListFilters | void>({
      query: (params) => ({
        url: '/messages',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['Messages'],
    }),

    /* ---------- INBOX (received) ---------- */

    getInboxMessages: builder.query<PaginatedMessagesResult, MessageListFilters | void>({
      query: (params) => ({
        url: '/messages/inbox',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['Messages'],
    }),

    /* ---------- SENT ---------- */

    getSentMessages: builder.query<PaginatedMessagesResult, MessageListFilters | void>({
      query: (params) => ({
        url: '/messages/sent',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['Messages'],
    }),

    /* ---------- ONE ---------- */

    getConversations: builder.query<
      Array<{
        peerId: string
        name: string
        image?: string | null
        preview: string
        at: string
      }>,
      void
    >({
      query: () => ({
        url: '/messages/conversations',
        method: 'GET',
      }),
      transformResponse: (response: {
        result?: Array<{
          peerId: string
          name: string
          image?: string | null
          preview: string
          at: string
        }>
        data?: Array<{
          peerId: string
          name: string
          image?: string | null
          preview: string
          at: string
        }>
      }) => response.result ?? response.data ?? [],
      providesTags: ['Messages'],
    }),

    getThread: builder.query<
      {
        messages: Message[]
        peer: { userId: string; name: string; image?: string | null } | null
      },
      string
    >({
      query: (peerId) => ({
        url: `/messages/thread/${encodeURIComponent(peerId)}`,
        method: 'GET',
      }),
      transformResponse: (response: {
        result?: Message[]
        data?: Message[]
        peer?: { userId: string; name: string; image?: string | null } | null
      }) => {
        const list = response.result ?? response.data ?? []
        return {
          messages: Array.isArray(list) ? list : [],
          peer: response.peer ?? null,
        }
      },
      providesTags: (_r, _e, peerId) => [{ type: 'Messages', id: peerId }],
    }),

    getOneMessage: builder.query<Message, string>({
      query: (id) => ({
        url: `/messages/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: MessageResponse): Message =>
        (response.result ?? response.data ?? response) as Message,
      providesTags: (_r, _e, id) => [{ type: 'Messages', id }],
    }),

    /* ---------- MARK AS READ ---------- */

    markMessageAsRead: builder.mutation<{ isSuccess: boolean; message: string }, string>({
      query: (id) => ({
        url: `/messages/${id}/read`,
        method: 'PATCH',
        body: {},
      }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Messages', id }, 'Messages', 'UnreadMessages'],
    }),

    /* ---------- UNREAD COUNT ---------- */

    getUnreadCount: builder.query<UnreadCountResponse, void>({
      query: () => ({
        url: '/messages/unread-count',
        method: 'GET',
      }),
      providesTags: ['UnreadMessages'],
    }),

    /* ---------- DELETE ---------- */

    deleteMessage: builder.mutation<{ isSuccess: boolean; message: string }, string>({
      query: (id) => ({
        url: `/messages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Messages', id }, 'Messages', 'UnreadMessages'],
    }),
  }),
});

/* ==================================================================
   HOOKS
================================================================== */

export const {
  useCreateMessageMutation,
  useGetMessagesQuery,
  useGetInboxMessagesQuery,
  useGetSentMessagesQuery,
  useGetConversationsQuery,
  useGetThreadQuery,
  useGetOneMessageQuery,
  useMarkMessageAsReadMutation,
  useGetUnreadCountQuery,
  useDeleteMessageMutation,
} = MessagesApi;

/* ==================================================================
   LEGACY ALIASES — waafajin koodhka hore
================================================================== */
export const useCreateMessagesMutation = useCreateMessageMutation;
export const useGetUnreadMessagesCountQuery = useGetUnreadCountQuery;
