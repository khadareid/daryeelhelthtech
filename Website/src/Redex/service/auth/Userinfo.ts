// src/redux/auth/Userinfo.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { env } from "@/config/env";

/* ==================================================================
   TYPES
================================================================== */

export interface UserInfoState {
  userId: string;
  name: string;
  email: string;
  image: string;
  phone: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  // ↓ NEW
  isAuthenticated: boolean;
  hydrating: boolean;
}

export interface SetUserPayload {
  userId: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

/* ==================================================================
   INITIAL STATE
================================================================== */

const EMPTY_STATE: UserInfoState = {
  userId: "",
  name: "",
  email: "",
  image: "",
  phone: "",
  role: "",
  accessToken: "",
  refreshToken: "",
  emailVerified: false,
  phoneVerified: false,
  // ↓ NEW
  isAuthenticated: false,
  hydrating: false,
};

const storedUserInfo =
  typeof window !== "undefined" ? localStorage.getItem("userInfo") : null;

const initialState: UserInfoState = storedUserInfo
  ? {
      ...EMPTY_STATE,
      ...JSON.parse(storedUserInfo),
      // derive auth state from what's in storage
      isAuthenticated: true,
      hydrating: false,
    }
  : { ...EMPTY_STATE, hydrating: false };

/* ==================================================================
   SLICE
================================================================== */

const userInfo = createSlice({
  name: "userInfo",
  initialState,
  reducers: {
    /* ---------- SET USER (login / register) ---------- */
    setUser: (state, action: PayloadAction<SetUserPayload>) => {
      Object.assign(state, {
        ...EMPTY_STATE,
        ...action.payload,
        isAuthenticated: true,
        hydrating: false,
      });
      localStorage.setItem("userInfo", JSON.stringify(state));
      if (action.payload.accessToken) {
        localStorage.setItem("accessToken", action.payload.accessToken);
      }
      if (action.payload.refreshToken) {
        localStorage.setItem("refreshToken", action.payload.refreshToken);
      }
    },

    /* ---------- UPDATE TOKENS (after refresh) ---------- */
    updateTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem("userInfo", JSON.stringify(state));
      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
    },

    /* ---------- UPDATE PROFILE (after profile edit) ---------- */
    updateUser: (state, action: PayloadAction<Partial<UserInfoState>>) => {
      Object.assign(state, action.payload);
      localStorage.setItem("userInfo", JSON.stringify(state));
    },

    /* ---------- LOGOUT ---------- */
    logout: (state) => {
      const refreshToken = state.refreshToken;

      if (refreshToken) {
        axios
          .post(
            `${env.apiUrl}/auth/logout`,
            { refreshToken },
            { headers: { Authorization: `Bearer ${state.accessToken}` } }
          )
          .catch(() => {
            /* ignore — user is logging out anyway */
          });
      }

      localStorage.removeItem("userInfo");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      // reset state; keep hydrating:false so guards don't spin forever
      Object.assign(state, EMPTY_STATE, { hydrating: false });
    },
  },
});

export const { setUser, updateTokens, updateUser, logout } = userInfo.actions;
export default userInfo;