import { createApi } from "@reduxjs/toolkit/query/react"
import { apiBaseQuery } from "@/lib/apiBaseQuery"
import { unwrapList, unwrapResult } from "@/Redex/lib/ownedApi"
import type {
  ApiResponse,
  Notification,
  NotificationChannel,
  NotificationType,
  Paginated,
} from "@/Redex/types/Types"

export interface NotificationListFilters {
  page?: number
  limit?: number
  isRead?: boolean
  type?: NotificationType
  channel?: NotificationChannel
}

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: apiBaseQuery,
  tagTypes: ["Notifications", "UnreadCount"],
  endpoints: (builder) => ({
    listNotifications: builder.query<Notification[], NotificationListFilters | void>({
      query: (params) => ({
        url: "/notifications",
        method: "GET",
        params: params ?? undefined,
      }),
      transformResponse: (res: ApiResponse<Paginated<Notification> | Notification[]>) =>
        unwrapList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.map((n) => ({
                type: "Notifications" as const,
                id: n.id || n.notificationid,
              })),
              { type: "Notifications", id: "LIST" },
            ]
          : [{ type: "Notifications", id: "LIST" }],
    }),

    getOneNotification: builder.query<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "GET",
      }),
      transformResponse: (res: ApiResponse<Notification>) => unwrapResult(res),
      providesTags: (_r, _e, id) => [{ type: "Notifications", id }],
    }),

    markAsRead: builder.mutation<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
        body: {},
      }),
      transformResponse: (res: ApiResponse<Notification>) => unwrapResult(res),
      invalidatesTags: (_r, _e, id) => [
        { type: "Notifications", id },
        "UnreadCount",
        { type: "Notifications", id: "LIST" },
      ],
    }),

    markAllAsRead: builder.mutation<{ isSuccess: boolean }, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "POST",
        body: {},
      }),
      invalidatesTags: ["Notifications", "UnreadCount"],
    }),

    deleteNotification: builder.mutation<{ isSuccess: boolean; message?: string }, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications", "UnreadCount"],
    }),
  }),
})

export const {
  useListNotificationsQuery,
  useGetOneNotificationQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi

/** Compatibility shim — compute unread from list */
export function useGetUnreadCountQuery(_arg?: void, options?: Parameters<typeof useListNotificationsQuery>[1]) {
  const result = useListNotificationsQuery({ limit: 100, isRead: false }, options)
  return {
    ...result,
    data: {
      isSuccess: true,
      unreadCount: result.data?.length ?? 0,
    },
  }
}
