// src/service/users/UsersApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { apiBaseQuery } from '@/lib/apiBaseQuery';
import {   User,
  UserInput,
  UserUpdateInput,
  UserLoginInput,
  ApiResponse,
  AuthResponse, } from '@/Redex/types/Types';

/* ==================================================================
   RESPONSE SHAPES
================================================================== */

interface UsersListResponse {
  isSuccess: boolean;
  users: User[];
  total?: number;
}

interface UserResponse {
  isSuccess: boolean;
  message?: string;
  user?: User;
}

/* ==================================================================
   API
================================================================== */

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: apiBaseQuery,
  tagTypes: ['User', 'Profile'],
  endpoints: (builder) => ({
    /* ---------- AUTH ---------- */

    register: builder.mutation<AuthResponse, UserInput>({
      query: (body) => ({
        url: '/user/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    login: builder.mutation<AuthResponse, UserLoginInput>({
      query: (body) => ({
        url: '/user/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User', 'Profile'],
    }),

    logout: builder.mutation<{ isSuccess: boolean; message: string }, { refreshToken: string }>({
      query: (body) => ({
        url: '/user/logout',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User', 'Profile'],
    }),

    /* ---------- PROFILE (self) ---------- */

    getMyProfile: builder.query<User, void>({
      query: () => ({ url: '/user/profile/me', method: 'GET' }),
      transformResponse: (response: UserResponse) =>
        (response.user ?? response) as User,
      providesTags: [{ type: 'Profile', id: 'ME' }],
    }),

    updateMyProfile: builder.mutation<
      UserResponse & { result?: { accessToken: string; refreshToken: string } },
      UserUpdateInput & {
        avatarUrl?: string;
        picture?: string;
        profile?: {
          nationality?: string;
          country?: string;
          region?: string;
          city?: string;
          district?: string;
          addressLine?: string;
          occupation?: string;
          maritalStatus?: string;
          bloodType?: string;
          height?: number | null;
          weight?: number | null;
          alternatePhone?: string;
          preferredLanguage?: string;
          preferredContact?: string;
        };
      }
    >({
      query: (body) => ({
        url: '/user/profile/me',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Profile', id: 'ME' }, 'User'],
    }),

    changeMyPassword: builder.mutation<
      { isSuccess: boolean; message: string },
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: '/user/profile/me/password',
        method: 'PUT',
        body,
      }),
    }),

    changeMyRole: builder.mutation<
      UserResponse & {
        result?: {
          accessToken?: string
          refreshToken?: string
          applicationPending?: boolean
          application?: unknown
        }
      },
      { role: string; reason?: string }
    >({
      query: (body) => ({
        url: '/user/profile/me/role',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Profile', id: 'ME' }, 'User'],
    }),

    getMySessions: builder.query<{ isSuccess: boolean; sessions: any[] }, void>({
      query: () => ({ url: '/user/profile/me/sessions', method: 'GET' }),
      providesTags: ['Profile'],
    }),

    /* ---------- PROFILE (by id) ---------- */

    getUserProfile: builder.query<User, string>({
      query: (userid) => ({
        url: `/user/profile/${userid}`,
        method: 'GET',
      }),
      transformResponse: (response: UserResponse) =>
        (response.user ?? response) as User,
      providesTags: (_r, _e, userid) => [{ type: 'Profile', id: userid }],
    }),

    /* ---------- ADMIN ---------- */

    getUsers: builder.query<
      UsersListResponse,
      { page?: number; limit?: number; role?: string; search?: string } | void
    >({
      query: (params) => ({
        url: '/users',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['User'],
    }),

    getOneUser: builder.query<User, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: UserResponse) => (response.user ?? response) as User,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),

    updateUser: builder.mutation<
      UserResponse,
      { id: string; data: UserUpdateInput & { password?: string } }
    >({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }, 'User'],
    }),

    deleteUser: builder.mutation<{ isSuccess: boolean; message: string }, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    toggleActivateUser: builder.mutation<
      { isSuccess: boolean; message: string; user: User },
      string
    >({
      query: (id) => ({
        url: `/users/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: (_r, _e, id) => [{ type: 'User', id }, 'User'],
    }),

    changeUserRole: builder.mutation<
      { isSuccess: boolean; message: string; result: User },
      { id: string; role: string }
    >({
      query: ({ id, role }) => ({
        url: `/users/${id}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }, 'User'],
    }),
  }),
});

/* ==================================================================
   HOOKS
================================================================== */

export const {
  // Auth
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,

  // Self profile
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useChangeMyPasswordMutation,
  useChangeMyRoleMutation,
  useGetMySessionsQuery,

  // Public profile
  useGetUserProfileQuery,

  // Admin
  useGetUsersQuery,
  useGetOneUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleActivateUserMutation,
  useChangeUserRoleMutation,
} = usersApi;
