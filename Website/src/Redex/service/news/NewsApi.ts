import { createApi } from '@reduxjs/toolkit/query/react'
import { apiBaseQuery } from '@/lib/apiBaseQuery'

export type NewsPost = {
  newspostid: string
  title: string
  content: string
  category: string
  status: string
  coverImageUrl?: string | null
  isOfficial?: boolean
  publishedAt?: string | null
  commentCount?: number
  reactionCount?: number
  author?: {
    userid: string
    fullName: string
    verifiedProfessional?: boolean
    specialization?: string | null
    avatarUrl?: string | null
  }
}

export const newsApi = createApi({
  reducerPath: 'newsApi',
  baseQuery: apiBaseQuery,
  tagTypes: ['News', 'NewsDetail'],
  endpoints: (builder) => ({
    getNewsFeed: builder.query<
      { data: NewsPost[]; pagination: any },
      { page?: number; limit?: number; category?: string; search?: string } | void
    >({
      query: (params) => ({
        url: '/news',
        params: params ?? { page: 1, limit: 12 },
      }),
      providesTags: ['News'],
    }),
    getNewsPost: builder.query<any, string>({
      query: (id) => ({ url: `/news/${id}` }),
      transformResponse: (r: any) => r.result ?? r,
      providesTags: (_r, _e, id) => [{ type: 'NewsDetail', id }],
    }),
    createNewsPost: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: '/news', method: 'POST', body }),
      invalidatesTags: ['News'],
    }),
    addNewsComment: builder.mutation<any, { id: string; content: string; parentCommentId?: string }>({
      query: ({ id, ...body }) => ({
        url: `/news/${id}/comments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'NewsDetail', id }, 'News'],
    }),
    reactToNews: builder.mutation<any, { id: string; reactionType?: string }>({
      query: ({ id, reactionType }) => ({
        url: `/news/${id}/reactions`,
        method: 'POST',
        body: { reactionType: reactionType || 'LIKE' },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'NewsDetail', id }, 'News'],
    }),
    removeNewsReaction: builder.mutation<any, string>({
      query: (id) => ({
        url: `/news/${id}/reactions`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [{ type: 'NewsDetail', id }, 'News'],
    }),
    reportNews: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: '/news/reports', method: 'POST', body }),
    }),
    submitProfessionalApplication: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({
        url: '/professional-applications',
        method: 'POST',
        body,
      }),
    }),
    getMyProfessionalApplications: builder.query<any[], void>({
      query: () => ({ url: '/professional-applications/mine' }),
      transformResponse: (r: any) => r.result ?? [],
    }),
  }),
})

export const {
  useGetNewsFeedQuery,
  useGetNewsPostQuery,
  useCreateNewsPostMutation,
  useAddNewsCommentMutation,
  useReactToNewsMutation,
  useRemoveNewsReactionMutation,
  useReportNewsMutation,
  useSubmitProfessionalApplicationMutation,
  useGetMyProfessionalApplicationsQuery,
} = newsApi
