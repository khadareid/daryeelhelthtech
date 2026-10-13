// services/api/authApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "@/lib/apiBaseQuery";
 

// Payload types
interface SendCodePayload {
  email: string;
}

interface VerifyCodePayload {
  email: string;
  code: string;
}

// Response types (optional — adjust as needed)
interface ApiResponse {
  message: string;
  result?: any;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: apiBaseQuery,
  endpoints: (builder) => ({
    // 1. Send Email Code
    sendEmailCode: builder.mutation<ApiResponse, SendCodePayload>({
      query: (body) => ({
        url: "/auth/email/sendcode", 
        method: "POST",
        body,
      }),
    }),

    // 2. Verify Code
    verifyEmailCode: builder.mutation<ApiResponse, VerifyCodePayload>({
      query: (body) => ({
        url: "/auth/email/verify-code",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useSendEmailCodeMutation, useVerifyEmailCodeMutation } = authApi;
