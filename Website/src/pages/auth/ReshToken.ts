import axios from "axios"
import { env } from "@/config/env"
import { store } from "@/Redex/store/store"
import { logout, updateTokens } from "@/Redex/service/auth/Userinfo"

function isTokenExpired(token: string): boolean {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""))
    return (payload.exp || 0) * 1000 < Date.now()
  } catch {
    return true
  }
}

const axiosInstance = axios.create({
  baseURL: env.apiUrl,
})

axiosInstance.interceptors.request.use(async (config) => {
  let state = store.getState()
  let accessToken = state?.userInfo?.accessToken

  if (isTokenExpired(accessToken)) {
    try {
      let refreshToken = state?.userInfo?.refreshToken

      if (!refreshToken) {
        refreshToken = JSON.parse(localStorage.getItem("userInfo")!)?.refreshToken
      }

      if (!refreshToken || isTokenExpired(refreshToken)) {
        store.dispatch(logout())
        return Promise.reject("Session expired. Please log in again.")
      }

      const { data } = await axios.post(`${env.apiUrl}/refresh`, { refreshToken })
      const nextAccess = data?.result?.accessToken || data?.accessToken
      const nextRefresh = data?.result?.refreshToken || data?.refreshToken || refreshToken

      if (!nextAccess) {
        store.dispatch(logout())
        return Promise.reject("Session expired. Please log in again.")
      }

      store.dispatch(
        updateTokens({
          accessToken: nextAccess,
          refreshToken: nextRefresh,
        })
      )
      accessToken = nextAccess
    } catch {
      store.dispatch(logout())
      return Promise.reject("Session expired. Please log in again.")
    }
  }

  if (accessToken) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

export default axiosInstance
