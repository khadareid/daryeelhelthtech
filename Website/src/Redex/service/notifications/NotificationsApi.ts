// src/service/notifications/NotificationsApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { apiBaseQuery } from '@/lib/apiBaseQuery';
import type {
  Notification,
  NotificationType,
  NotificationChannel,
} from '@/Redex/types/Types';

/* ==================================================================
   RESPONSE SHAPES
================================================================== */

interface PaginatedResult<T> {
  isSuccess: boolean;
  data: T[];
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

interface MarkAsReadResponse {
  isSuccess: boolean;
  message: string;
  notification: Notification;
}

interface MarkAllAsReadResponse {
  isSuccess: boolean;
  message: string;
  updatedCount: number;
}

/* ==================================================================
   FILTER TYPES (RTK Query params)
================================================================== */

export interface NotificationListFilters {
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
  isRead?: boolean;
  type?: NotificationType;
  channel?: NotificationChannel;
}

export interface NotificationHistoryFilters {
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
  type?: NotificationType;
  channel?: NotificationChannel;
  fromDate?: string;
  toDate?: string;
}

/* ==================================================================
   API
================================================================== */

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: apiBaseQuery,
  tagTypes: ['Notifications', 'UnreadCount'],
  endpoints: (builder) => ({
    /* ---------- LIST ---------- */

    listNotifications: builder.query<PaginatedResult<Notification>, NotificationListFilters | void>(
      {
        query: (params) => ({
          url: '/notifications',
          method: 'GET',
          params: params ?? undefined,
        }),
        providesTags: (result) =>
          result
            ? [
                ...result.data.map((n) => ({
                  type: 'Notifications' as const,
                  id: n.notificationid,
                })),
                { type: 'Notifications', id: 'LIST' },
              ]
            : [{ type: 'Notifications', id: 'LIST' }],
      },
    ),

    /* ---------- UNREAD COUNT ---------- */

    getUnreadCount: builder.query<UnreadCountResponse, void>({
      query: () => ({
        url: '/notifications/unread-count',
        method: 'GET',
      }),
      providesTags: ['UnreadCount'],
    }),

    /* ---------- GET ONE ---------- */

    getOneNotification: builder.query<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, id) => [{ type: 'Notifications', id }],
    }),

    /* ---------- MARK AS READ ---------- */

    markAsRead: builder.mutation<MarkAsReadResponse, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
        body: {},
      }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Notifications', id }, 'UnreadCount'],
    }),

    markAllAsRead: builder.mutation<MarkAllAsReadResponse, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
        body: {},
      }),
      invalidatesTags: ['Notifications', 'UnreadCount'],
    }),

    /* ---------- HISTORY ---------- */

    getNotificationHistory: builder.query<
      PaginatedResult<Notification>,
      NotificationHistoryFilters | void
    >({
      query: (params) => ({
        url: '/notifications/history',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['Notifications'],
    }),

    /* ---------- DELETE ---------- */

    deleteNotification: builder.mutation<{ isSuccess: boolean; message: string }, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Notifications', id },
        'Notifications',
        'UnreadCount',
      ],
    }),
  }),
});

/* ==================================================================
   HOOKS
================================================================== */

export const {
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useGetOneNotificationQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useGetNotificationHistoryQuery,
  useDeleteNotificationMutation,
} = notificationsApi;
