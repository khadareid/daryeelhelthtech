// src/service/dailyHealthLog/DailyHealthLogApi.ts

import { createApi } from '@reduxjs/toolkit/query/react';
import { apiBaseQuery } from '@/lib/apiBaseQuery';

import {
  DailyHealthLog,
  DailyHealthLogInput,
  ApiResponse,
  MoodLevel,
  SleepQuality,
  StressLevel,
  EnergyLevel,
  ActivityLevel,
  PainLevel,
  HydrationStatus,
  GoalStatus,
  DailyLogSource,
} from '@/Redex/types/Types';

/* ==================================================================
   RESPONSE SHAPES
================================================================== */

interface DailyHealthLogResponse {
  isSuccess: boolean;
  message?: string;
  data?: DailyHealthLog;
  result?: DailyHealthLog;
}

interface DailyHealthLogsResponse {
  isSuccess: boolean;
  message?: string;
  data: DailyHealthLog[];
  count?: number;
  total?: number;
}

interface DeleteDailyHealthLogResponse {
  isSuccess: boolean;
  message: string;
}

/* ==================================================================
   FILTERS
================================================================== */

export interface DailyHealthLogFilters {
  limit?: number;
  startDate?: string;
  endDate?: string;
  source?: DailyLogSource;
  mood?: MoodLevel;
  sleepQuality?: SleepQuality;
  stressLevel?: StressLevel;
  energyLevel?: EnergyLevel;
  activityLevel?: ActivityLevel;
  painLevel?: PainLevel;
  hydrationStatus?: HydrationStatus;
  goalStatus?: GoalStatus;
}

/* ==================================================================
   UPDATE INPUT
================================================================== */

export type DailyHealthLogUpdateInput =
  Partial<Omit<DailyHealthLogInput, 'userId' | 'date'>>;

/* ==================================================================
   API
================================================================== */

export const dailyHealthLogApi = createApi({
  reducerPath: 'dailyHealthLogApi',

  baseQuery: apiBaseQuery,

  tagTypes: ['DailyHealthLog'],

  endpoints: (builder) => ({

    /* ================================================================
       CREATE DAILY HEALTH LOG
    ================================================================ */

    createDailyHealthLog: builder.mutation<
      DailyHealthLogResponse,
      DailyHealthLogInput
    >({
      query: (body) => ({
        url: '/daily-health-log',
        method: 'POST',
        body,
      }),

      invalidatesTags: [
        { type: 'DailyHealthLog', id: 'LIST' },
        { type: 'DailyHealthLog', id: 'TODAY' },
      ],
    }),


    /* ================================================================
       GET TODAY'S DAILY HEALTH LOG
    ================================================================ */

    getTodayDailyHealthLog: builder.query<
      DailyHealthLog | null,
      void
    >({
      query: () => ({
        url: '/daily-health-log/today',
        method: 'GET',
      }),

      transformResponse: (
        response: DailyHealthLogResponse
      ) => response.data ?? response.result ?? null,

      providesTags: [
        { type: 'DailyHealthLog', id: 'TODAY' },
      ],
    }),


    /* ================================================================
       GET DAILY HEALTH LOG BY DATE
    ================================================================ */

    getDailyHealthLogByDate: builder.query<
      DailyHealthLog,
      string
    >({
      query: (date) => ({
        url: `/daily-health-log/${date}`,
        method: 'GET',
      }),

      transformResponse: (
        response: DailyHealthLogResponse
      ) => {
        const log =
          response.data ??
          response.result;

        if (!log) {
          throw new Error(
            'Daily health log not found'
          );
        }

        return log;
      },

      providesTags: (_result, _error, date) => [
        {
          type: 'DailyHealthLog',
          id: date,
        },
      ],
    }),


    /* ================================================================
       GET DAILY HEALTH HISTORY
    ================================================================ */

    getDailyHealthHistory: builder.query<
      DailyHealthLog[],
      DailyHealthLogFilters | void
    >({
      query: (params) => ({
        url: '/daily-health-log/history',
        method: 'GET',
        params: params ?? undefined,
      }),

      transformResponse: (
        response: DailyHealthLogsResponse
      ) => response.data ?? [],

      providesTags: (result) => [
        { type: 'DailyHealthLog', id: 'LIST' },

        ...(result ?? []).map((log) => ({
          type: 'DailyHealthLog' as const,
          id:
            typeof log.date === 'string'
              ? log.date
              : log.date.toISOString(),
        })),
      ],
    }),


    /* ================================================================
       UPDATE DAILY HEALTH LOG
    ================================================================ */

    updateDailyHealthLog: builder.mutation<
      DailyHealthLogResponse,
      {
        date: string;
        data: DailyHealthLogUpdateInput;
      }
    >({
      query: ({ date, data }) => ({
        url: `/daily-health-log/${date}`,
        method: 'PUT',
        body: data,
      }),

      invalidatesTags: (_result, _error, { date }) => [
        { type: 'DailyHealthLog', id: date },
        { type: 'DailyHealthLog', id: 'TODAY' },
        { type: 'DailyHealthLog', id: 'LIST' },
      ],
    }),


    /* ================================================================
       DELETE DAILY HEALTH LOG
    ================================================================ */

    deleteDailyHealthLog: builder.mutation<
      DeleteDailyHealthLogResponse,
      string
    >({
      query: (date) => ({
        url: `/daily-health-log/${date}`,
        method: 'DELETE',
      }),

      invalidatesTags: (_result, _error, date) => [
        { type: 'DailyHealthLog', id: date },
        { type: 'DailyHealthLog', id: 'TODAY' },
        { type: 'DailyHealthLog', id: 'LIST' },
      ],
    }),


    /* ================================================================
       GET DAILY LOGS BY DATE RANGE
       ================================================================ */

    getDailyHealthLogsByDateRange: builder.query<
      DailyHealthLog[],
      {
        startDate: string;
        endDate: string;
      }
    >({
      query: ({ startDate, endDate }) => ({
        url: '/daily-health-log/history',
        method: 'GET',
        params: {
          startDate,
          endDate,
        },
      }),

      transformResponse: (
        response: DailyHealthLogsResponse
      ) => response.data ?? [],

      providesTags: [
        { type: 'DailyHealthLog', id: 'LIST' },
      ],
    }),

  }),
});


/* ==================================================================
   HOOKS
================================================================== */

export const {
  // Create
  useCreateDailyHealthLogMutation,

  // Today
  useGetTodayDailyHealthLogQuery,

  // By date
  useGetDailyHealthLogByDateQuery,

  // History
  useGetDailyHealthHistoryQuery,

  // Date range
  useGetDailyHealthLogsByDateRangeQuery,

  // Update
  useUpdateDailyHealthLogMutation,

  // Delete
  useDeleteDailyHealthLogMutation,

} = dailyHealthLogApi;