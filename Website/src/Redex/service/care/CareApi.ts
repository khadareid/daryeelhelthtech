import { createApi } from "@reduxjs/toolkit/query/react"
import { apiBaseQuery } from "@/lib/apiBaseQuery"
import { unwrapList, unwrapResult } from "@/Redex/lib/ownedApi"
import type {
  ApiResponse,
  Consultation,
  DoctorReview,
  Paginated,
  Payment,
} from "@/Redex/types/Types"

export const careApi = createApi({
  reducerPath: "careApi",
  baseQuery: apiBaseQuery,
  tagTypes: ["Consultations", "DoctorReviews", "Payments"],
  endpoints: (builder) => ({
    listConsultations: builder.query<Consultation[], Record<string, unknown> | void>({
      query: (params) => ({
        url: "/consultations",
        params: params ?? undefined,
      }),
      transformResponse: (res: ApiResponse<Paginated<Consultation> | Consultation[]>) =>
        unwrapList(res),
      providesTags: [{ type: "Consultations", id: "LIST" }],
    }),
    createConsultation: builder.mutation<Consultation, Partial<Consultation>>({
      query: (body) => ({ url: "/consultations", method: "POST", body }),
      transformResponse: (res: ApiResponse<Consultation>) => unwrapResult(res),
      invalidatesTags: [{ type: "Consultations", id: "LIST" }],
    }),
    updateConsultation: builder.mutation<
      Consultation,
      { id: string; data: Partial<Consultation> }
    >({
      query: ({ id, data }) => ({
        url: `/consultations/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (res: ApiResponse<Consultation>) => unwrapResult(res),
      invalidatesTags: [{ type: "Consultations", id: "LIST" }],
    }),

    listDoctorReviews: builder.query<DoctorReview[], Record<string, unknown> | void>({
      query: (params) => ({
        url: "/doctor-reviews",
        params: params ?? undefined,
      }),
      transformResponse: (res: ApiResponse<Paginated<DoctorReview> | DoctorReview[]>) =>
        unwrapList(res),
      providesTags: [{ type: "DoctorReviews", id: "LIST" }],
    }),
    createDoctorReview: builder.mutation<DoctorReview, Partial<DoctorReview>>({
      query: (body) => ({ url: "/doctor-reviews", method: "POST", body }),
      transformResponse: (res: ApiResponse<DoctorReview>) => unwrapResult(res),
      invalidatesTags: [{ type: "DoctorReviews", id: "LIST" }],
    }),

    listPayments: builder.query<Payment[], Record<string, unknown> | void>({
      query: (params) => ({
        url: "/payments",
        params: params ?? undefined,
      }),
      transformResponse: (res: ApiResponse<Paginated<Payment> | Payment[]>) =>
        unwrapList(res),
      providesTags: [{ type: "Payments", id: "LIST" }],
    }),
    createPayment: builder.mutation<
      Payment,
      Partial<Payment> & {
        appointmentId?: string
        amount?: number
        method?: string
        status?: string
        provider?: string
        transactionId?: string
      }
    >({
      query: (body) => ({ url: "/payments", method: "POST", body }),
      transformResponse: (res: ApiResponse<Payment>) => unwrapResult(res),
      invalidatesTags: [{ type: "Payments", id: "LIST" }],
    }),
    updatePayment: builder.mutation<
      Payment,
      {
        id: string
        data: Partial<Payment> & {
          status?: string
          method?: string
          provider?: string
          transactionId?: string
        }
      }
    >({
      query: ({ id, data }) => ({
        url: `/payments/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (res: ApiResponse<Payment>) => unwrapResult(res),
      invalidatesTags: [{ type: "Payments", id: "LIST" }],
    }),
  }),
})

export const {
  useListConsultationsQuery,
  useCreateConsultationMutation,
  useUpdateConsultationMutation,
  useListDoctorReviewsQuery,
  useCreateDoctorReviewMutation,
  useListPaymentsQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
} = careApi
