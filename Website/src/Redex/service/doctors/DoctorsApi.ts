import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "@/lib/apiBaseQuery";
import { unwrapList, unwrapResult } from "@/Redex/lib/ownedApi";
import type { ApiResponse, Doctor, Paginated } from "@/Redex/types/Types";

export const doctorDisplayName = (d?: Partial<Doctor> | null) => {
  const name = (d?.fullName || "").trim();
  if (!name) return "Doctor";
  if (/^dr\.?\s/i.test(name)) return name.replace(/^dr\.?\s+/i, "Dr. ");
  return `Dr. ${name}`;
};

export const doctorPhoto = (d?: Partial<Doctor> | null) =>
  d?.profileImage || "/images/doctor-placeholder.jpg";

export const doctorsApi = createApi({
  reducerPath: "doctorsApi",
  baseQuery: apiBaseQuery,
  tagTypes: ["Doctors", "DoctorMe"],
  endpoints: (builder) => ({
    listDoctors: builder.query<
      Doctor[],
      | {
          page?: number;
          limit?: number;
          q?: string;
          search?: string;
          specialty?: string;
          city?: string;
        }
      | void
    >({
      query: (params) => {
        const p = params || {};
        return {
          url: "/doctors",
          params: {
            page: p.page,
            limit: p.limit,
            q: p.q || p.search,
            specialty: p.specialty,
            city: p.city,
          },
        };
      },
      transformResponse: (
        res: ApiResponse<Paginated<Doctor> | Doctor[]>
      ) => unwrapList(res),
      providesTags: ["Doctors"],
    }),
    getDoctor: builder.query<Doctor, string>({
      query: (id) => `/doctors/${id}`,
      transformResponse: (res: ApiResponse<Doctor>) => unwrapResult(res),
      providesTags: (_r, _e, id) => [{ type: "Doctors", id }],
    }),
    getMyDoctorProfile: builder.query<Doctor | null, void>({
      query: () => "/doctor/me",
      transformResponse: (res: ApiResponse<Doctor | null>) =>
        unwrapResult(res) ?? null,
      providesTags: ["DoctorMe"],
    }),
    upsertMyDoctorProfile: builder.mutation<
      Doctor,
      Partial<Doctor> & { resubmit?: boolean }
    >({
      query: (body) => ({ url: "/doctor/me", method: "PUT", body }),
      transformResponse: (res: ApiResponse<Doctor>) => unwrapResult(res),
      invalidatesTags: ["DoctorMe", "Doctors"],
    }),
  }),
});

export const {
  useListDoctorsQuery,
  useGetDoctorQuery,
  useGetMyDoctorProfileQuery,
  useUpsertMyDoctorProfileMutation,
} = doctorsApi;
