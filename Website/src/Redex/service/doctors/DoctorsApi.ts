import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "@/lib/apiBaseQuery";
import { unwrapList, unwrapResult } from "@/Redex/lib/ownedApi";
import type {
  ApiResponse,
  Doctor,
  DoctorSchedule,
  DoctorTimeOff,
  Paginated,
} from "@/Redex/types/Types";

export const doctorDisplayName = (d?: Partial<Doctor> | null) => {
  const name = (d?.fullName || "").trim();
  if (!name) return "Doctor";
  if (/^dr\.?\s/i.test(name)) return name.replace(/^dr\.?\s+/i, "Dr. ");
  return `Dr. ${name}`;
};

/** Real photo URL only — undefined when missing so UI can show initials. */
export const doctorPhoto = (d?: Partial<Doctor> | null): string | undefined => {
  const url = (d?.profileImage || "").trim();
  return url || undefined;
};

/** First letters of the doctor's name (e.g. "Dr. Ayaan Ali" → "AA"). */
export const doctorInitials = (d?: Partial<Doctor> | null) => {
  const raw = doctorDisplayName(d).replace(/^dr\.?\s+/i, "").trim();
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) || "DR").toUpperCase();
};

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
    listMySchedules: builder.query<DoctorSchedule[], void>({
      query: () => "/doctor/me/availability",
      transformResponse: (res: ApiResponse<DoctorSchedule[] | { items?: DoctorSchedule[] }>) => {
        const data = unwrapResult(res) as DoctorSchedule[] | { items?: DoctorSchedule[] }
        return Array.isArray(data) ? data : data?.items || []
      },
      providesTags: ["DoctorMe"],
    }),
    createMySchedule: builder.mutation<
      DoctorSchedule,
      Partial<DoctorSchedule> & { dayOfWeek: number; startTime: string; endTime: string }
    >({
      query: (body) => ({ url: "/doctor/me/availability", method: "POST", body }),
      transformResponse: (res: ApiResponse<DoctorSchedule>) => unwrapResult(res),
      invalidatesTags: ["DoctorMe"],
    }),
    deleteMySchedule: builder.mutation<{ deleted?: boolean }, string>({
      query: (id) => ({ url: `/doctor/me/availability/${id}`, method: "DELETE" }),
      invalidatesTags: ["DoctorMe"],
    }),
    copyMySchedule: builder.mutation<
      DoctorSchedule[],
      { fromDay: number; toDays: number[] }
    >({
      query: (body) => ({
        url: "/doctor/me/availability/copy",
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiResponse<DoctorSchedule[]>) => unwrapResult(res),
      invalidatesTags: ["DoctorMe"],
    }),
    listMyTimeOff: builder.query<DoctorTimeOff[], void>({
      query: () => "/doctor/me/time-off",
      transformResponse: (res: ApiResponse<DoctorTimeOff[] | { items?: DoctorTimeOff[] }>) => {
        const data = unwrapResult(res) as DoctorTimeOff[] | { items?: DoctorTimeOff[] }
        return Array.isArray(data) ? data : data?.items || []
      },
      providesTags: ["DoctorMe"],
    }),
    createMyTimeOff: builder.mutation<
      DoctorTimeOff,
      {
        date: string
        startTime?: string | null
        endTime?: string | null
        kind?: string
        reason?: string
      }
    >({
      query: (body) => ({ url: "/doctor/me/time-off", method: "POST", body }),
      transformResponse: (res: ApiResponse<DoctorTimeOff>) => unwrapResult(res),
      invalidatesTags: ["DoctorMe"],
    }),
    deleteMyTimeOff: builder.mutation<{ deleted?: boolean }, string>({
      query: (id) => ({ url: `/doctor/me/time-off/${id}`, method: "DELETE" }),
      invalidatesTags: ["DoctorMe"],
    }),
    getDoctorAvailability: builder.query<
      {
        status?: string
        reason?: string | null
        workingHours?: Array<{ start: string; end: string }>
        slots?: Array<{ time: string; iso: string; available: boolean }>
        nextAvailable?: string | null
      },
      { doctorId: string; date?: string }
    >({
      query: ({ doctorId, date }) => ({
        url: `/doctors/${doctorId}/availability`,
        params: date ? { date } : undefined,
      }),
      transformResponse: (res: ApiResponse<Record<string, unknown>>) =>
        unwrapResult(res) as {
          status?: string
          reason?: string | null
          workingHours?: Array<{ start: string; end: string }>
          slots?: Array<{ time: string; iso: string; available: boolean }>
          nextAvailable?: string | null
        },
    }),
  }),
});

export const {
  useListDoctorsQuery,
  useGetDoctorQuery,
  useGetMyDoctorProfileQuery,
  useUpsertMyDoctorProfileMutation,
  useListMySchedulesQuery,
  useCreateMyScheduleMutation,
  useDeleteMyScheduleMutation,
  useCopyMyScheduleMutation,
  useListMyTimeOffQuery,
  useCreateMyTimeOffMutation,
  useDeleteMyTimeOffMutation,
  useGetDoctorAvailabilityQuery,
} = doctorsApi;
