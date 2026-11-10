import { configureStore } from "@reduxjs/toolkit"
import { authApi } from "../service/auth/authApi"
import { googleAuthApi } from "../service/auth/googleAuthApi"
import { usersApi } from "../service/users/UsersApi"
import { dashboardApi } from "../service/Dashboard/Dashboard"
import { notificationsApi } from "../service/notifications/NotificationsApi"
import userInfoSlice from "../service/auth/Userinfo"
import uiSlice from "@/components/ui/uiSlice"
import { dailyHealthLogApi } from "../service/DailyHealthLog/DailyHealthLog"
import { appointmentsApi } from "../service/appointments/AppointmentsApi"
import { adminApi } from "../service/admin/AdminApi"
import { doctorsApi } from "../service/doctors/DoctorsApi"
import { healthApi } from "../service/health/HealthApi"
import { careApi } from "../service/care/CareApi"
import { healthcareApi } from "../service/healthcare/HealthcareApi"

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [googleAuthApi.reducerPath]: googleAuthApi.reducer,
    userInfo: userInfoSlice.reducer,
    ui: uiSlice.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [dailyHealthLogApi.reducerPath]: dailyHealthLogApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [appointmentsApi.reducerPath]: appointmentsApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [doctorsApi.reducerPath]: doctorsApi.reducer,
    [healthApi.reducerPath]: healthApi.reducer,
    [careApi.reducerPath]: careApi.reducer,
    [healthcareApi.reducerPath]: healthcareApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      googleAuthApi.middleware,
      usersApi.middleware,
      dailyHealthLogApi.middleware,
      dashboardApi.middleware,
      notificationsApi.middleware,
      appointmentsApi.middleware,
      adminApi.middleware,
      doctorsApi.middleware,
      healthApi.middleware,
      careApi.middleware,
      healthcareApi.middleware
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
