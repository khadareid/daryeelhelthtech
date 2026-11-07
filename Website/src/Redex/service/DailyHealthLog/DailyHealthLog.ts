import { createApi } from "@reduxjs/toolkit/query/react"
import { apiBaseQuery } from "@/lib/apiBaseQuery"
import { unwrapList, unwrapResult } from "@/Redex/lib/ownedApi"
import type {
  ApiResponse,
  DailyHealthLog,
  DailyHealthLogInput,
  Paginated,
} from "@/Redex/types/Types"

export const dailyHealthLogApi = createApi({
  reducerPath: "dailyHealthLogApi",
  baseQuery: apiBaseQuery,
  tagTypes: ["DailyHealthLog"],
  endpoints: (builder) => ({
    createDailyHealthLog: builder.mutation<DailyHealthLog, DailyHealthLogInput>({
      query: (body) => ({
        url: "/daily-health-logs",
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiResponse<DailyHealthLog>) => unwrapResult(res),
      invalidatesTags: [{ type: "DailyHealthLog", id: "LIST" }],
    }),

    getDailyHealthHistory: builder.query<
      DailyHealthLog[],
      { page?: number; limit?: number; startDate?: string; endDate?: string } | void
    >({
      query: (params) => ({
        url: "/daily-health-logs",
        method: "GET",
        params: params ?? undefined,
      }),
      transformResponse: (res: ApiResponse<Paginated<DailyHealthLog> | DailyHealthLog[]>) =>
        unwrapList(res),
      providesTags: [{ type: "DailyHealthLog", id: "LIST" }],
    }),

    getDailyHealthLogById: builder.query<DailyHealthLog, string>({
      query: (id) => ({
        url: `/daily-health-logs/${id}`,
        method: "GET",
      }),
      transformResponse: (res: ApiResponse<DailyHealthLog>) => unwrapResult(res),
      providesTags: (_r, _e, id) => [{ type: "DailyHealthLog", id }],
    }),

    deleteDailyHealthLog: builder.mutation<{ isSuccess: boolean; message?: string }, string>({
      query: (id) => ({
        url: `/daily-health-logs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "DailyHealthLog", id: "LIST" }],
    }),
  }),
})

export const {
  useCreateDailyHealthLogMutation,
  useGetDailyHealthHistoryQuery,
  useGetDailyHealthLogByIdQuery,
  useDeleteDailyHealthLogMutation,
} = dailyHealthLogApi

/** @deprecated prefer useGetDailyHealthHistoryQuery */
export const useGetTodayDailyHealthLogQuery = (
  _arg?: void,
  options?: Parameters<typeof useGetDailyHealthHistoryQuery>[1]
) => {
  const result = useGetDailyHealthHistoryQuery({ limit: 1 }, options)
  const today = new Date().toISOString().slice(0, 10)
  const log =
    result.data?.find((l) => String(l.date).slice(0, 10) === today) ??
    result.data?.[0] ??
    null
  return { ...result, data: log }
}
