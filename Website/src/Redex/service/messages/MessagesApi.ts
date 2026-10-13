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

    getThread: builder.query<Message[], string>({
      query: (peerId) => ({
        url: `/messages/thread/${peerId}`,
        method: 'GET',
      }),
      transformResponse: (response: {
        result?: Message[]
        data?: Message[]
      }): Message[] => {
        const list = response.result ?? response.data ?? []
        return Array.isArray(list) ? list : []
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
