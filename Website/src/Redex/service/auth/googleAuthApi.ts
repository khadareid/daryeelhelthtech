import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "@/lib/apiBaseQuery";
interface GoogleUserInfo {
  accessToken: string;
  refreshToken: string;
  email: string;
  name: string;
  image: string;
  role: string; 
  userId: number; 
}

export const googleAuthApi = createApi({
  reducerPath: "googleAuthApi",
  baseQuery: apiBaseQuery,
  endpoints: (builder) => ({
    saveGoogleUser: builder.mutation<GoogleUserInfo, GoogleUserInfo>({
      query: (body) => ({
        url: "/auth/google", 
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useSaveGoogleUserMutation } = googleAuthApi;
