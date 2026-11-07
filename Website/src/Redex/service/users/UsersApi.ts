import { createApi } from "@reduxjs/toolkit/query/react"
import { apiBaseQuery } from "@/lib/apiBaseQuery"
import { unwrapList, unwrapResult } from "@/Redex/lib/ownedApi"
import type {
  ApiResponse,
  AuthResponse,
  Paginated,
  User,
  UserInput,
  UserLoginInput,
  UserUpdateInput,
} from "@/Redex/types/Types"

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: apiBaseQuery,
  tagTypes: ["User", "Profile"],
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, UserInput>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    login: builder.mutation<AuthResponse, UserLoginInput>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User", "Profile"],
    }),

    refreshToken: builder.mutation<
      ApiResponse<{ accessToken: string; refreshToken: string }>,
      { refreshToken: string }
    >({
      query: (body) => ({
        url: "/refresh",
        method: "POST",
        body,
      }),
    }),

    getMyProfile: builder.query<User, void>({
      query: () => ({ url: "/users/me", method: "GET" }),
      transformResponse: (response: ApiResponse<User>) => unwrapResult(response),
      providesTags: [{ type: "Profile", id: "ME" }],
    }),

    updateMyProfile: builder.mutation<User, UserUpdateInput>({
      query: (body) => ({
        url: "/users/me",
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<User>) => unwrapResult(response),
      invalidatesTags: [{ type: "Profile", id: "ME" }, "User"],
    }),

    changeMyPassword: builder.mutation<
      { isSuccess: boolean; message?: string },
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: "/users/me/password",
        method: "PUT",
        body,
      }),
    }),

    deleteMe: builder.mutation<{ isSuccess: boolean; message?: string }, void>({
      query: () => ({
        url: "/users/me",
        method: "DELETE",
      }),
      invalidatesTags: ["User", "Profile"],
    }),

    getUsers: builder.query<
      Paginated<User>,
      { page?: number; limit?: number; role?: string; search?: string } | void
    >({
      query: (params) => ({
        url: "/users",
        method: "GET",
        params: params ?? undefined,
      }),
      transformResponse: (response: ApiResponse<Paginated<User>>) => {
        const raw = unwrapResult(response)
        if (raw && typeof raw === "object" && "items" in raw) return raw
        return {
          items: unwrapList(response),
          meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }
      },
      providesTags: ["User"],
    }),

    getOneUser: builder.query<User, string>({
      query: (id) => ({ url: `/users/${id}`, method: "GET" }),
      transformResponse: (response: ApiResponse<User>) => unwrapResult(response),
      providesTags: (_r, _e, id) => [{ type: "User", id }],
    }),

    createUser: builder.mutation<User, UserInput & { role?: string }>({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<User>) => unwrapResult(response),
      invalidatesTags: ["User"],
    }),

    updateUser: builder.mutation<
      User,
      { id: string; data: UserUpdateInput & { role?: string; isActive?: boolean; isSuspended?: boolean; password?: string } }
    >({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: ApiResponse<User>) => unwrapResult(response),
      invalidatesTags: (_r, _e, { id }) => [{ type: "User", id }, "User"],
    }),

    deleteUser: builder.mutation<{ isSuccess: boolean; message?: string }, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshTokenMutation,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useChangeMyPasswordMutation,
  useDeleteMeMutation,
  useGetUsersQuery,
  useGetOneUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi
